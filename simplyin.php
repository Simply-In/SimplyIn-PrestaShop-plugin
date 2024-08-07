<?php
/**
 * Copyright 2024-2027 Simply.IN Sp. z o.o.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under the EUPL-1.2 or later.
 * You may not use this work except in compliance with the Licence.
 *
 * Copy of the Licence is available at:
 * https://joinup.ec.europa.eu/software/page/eupl
 * It is bundled with this package in the file LICENSE.txt
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an as is basis,
 * without warranties or conditions of any kind, either express or implied.
 * Check the Licence for the specific language governing permissions
 * and limitations under the License.
 *
 * @author   Simply.IN Sp. z o.o.
 * @copyright 2024-2027 Simply.IN Sp. z o.o.
 * @license   https://joinup.ec.europa.eu/software/page/eupl
 */
if (!defined('_PS_VERSION_')) {
	exit;
}
class Simplyin extends Module
{
	protected $config_form = false;

    public function __construct()
    {
        $this->name = 'simplyin';
        $this->tab = 'shipping_logistics';
		$this->version = "1.1.0";
        $this->author = 'SimplyIN';
        $this->need_instance = 1;
        $this->bootstrap = true;
        parent::__construct();
        $this->displayName = 'SimplyIN';
        $this->description = "simplyin module - quick checkout process";
        $this->confirmUninstall = $this->l('');
        $this->ps_versions_compliancy = ['min' => '8.0', 'max' => _PS_VERSION_];
    }

	public function install()
	{
		PrestaShopLogger::addLog('install', 1, null, 'Order', '', true);

		Configuration::updateValue('SIMPLYIN_LIVE_MODE', false);
		include dirname(__FILE__) . '/sql/install.php';

		return parent::install()
			&& $this->registerHook('header')
			&& $this->registerHook('actionOrderStatusPostUpdate')
			&& $this->registerHook('displayBackOfficeHeader')
			&& $this->registerHook('displayOrderConfirmation')
			&& $this->registerHook('actionCarrierProcess')
			&& $this->registerHook('updateOrderStatus')
			&& $this->registerHook('actionValidateOrder');
	}

	public function encrypt($plaintext, $secret_key, $cipher = 'aes-256-cbc')
	{
		$ivlen = openssl_cipher_iv_length($cipher);
		$iv = openssl_random_pseudo_bytes($ivlen);
		$ciphertext_raw = openssl_encrypt($plaintext, $cipher, $secret_key, OPENSSL_RAW_DATA, $iv);
		if ($ciphertext_raw === false) {
			return false;
		}

		return base64_encode($iv . $ciphertext_raw);
	}

	public function hashEmail($order_email)
	{
		return hash('sha256', '--' . $order_email . '--');
	}

    public function send_encrypted_data($encrypted_data)
    {
        $backend_url = "https://prod.backend.simply.in/api/";
        $url = $backend_url . 'encryption/saveEncryptedOrderStatusChange';
        $base_url = __PS_BASE_URI__;
        $headers = ['Content-Type: application/json', 'Origin: ' . $base_url];
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $encrypted_data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Return the response as a string instead of outputting it
        // Execute cURL session
        $response = curl_exec($ch);
        curl_close($ch);

		return $response;
	}

	public function getSecretKey($order_email)
	{
		return hash('sha256', '__' . $order_email . '__', true);
	}

	public function hookActionOrderStatusPostUpdate($params)
	{
		$newOrderStatus = $params['newOrderStatus']->template;
		$stopStatuses = [
			'order_canceled',
			'payment_error',
			'cheque',
			'bankwire',
			'cashondelivery',
			'preparation',
			'payment',
			'outofstock',
			'refund',
		];
		if (in_array($newOrderStatus, $stopStatuses, true)) {
			return;
		}

		$id_order = $params['id_order'];
		$order = new Order($id_order);

		$order_reference = $order->reference;

		$shipping_data = $order->getShipping();

		$tracking_numbers = [];

		foreach ($shipping_data as $carrier) {
			$carrierName = $carrier["carrier_name"];

			$carrierSlug = Tools::str2url($carrierName);
			$tracking_numbers[] = array(
				"number" => $carrier['tracking_number'],
				"provider" => $carrierSlug
			);

		}


		$customer = $order->getCustomer();
		$order_email = $customer->email;

		if (empty($order_email)) {
			return;
		}
		$apiKey = Configuration::get('SIMPLYIN_SECRET_KEY');

		$body_data = [
			'email' => $order_email,
			'shopOrderNumber' => $order_reference,
			'newOrderStatus' => $newOrderStatus,
			'apiKey' => $apiKey,
			'trackings' => $tracking_numbers,
		];

		// PrestaShopLogger::addLog(json_encode($body_data), 1, null, 'Order', 10, true);

		$plaintext = json_encode($body_data, JSON_UNESCAPED_SLASHES);

		$key = $this->getSecretKey($order_email);

		$encryptedData = $this->encrypt($plaintext, $key);

		$hashedEmail = $this->hashEmail($order_email);

		$orderData = [];
		$orderData['encryptedOrderStatusChangeContent'] = $encryptedData;
		$orderData['hashedEmail'] = $hashedEmail;

		$this->send_encrypted_data(json_encode($orderData));
	}

	public function hookDisplayOrderConfirmation($params)
	{
		// $orderId = $params['order']->id;
		// $customerId = $params['customer']->id;

		$context = Context::getContext();
		$shopName = Configuration::get('PS_SHOP_NAME');
		// Get the order object from the params
		$order = $params['order'];
		// $currency = $order->getCurrency();
		// Get the customer's delivery and billing address id from the order
		$deliveryAddressId = $order->id_address_delivery;
		$billingAddressId = $order->id_address_invoice;

		// Create an Address object from the address id
		$deliveryAddress = new Address($deliveryAddressId);
		$billingAddress = new Address($billingAddressId);

		// Fetch details of delivery and billing address
		$deliveryCountry = new Country($deliveryAddress->id_country);
		$deliveryState = new State($deliveryAddress->id_state);

		$billingCountry = new Country($billingAddress->id_country);
		$billingState = new State($billingAddress->id_state);

		$customer = new Customer($order->id_customer);
		$currencyId = $order->id_currency;
		$currency = Currency::getCurrencyInstance((int) $currencyId);
		$currencyISO = $currency->iso_code;

		$customer_info = [
			'id_order' => (int) $order->id,
			'reference' => $order->reference,
			'total_paid' => $order->total_paid,
			// 'quantity' => (int) $order->quantity,
			'id_customer' => $this->context->customer->id,
			// 'data-order' => $params->order,
		];

		$customer_info['products'] = [];

		$orderProducts = $order->getProducts();

		foreach ($orderProducts as $product) {
			$productId = $product['product_id'];

			$productName = $product['product_name'];

			$productImage = Image::getCover($productId);
			if ($productImage) {
				// $productImageUrl = _PS_BASE_URL_ . _THEME_PROD_DIR_ . $productImage['id_image'] . '-large_default/' . $productName . '.jpg';
				$productImageUrl = _PS_BASE_URL_ . _THEME_PROD_DIR_ . $productImage['id_image'] . '-' . ImageType::getFormattedName('large') . '/' . $productName . '.jpg';
			} else {
				// If no image is available, you can use a default image or handle it as needed
				$productImageUrl = _PS_IMG_ . 'p/' . (int) $productId . '-' . (int) $product['id_image'] . '.jpg';
			}

			$productThumbnailId = Product::getCover($productId)['id_image'];

			$productObj = new Product($productId, false, $context->language->id);

			$productDescription = strip_tags($productObj->description);

			$productLink = $context->link->getProductLink($product);
			$thumbnailUrl = $context->link->getImageLink($productName, $productThumbnailId, ImageType::getFormattedName('small'));
			$customer_info['products'][] = [
				'name' => $product['product_name'],
				'quantity' => (int) $product['product_quantity'],
				'price' => $product['product_price'],
				'productDescription' => $productDescription,
				'url' => $productLink,
				'thumbnailUrl' => $thumbnailUrl,
				'currency' => $currencyISO,
			];
		}

		$context = Context::getContext();
		$id_lang = $context->language->id; // this will give you the id of the current language
		$language_code = $context->language->language_code; // this will give you the language code i.e 'en' for English
		$language_name = $context->language->name; // this will give you the name of the language i.e 'English'

		$carrier = new Carrier((int) $order->id_carrier);

		$delivery_method = [
			'id_reference' => $carrier->id_reference,
			// 'id_tax_rules_group' => $carrier->id_tax_rules_group,
			// 'id_carrier' => $carrier->id_carrier,
			'deleted' => $carrier->deleted,
			'shipping_handling' => $carrier->shipping_handling,
			'range_behavior' => $carrier->range_behavior,
			'is_module' => $carrier->is_module,
			'is_free' => $carrier->is_free,
			'shipping_external' => $carrier->shipping_external,
			'need_range' => $carrier->need_range,
			'external_module_name' => $carrier->external_module_name,
			'shipping_method' => $carrier->shipping_method,
			'position' => $carrier->position,
			// 'win_distance' => $carrier->win_distance,
			// 'max_delivery_delay' => $carrier->max_delivery_delay,
			'grade' => $carrier->grade,
			'url' => $carrier->url,
			'active' => $carrier->active,
			'delay' => $carrier->delay,
			'name' => $carrier->name,
			'all' => $carrier,
		];

		$order_carrier = new OrderCarrier((int) $order->getIdOrderCarrier());

		$order_id = $order_carrier->id_order;

		// getting delivery point from inpost module
		if (Module::isInstalled('inpostshipping') && Module::isEnabled('inpostshipping')) {
			$module = Module::getInstanceByName('inpostshipping');
			try {
				$context = $module->getContext();
				$customerChoiceDataProvider = $module->getService('inpost.shipping.data_provider.customer_choice');
				$deliveryPoint = $customerChoiceDataProvider->getDataByCartId($order->id_cart)->point;
			} catch (Exception $e) {
				echo 'Service does not exist: ', $e->getMessage(), "\n";
			}
		}
		$order_number = $order->getUniqReference();
		$order_payments = OrderPayment::getByOrderReference($order->reference);
		Media::addJsDef(
			[
				'customer_data' => $customer_info,
				'customer' => $customer,
				'delivery_address' => $deliveryAddress,
				'billing_address' => $billingAddress,
				'delivery_State' => $deliveryState,
				'billing_State' => $billingState,
				'billing_country' => $billingCountry,
				'delivery_country' => $deliveryCountry,
				'carrier' => $delivery_method,
				'order_carrier' => $order_carrier,
				'params' => $params,
				'totalPaid' => $order->total_paid,
				'currency' => $currencyISO,
				'language_code' => $language_code,
				'language_name' => $language_name,
				'orderProducts' => $order->getProducts(),
				'deliveryPoint' => $deliveryPoint ?? null,
				'shopName' => $shopName,
				'order_number' => $order_number,
				'order' => $order,
				'order_payments' => $order_payments,
			]
		);

		$this->context->controller->registerJavascript(
			'simplyin',
			// Unique id
			'modules/' . $this->name . '/views/js/orderConfirmation.js',
			// JS file location
			['position' => 'bottom', 'priority' => 150] // Position and priority
		);

		// return $this->display(__FILE__, 'orderConfirmation.tpl');
	}

	public function uninstall()
	{
		Configuration::deleteByName('SIMPLYIN_LIVE_MODE');

		include dirname(__FILE__) . '/sql/uninstall.php';

		return parent::uninstall();
	}

	/**
	 * Load the configuration form
	 */
	public function getContent()
	{
		PrestaShopLogger::addLog('getcontent', 1, null, 'Order', '', true);

		if (((bool) Tools::isSubmit('submitSimplyinModule')) == true) {
			$this->postProcess();
		}

		// Add this line to retrieve the checkbox value from the database
		$this->context->smarty->assign('simply_save_checkbox', Configuration::get('SIMPLY_SAVE_CHECKBOX'));

		$this->context->smarty->assign('module_dir', $this->_path);

		$output = $this->context->smarty->fetch($this->local_path . 'views/templates/admin/configure.tpl');

		return $output . $this->renderForm();
	}

	/**
	 * Create the form that will be displayed in the configuration of your module.
	 */
	protected function renderForm()
	{
		$helper = new HelperForm();

		$helper->show_toolbar = false;
		$helper->table = $this->table;
		$helper->module = $this;
		$helper->default_form_language = $this->context->language->id;
		$helper->allow_employee_form_lang = Configuration::get('PS_BO_ALLOW_EMPLOYEE_FORM_LANG', 0);

		$helper->identifier = $this->identifier;
		$helper->submit_action = 'submitSimplyinModule';
		$helper->currentIndex = $this->context->link->getAdminLink('AdminModules', false)
			. '&configure=' . $this->name . '&tab_module=' . $this->tab . '&module_name=' . $this->name;
		$helper->token = Tools::getAdminTokenLite('AdminModules');

		$helper->tpl_vars = [
			'fields_value' => $this->getConfigFormValues(),
			/* Add values for your inputs */
			'languages' => $this->context->controller->getLanguages(),
			'id_language' => $this->context->language->id,
		];

		return $helper->generateForm([$this->getConfigForm()]);
	}

	/**
	 * Create the structure of your form.
	 */
	protected function getConfigForm()
	{
		// PrestaShopLogger::addLog('get config form', 1, null, 'Order', '', true);

		$this->context->smarty->assign('localPath', _PS_BASE_URL_ . $this->_path);

		return [
			'form' => [
				'legend' => [
					'title' => $this->l('Settings'),
					'icon' => 'icon-cogs',
				],
				'input' => [
					[
						'type' => 'html',
						'name' => 'SIMPLYIN_IMAGE_DISPLAY',
						'html_content' => '<style>
						#SIMPLYIN_SECRET_KEY{
							// border: 2px solid red;
						}

						@media (min-width: 1200px) {
							.bootstrap .col-lg-offset-3 {
								margin-left: 0;
							}
						}

						.form-wrapper>div.form-group:nth-child(4){
							display: flex;
						}
						.form-wrapper>div.form-group:nth-child(4)>div{
							width: 100% !important;
						}
						.form-wrapper>div.form-group:nth-child(4)>div>div{
							width: 100% !important;
						}
						.form-wrapper>div.form-group:nth-child(4)>div input{
							width: 100% !important;
						}

						#module_form{
							font-size: 14px;
						}

						#admin-simply-title{
							color:black;
							font-weight: bold;
							font-size:18px;
						}
						</style>
						
						',
					],
					[
						'type' => 'html',
						'name' => 'SIMPLYIN_IMAGE_DISPLAY',
						'html_content' => '
						<a href="https://www.simply.in" target="_blank">
						<svg width="155" height="24" viewBox="0 0 155 24" fill="none" xmlns="http://www.w3.org/2000/svg"  {...props}>
						<g clipPath="url(#clip0_2966_28163)" style="transform: scale(0.8)" >
							<path d="M16.7406 3.14222C16.7406 4.49662 15.6029 5.58014 14.1943 5.58014C13.6525 5.58014 13.6525 5.58014 12.1898 5.09256C11.3771 4.82168 10.402 4.65915 9.6435 4.65915C7.96404 4.65915 6.71799 5.47179 6.71799 6.55531C6.71799 7.0429 7.04305 7.58466 7.53063 7.85554C8.23492 8.28895 8.23492 8.28894 10.6187 8.88488C16.1988 10.2393 18.5284 12.4063 18.5284 16.0903C18.5284 18.0948 17.7157 19.991 16.3613 21.3454C14.7902 22.9165 12.1356 23.7833 8.93921 23.7833C3.90084 23.7833 0.379395 22.158 0.379395 19.9368C0.379395 18.5824 1.51709 17.4447 2.87149 17.4447C3.57578 17.4447 3.57578 17.4447 6.33876 18.4199C7.20558 18.7449 8.2891 18.9075 9.15592 18.9075C11.1063 18.9075 12.3523 17.9323 12.3523 16.5237C12.3523 15.8194 12.0272 15.2235 11.3771 14.8984C10.6728 14.465 10.1311 14.3025 7.36811 13.544C4.38842 12.623 3.25073 12.1354 2.1672 11.1603C1.08368 10.2393 0.541923 8.77653 0.541923 7.0429C0.541923 2.76299 4.4426 -0.270874 9.86021 -0.270874C13.8692 -0.270874 16.7406 1.1377 16.7406 3.14222Z" fill="#303030" />
							<path d="M21.2373 3.46727C21.2373 2.22122 21.2915 1.89616 21.6165 1.30023C22.1041 0.541761 23.1335 0 24.1628 0C25.1922 0 26.2215 0.541761 26.6549 1.30023C26.98 1.89616 27.0341 2.16704 27.0341 3.46727V19.991C27.0341 21.237 26.98 21.5621 26.6549 22.158C26.2215 22.9165 25.1922 23.4582 24.1628 23.4582C23.0793 23.4582 22.1041 22.9165 21.6165 22.158C21.2915 21.5621 21.2373 21.2912 21.2373 19.991V3.46727Z" fill="#303030" />
							<path d="M35.1606 20.3702C34.9439 21.6163 34.8355 21.9413 34.4021 22.4831C33.9687 23.079 33.0477 23.4582 32.1267 23.4582C30.5014 23.4582 29.3096 22.3205 29.3096 20.8036C29.3096 20.4786 29.3637 20.0993 29.4721 19.5576L32.4518 2.92551C32.7768 1.02935 34.1312 0 36.3525 0C38.0319 0 39.4405 0.866817 39.9281 2.22122L44.1538 13.9774L48.0545 2.7088C48.6504 0.975169 50.1132 0 51.8468 0C53.743 0 55.3683 1.1377 55.6391 2.7088L58.8355 19.5034C58.9981 20.316 58.9981 20.4786 58.9981 20.8578C58.9981 22.3747 57.752 23.5124 56.1267 23.5124C55.2057 23.5124 54.3389 23.1332 53.8513 22.5372C53.4179 21.9955 53.3096 21.7246 53.0387 20.4244L51.0884 9.69752L47.6753 20.3702C47.1335 21.9955 46.971 22.3747 46.4834 22.754C45.9416 23.2415 45.1832 23.4582 44.3163 23.4582C42.6369 23.4582 41.7159 22.754 41.12 20.9661L37.0567 9.64334L35.1606 20.3702Z" fill="#303030" />
							<path d="M67.2329 19.991C67.2329 21.237 67.1787 21.5621 66.8536 22.158C66.4202 22.9165 65.3909 23.4583 64.3615 23.4583C63.278 23.4583 62.3029 22.9165 61.8153 22.158C61.4902 21.5621 61.436 21.237 61.436 19.991V4.1174C61.436 2.49212 61.5444 2.11288 62.032 1.46277C62.7363 0.65013 63.6031 0.325073 64.9033 0.325073H65.6076H70.8085C73.6798 0.325073 75.6843 0.92101 77.2554 2.22124C78.9349 3.62981 79.9101 5.79686 79.9101 8.01808C79.9101 9.91424 79.2058 11.8646 77.9597 13.219C76.497 14.8443 74.3841 15.6569 71.567 15.6569H67.1787V19.991H67.2329ZM70.1584 11.1061C72.488 11.1061 74.0049 9.86006 74.0049 8.01808C74.0049 6.12191 72.5963 4.87586 70.4293 4.87586H67.2329V11.1061H70.1584Z" fill="#303030" />
							<path d="M92.9663 18.4199C94.2123 18.4199 94.5374 18.474 95.1333 18.7449C95.8918 19.07 96.4335 19.9368 96.4335 20.7494C96.4335 21.6163 95.8918 22.4831 95.1333 22.8081C94.5374 23.079 94.2665 23.1332 92.9663 23.1332H86.1401C82.9979 23.2957 81.6435 22.0497 81.806 19.1783V3.46727C81.806 2.22122 81.8602 1.89616 82.1852 1.30023C82.6186 0.541761 83.648 0 84.7315 0C85.7608 0 86.7902 0.541761 87.2236 1.30023C87.5487 1.89616 87.6028 2.16704 87.6028 3.46727V18.4199H92.9663Z" fill="#303030" />
							<path d="M106.348 19.991C106.348 21.237 106.294 21.5621 105.969 22.158C105.535 22.9165 104.506 23.4582 103.477 23.4582C102.393 23.4582 101.418 22.9165 100.93 22.158C100.605 21.5621 100.551 21.2912 100.551 19.991V12.3521L94.4834 4.82167C93.6708 3.79233 93.3999 3.19639 93.3999 2.54628C93.3999 1.1377 94.7001 0 96.3254 0C97.5173 0 98.1132 0.379233 99.1967 1.84199L103.531 7.36795L107.973 1.78781C109.111 0.325056 109.761 0 110.899 0C112.47 0 113.824 1.19187 113.824 2.54628C113.824 3.30474 113.553 3.79233 112.632 4.93002L106.348 12.4063V19.991Z" fill="#303030" />
							<path d="M126.23 11.7562C126.23 10.2393 126.718 8.99327 127.639 7.96392C127.91 7.63886 128.235 7.42216 128.614 7.20545C128.831 7.0971 128.993 6.82622 128.993 6.60952V3.41313C128.993 1.6795 127.747 0.162565 126.068 -0.0541394C124.009 -0.32502 122.221 1.30026 122.221 3.30478V20.0452C122.221 21.7788 123.467 23.2957 125.147 23.5125C127.205 23.7833 128.993 22.1581 128.993 20.1535V16.9571C128.993 16.6863 128.831 16.4696 128.614 16.3612C128.289 16.1445 127.964 15.8736 127.639 15.6027C126.664 14.5734 126.23 13.2732 126.23 11.7562Z" fill="#0000E9" />
							<path d="M150.225 0.0424545C148.643 0.262389 147.47 1.80193 147.47 3.56141V11.4241L139.46 1.19711C139.205 0.867209 138.898 0.592291 138.541 0.42734C138.49 0.372356 138.388 0.372356 138.337 0.317373C138.337 0.317373 138.286 0.317373 138.286 0.262389C138.235 0.262389 138.184 0.207405 138.082 0.207405C138.031 0.207405 137.98 0.152422 137.98 0.152422C137.929 0.152422 137.878 0.0974381 137.827 0.0974381C137.776 0.0974381 137.725 0.0424545 137.674 0.0424545C137.623 0.0424545 137.572 0.0424545 137.521 0.0424545C137.47 0.0424545 137.419 0.0424545 137.368 0.0424545C137.317 0.0424545 137.266 0.0424545 137.215 0.0424545C137.164 0.0424545 137.113 0.0424545 137.113 0.0424545C137.011 0.0424545 136.909 0.0424545 136.807 0.0424545C136.194 0.0974381 135.582 0.372356 135.072 0.812225C134.613 1.25209 134.256 1.80193 134.103 2.40675C134.103 2.51672 134.052 2.5717 134.052 2.68167C134.052 2.73665 134.052 2.73665 134.052 2.79164C134.052 2.84662 134.052 2.95659 134 3.01157C134 3.06655 134 3.06655 134 3.12154C134 3.17652 134 3.28649 134 3.34147C134 3.39645 134 3.39645 134 3.45144V6.80544C134 7.02537 134.103 7.30029 134.307 7.41026C134.664 7.63019 134.97 7.90511 135.276 8.23501C136.143 9.2797 136.603 10.5443 136.603 12.0839C136.603 13.6234 136.143 14.888 135.276 15.9327C134.97 16.2626 134.664 16.5375 134.307 16.7575C134.103 16.8674 134 17.0874 134 17.3623V20.3864C134 22.1459 135.174 23.6854 136.756 23.9053C138.694 24.1803 140.378 22.5308 140.378 20.4964V12.7437L148.235 22.8057C149.307 24.1803 151.245 24.4002 152.623 23.3005C153.439 22.6957 154 21.651 154 20.4964V3.39645C153.796 1.36206 152.164 -0.287447 150.225 0.0424545Z" fill="#0000E9" />
							<path d="M131.485 14.7901C131.268 14.7901 131.052 14.7901 130.835 14.736C130.239 14.6276 129.697 14.3567 129.318 13.9233C128.776 13.3274 128.505 12.6231 128.505 11.7563C128.505 10.8895 128.776 10.1852 129.318 9.58923C129.86 8.99329 130.564 8.72241 131.485 8.72241C131.593 8.72241 131.702 8.72241 131.81 8.77659C132.569 8.83076 133.165 9.10164 133.652 9.58923C134.194 10.1852 134.465 10.8895 134.465 11.7563C134.465 12.6231 134.194 13.3274 133.652 13.9233C133.381 14.1942 133.056 14.4109 132.677 14.5734C132.352 14.736 131.918 14.7901 131.485 14.7901Z" fill="#FFC200" />
						</g>
						<defs>
							<clipPath id="clip0_2966_28163">
								<rect width="154.781" height="24" fill="white" />
							</clipPath>
						</defs>
					</svg>
					</a>',
					],
					[
						'type' => 'html',
						'name' => 'SIMPLYIN_TITLE',
						'html_content' => $this->context->smarty->fetch($this->local_path . 'views/templates/admin/simplyin_title.tpl'),
					],
					[
						'type' => 'password',
						'name' => 'SIMPLYIN_SECRET_KEY',
						'style' => 'border: 2px solid blue;',
						'value' => Configuration::get('SIMPLYIN_SECRET_KEY'),
					],

					[
						'type' => 'html',
						'name' => 'SIMPLYIN_TITLE',
						'html_content' => $this->context->smarty->fetch($this->local_path . 'views/templates/admin/simplyin_contact.tpl'),
					],
					[
						'type' => 'switch',
						'id' => 'simply-switch',
						'label' => '',
						'name' => 'SIMPLY_SAVE_CHECKBOX',
						'is_bool' => true,
						'values' => [
							[
								'id' => 'active_on',
								'value' => 1,
								'label' => '',
							],
							[
								'id' => 'active_off',
								'value' => 0,
								'label' => '',
							],
						],
					],
				],

				'submit' => [
					'title' => 'Save',
				],
			],
		];
	}

	/**
	 * Set values for the inputs.
	 */
	protected function getConfigFormValues()
	{
		return [
			'SIMPLYIN_LIVE_MODE' => Configuration::get('SIMPLYIN_LIVE_MODE', true),
			'SIMPLYIN_ACCOUNT_EMAIL' => Configuration::get('SIMPLYIN_ACCOUNT_EMAIL', 'contact@prestashop.com'),
			'SIMPLYIN_ACCOUNT_PASSWORD' => Configuration::get('SIMPLYIN_ACCOUNT_PASSWORD', null),
			'SIMPLYIN_SECRET_KEY' => Configuration::get('SIMPLYIN_SECRET_KEY'),
			'INPOST_SECRET_KEY' => Configuration::get('INPOST_SECRET_KEY'),
			'SIMPLY_SAVE_CHECKBOX' => Configuration::get('SIMPLY_SAVE_CHECKBOX'),
			'SIMPLYIN_TITLE' => Configuration::get('SIMPLYIN_TITLE'),
		];
	}

	/**
	 * Save form data.
	 */
	protected function postProcess()
	{
		$form_values = $this->getConfigFormValues();

		foreach (array_keys($form_values) as $key) {
			$value = Tools::getValue($key);
			if ($key == 'SIMPLYIN_SECRET_KEY' && $value == '') {
				// If the user did not enter a new password, keep the old one
				continue;
			}
			Configuration::updateValue($key, $value);
		}
	}

	/**
	 * Add the CSS & JavaScript files you want to be loaded in the BO.
	 */
	public function hookDisplayBackOfficeHeader()
	{
		if (Tools::getValue('configure') == $this->name) {
			// $this->context->controller->addJS($this->_path . 'views/js/back.js');
			$this->context->controller->addCSS($this->_path . 'views/css/back.css');
		}
	}

	public function fetchAllAvailableShippingMethods()
	{
		$carriers = Carrier::getCarriers(
			$this->context->language->id,
			true,
			false,
			false,
			null,
			Carrier::ALL_CARRIERS
		);

		return $carriers;
	}

	public function hookHeader($params)
	{
		$base_url = __PS_BASE_URI__;
		$shippingMethods = $this->fetchAllAvailableShippingMethods();
		$countries_list = Country::getCountries($this->context->language->id);

		$context = Context::getContext();

		// Get the current language object
		$currentLanguage = $context->language;
		$customer = $context->customer;

		$prestashop_version = Configuration::get('PS_VERSION_DB');

		Media::addJsDef([
			'extension_version' => $this->version,
			'prestashop_version' => $prestashop_version,
			'countries_list' => $countries_list,
			'shippingMethods' => $shippingMethods,
			'base_url' => $base_url,
			'files_url' => $this->_path,
			'inpost_api_key' => Configuration::get('INPOST_SECRET_KEY'),
			'shop_url' => $base_url,
			'full_shop_url' => Tools::getShopDomain() . $base_url,
			'currentLanguage' => $currentLanguage,
			'customer' => $customer,
			'SIMPLY_SAVE_CHECKBOX' => Configuration::get('SIMPLY_SAVE_CHECKBOX'),
		]);

		$this->context->controller->addJS($this->_path . '/views/js/react-app/dist/bundle.js');
		$this->context->controller->addCSS($this->_path . '/views/css/front.css');
	}
}
