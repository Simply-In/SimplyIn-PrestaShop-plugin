
import ReactDOM from "react-dom";
import { SimplyID } from "./components/SimplyID";

import { PhoneField } from "./components/PhoneField/PhoneField";

import { loadDataFromSessionStorage, removeDataSessionStorage, saveDataSessionStorage } from "./services/sessionStorageApi";


import SimplyBrandIcon from "./assets/SimplyBrandIcon";
import { selectDeliveryMethod } from "./functions/selectDeliveryMethod.ts";
import { middlewareApi } from "./services/middlewareApi";
import './i18n.ts'





// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
console.log('customer', customer);

const isCheckoutPage = document.getElementById('checkout')

if (!isCheckoutPage) {
	saveDataSessionStorage({ key: "isSimplyDataSelected", data: false })
	removeDataSessionStorage({ key: "UserData" })
	removeDataSessionStorage({ key: "BillingIndex" })
	removeDataSessionStorage({ key: "ShippingIndex" })
	removeDataSessionStorage({ key: "ParcelIndex" })
	removeDataSessionStorage({ key: "simplyinToken" })
	removeDataSessionStorage({ key: "phoneNumber" })
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const listOfCountries = Object.keys(countries_list).map((key) => countries_list[key]).sort((a, b) => a.name.localeCompare(b.name));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const isUserLoggedIn = (customer?.is_guest === 0 || customer?.is_guest === "0")

document.addEventListener('DOMContentLoaded', async () => {
	let isValid = true
	const testRequest = await middlewareApi({
		endpoint: "checkout/submitEmail",
		method: 'POST',
		requestBody: { "email": "" }
	}).then(res => {
		console.log(res);
		return res
	})


	const deleteSimplyContent = () => {
		console.log('delete content simply');
		document.querySelector("#simplyLogoContainer")?.remove()
		document.querySelector("#phoneAppContainer")?.remove()

	}

	if (testRequest.message === "Merchant api key not found") {
		console.log("SIMPLYIN API KEY INVALID");
		isValid = false
		deleteSimplyContent()
		return
	}
	else {
		isValid = true
		console.log("SIMPLYIN API KEY VALID");

	}
	if ($('#checkout').length > 0) {

		const personalInformation = document.getElementById('checkout-personal-information-step');

		const simplyLogoContainer = document.createElement("div");
		simplyLogoContainer.setAttribute("id", "simplyLogoContainer");

		personalInformation?.prepend(simplyLogoContainer)


		ReactDOM.render(
			isValid && <SimplyBrandIcon />,
			document.getElementById("simplyLogoContainer")
		);

		const isParcelAdded = loadDataFromSessionStorage({ key: "isParcelAdded" })
		const parcelIndex = loadDataFromSessionStorage({ key: "ParcelIndex" })
		const userData = loadDataFromSessionStorage({ key: "UserData" })

		const parcelId = userData?.parcelLockers[parcelIndex]?.lockerId

		if (!isNaN(parcelIndex) && !isParcelAdded) {
			selectDeliveryMethod({ deliveryPointID: parcelId });

		}




		const parent = document.querySelector('#customer-form>div');
		const divs = parent?.getElementsByClassName('form-group row');

		if (divs && divs.length >= 4) {
			const fourthDiv = divs[3];
			const secondDiv = divs[0];  
			parent?.insertBefore(fourthDiv, secondDiv);
		}




		const formContainer2 = document.getElementById("simplyLogoContainer")?.parentNode;
		const reactAppContainer2 = document.createElement("div");
		reactAppContainer2.setAttribute("id", "reactAppContainer2");

		formContainer2?.appendChild(reactAppContainer2);


		if (!isUserLoggedIn) {
			const formContainer = document.getElementById("field-email")?.parentNode;
			const reactAppContainer = document.createElement("div");
			reactAppContainer.setAttribute("id", "reactAppContainer");

			formContainer?.appendChild(reactAppContainer);

			ReactDOM.render(
				isValid && <SimplyID listOfCountries={listOfCountries} />,
				document.getElementById("reactAppContainer")
			);
		}
		if (isUserLoggedIn) {
			ReactDOM.render(
				isValid && <SimplyID listOfCountries={listOfCountries} isUserLoggedIn={isUserLoggedIn} />,
				document.getElementById("reactAppContainer2")
			);
		}

		const paymentSection = document.getElementById("checkout-payment-step");
		const paymentContentSection = paymentSection?.querySelector(".content")
		const phoneAppContainer = document.createElement("div");

		phoneAppContainer.setAttribute("id", "phoneAppContainer");
		paymentContentSection?.insertBefore(phoneAppContainer, paymentContentSection.childNodes[4]);

		ReactDOM.render(
			isValid && <PhoneField />,
			document.getElementById("phoneAppContainer")
		);
	}

});






