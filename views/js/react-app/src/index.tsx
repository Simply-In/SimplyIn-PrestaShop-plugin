
import ReactDOM from "react-dom";
import { SimplyID } from "./components/SimplyID";

import { PhoneField } from "./components/PhoneField/PhoneField";
// import { selectIPickupPointInpost } from "./functions/selectInpostPoint";
import { loadDataFromSessionStorage } from "./services/sessionStorageApi";

// import { selectIPickupPointInpost } from "./functions/selectInpostPoint";
import SimplyBrandIcon from "./assets/SimplyBrandIcon";
import { selectPickupPointInpost } from "./functions/selectInpostPoint";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const listOfCountries = Object.keys(countries_list).map((key) => countries_list[key]).sort((a, b) => a.name.localeCompare(b.name));


document.addEventListener('DOMContentLoaded', function () {


	if ($('#checkout').length > 0) {

		const personalInformation = document.getElementById('checkout-personal-information-step');

		const simplyLogoContainer = document.createElement("div");
		simplyLogoContainer.setAttribute("id", "simplyLogoContainer");

		personalInformation?.prepend(simplyLogoContainer)


		ReactDOM.render(
			<SimplyBrandIcon />,
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
			<SimplyID listOfCountries={listOfCountries} />,
			document.getElementById("reactAppContainer")
		);

		const paymentSection = document.getElementById("checkout-payment-step");
		const paymentContentSection = paymentSection?.querySelector(".content")
		const phoneAppContainer = document.createElement("div");
		phoneAppContainer.setAttribute("id", "phoneAppContainer");


		paymentContentSection?.insertBefore(phoneAppContainer, paymentContentSection.childNodes[4]);

		ReactDOM.render(
			<PhoneField />,
			document.getElementById("phoneAppContainer")
		);

	}

});





