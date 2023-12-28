import axios from "axios";
// import { loadDataFromSessionStorage, saveDataSessionStorage } from "../services/sessionStorageApi";

interface IselectIPickupPointInpost {
	deliveryPointID: string
}

type data = {
	selector?: string;
	timeout?: any
}



const waitForElementToRender = ({ selector, timeout = 5000 }: data) => {
	const checkElement = (resolve: any, reject: any) => {
		const element = document.querySelector(selector || "");
		if (element) {
			resolve(element);
		} else if (timeout <= 0) {
			reject(new Error(`Could not find element with selector ${selector}`));
		} else {
			setTimeout(checkElement, 100, resolve, reject);
		}
		timeout -= 100;
	};
	return new Promise(checkElement);
};



export const selectPickupPointInpost = async ({ deliveryPointID }: IselectIPickupPointInpost) => {


	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	// console.log(shippingMethods);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	const shippingMethod = shippingMethods.find((el) => el.external_module_name === "inpostshipping")

	const shippingMethodId = shippingMethod.id_carrier
	// console.log(shippingMethod);



	if (!deliveryPointID) return


	if (!document.querySelector('#checkout-delivery-step')) {
		return
	}
	if (!document.querySelector('#checkout-payment-step')?.classList.contains("-unreachable")) {
		return
	}


	if (document.querySelector('#checkout-delivery-step')?.classList.contains("-unreachable")) {
		return
	}

	const inpostPointData = await getInpostPointData({ deliveryPointID: deliveryPointID })
	if (!inpostPointData.name) {
		console.log('Selected shipping point is invalid')
		return;
	}


	let flag = false;

	const selectDeliveryPoint = (status: string) => {

		return new Promise<boolean>((resolve, reject): void => {

			waitForElementToRender({ selector: `#delivery_option_${shippingMethodId}` }).then((shippingRadioButton: any) => {
				if (shippingRadioButton) {
					shippingRadioButton.checked = true;
					const event = new Event('change', { 'bubbles': true, 'cancelable': true });
					shippingRadioButton.dispatchEvent(event);
				}
				waitForElementToRender({ selector: `input[name="inpost_locker[${shippingMethodId}]"]` }).then(async (hiddenInput: any) => {
					const parentContainer = hiddenInput.parentNode;
					const selectedMachineID = parentContainer.querySelector('span.js-inpost-shipping-machine-name');
					const isMachineSelected = selectedMachineID.innerText.replace(" ", '').toUpperCase() === deliveryPointID.replace(" ", '').toUpperCase();



					if (isMachineSelected) {

						// saveDataSessionStorage({ key: 'inpost-delivery-point', data: deliveryPointID })
						resolve(true);
						return;
					} 

					if (!isMachineSelected) {

						hiddenInput.value = deliveryPointID;
						const form = document?.getElementById("js-delivery") as HTMLFormElement;
						form.addEventListener('submit', function (e) {
							e.preventDefault();
							console.log('submit', e);
						});
						// saveDataSessionStorage({ key: 'inpost-delivery-point', data: deliveryPointID })
						await form.submit();
						resolve(true);
						return
					}
					reject(false)

				});
			});
		});
	};

	const startSelectDeliveryPoint = () => {
		selectDeliveryPoint('first try').then((status) => {
			flag = status;
			console.log('end with status', status);
		// console.log('first try end');
		});


		const interval = setTimeout(() => {
			if (!flag) {

				selectDeliveryPoint('second try').then((status) => {
					flag = status;

				});
			} else {
				clearInterval(interval);
			}
		}, 2000);
	};

	startSelectDeliveryPoint();


}

export const getInpostPointData = async ({ deliveryPointID }: IselectIPickupPointInpost) => {
	try {
		const res = await axios(`https://api-pl-points.easypack24.net/v1/points/${deliveryPointID}`);
		const pointData = res.data;

		return pointData

	} catch (error) {
		console.error('Error:', error);
		return false
	}
}