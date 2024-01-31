
import ReactDOM from "react-dom";
import { SimplyID } from "./components/SimplyID";

import { PhoneField } from "./components/PhoneField/PhoneField";
// import { selectIPickupPointInpost } from "./functions/selectInpostPoint";
import { loadDataFromSessionStorage } from "./services/sessionStorageApi";

// import { selectIPickupPointInpost } from "./functions/selectInpostPoint";
import SimplyBrandIcon from "./assets/SimplyBrandIcon";
import { selectPickupPointInpost } from "./functions/selectInpostPoint";
import { middlewareApi } from "./services/middlewareApi";
import './i18n.ts'


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
// console.log('customer', customer);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const listOfCountries = Object.keys(countries_list).map((key) => countries_list[key]).sort((a, b) => a.name.localeCompare(b.name));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
// const isUserLoggedIn = !!(customer?.email)
// const hasSimplyAlreadyBeenCalled = loadDataFromSessionStorage({ key: "hasSimplyAlreadyBeenCalled" })

document.addEventListener('DOMContentLoaded', async () => {
	let isValid = true
	const testRequest = await middlewareApi({
		endpoint: "checkout/submitEmail",
		method: 'POST',
		requestBody: { "email": "" }
	}).then(res => {
		console.log('test request');
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
		// } else if (testRequest === "Simplyin apikey is empty") {
	}
	else {
		isValid = true
		console.log("SIMPLYIN API KEY VALID");
		// deleteSimplyContent()
		// return
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

			selectPickupPointInpost({ deliveryPointID: parcelId });

		}



		//saving inpost delivery point 

		const parent = document.querySelector('#customer-form>div');
		const divs = parent?.getElementsByClassName('form-group row');

		// Check if there are at least 4 divs

		if (divs && divs.length >= 4) {

			const fourthDiv = divs[3];  // 4th div, index is 3 because it's zero-based

			const secondDiv = divs[0];  // 2nd div

			parent?.insertBefore(fourthDiv, secondDiv);
		}


		const formContainer = document.getElementById("field-email")?.parentNode;
		const reactAppContainer = document.createElement("div");
		reactAppContainer.setAttribute("id", "reactAppContainer");

		formContainer?.appendChild(reactAppContainer);

		ReactDOM.render(
			isValid && <SimplyID listOfCountries={listOfCountries} />,
			document.getElementById("reactAppContainer")
		);
		// const formContainer2 = document.getElementById("simplyLogoContainer")?.parentNode;
		// const reactAppContainer2 = document.createElement("div");
		// reactAppContainer2.setAttribute("id", "reactAppContainer2");

		// formContainer2?.appendChild(reactAppContainer2);

		// 		isUserLoggedIn
		//  	hasUserData


		const paymentSection = document.getElementById("checkout-payment-step");
		const paymentContentSection = paymentSection?.querySelector(".content")
		const phoneAppContainer = document.createElement("div");
		phoneAppContainer.setAttribute("id", "phoneAppContainer");


		paymentContentSection?.insertBefore(phoneAppContainer, paymentContentSection.childNodes[4]);

		ReactDOM.render(
			isValid && <PhoneField />,
			document.getElementById("phoneAppContainer")
		);





		// if (!isUserLoggedIn) {
		// console.log('render normal')
		// ReactDOM.render(
		// 	isValid && <SimplyID listOfCountries={listOfCountries} />,
		// 	document.getElementById("reactAppContainer")
		// );
		// }
		// if (isUserLoggedIn) {
		// 	console.log('render customer logged in');
		// 	ReactDOM.render(
		// 		isValid && <SimplyID listOfCountries={listOfCountries} isUserLoggedIn={isUserLoggedIn} />,
		// 		document.getElementById("reactAppContainer2")
		// 	);
		// }



	}

});






