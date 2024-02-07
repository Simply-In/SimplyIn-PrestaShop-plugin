import { useState, useEffect, createContext } from "react";

import { SimplyIn } from "./SimplyID.styled";
import { middlewareApi } from '../../services/middlewareApi.ts'
import { debounce } from 'lodash';
import PinCodeModal from "./PinCodeModal.tsx";
import { loadDataFromSessionStorage, saveDataSessionStorage } from "../../services/sessionStorageApi.ts";
import { useInsertFormData } from "../../hooks/useInsertFormData.ts";
import { useSelectedSimplyData } from "../../hooks/useSelectedSimplyData.ts";

interface ISimplyID {
	listOfCountries: any
	isUserLoggedIn?: boolean
}


export const ApiContext = createContext("");
export const SelectedDataContext = createContext<any>(null);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const customerEmail = customer?.email


export const SimplyIDLogged = ({ listOfCountries, isUserLoggedIn }: ISimplyID) => {


	const [simplyInput,] = useState(isUserLoggedIn ? customerEmail : loadDataFromSessionStorage({ key: "UserData" })?.email || "");
	const [visible, setVisible] = useState<boolean>(true)
	const [phoneNumber, setPhoneNumber] = useState("")
	const [simplyinToken, setSimplyinToken] = useState("")

	const isSimplyModalSelected = loadDataFromSessionStorage({ key: "isSimplyDataSelected" }) === true ? true : false

	const [userData, setUserData] = useState({})

	const {
		selectedBillingIndex,
		setSelectedBillingIndex,
		selectedShippingIndex,
		setSelectedShippingIndex,
		sameDeliveryAddress,
		setSameDeliveryAddress,
		selectedDeliveryPointIndex,
		setSelectedDeliveryPointIndex,
		pickupPointDelivery,
		setPickupPointDelivery } = useSelectedSimplyData();


	useEffect(() => {

		const simplyinTokenFromStorage = sessionStorage.getItem("simplyinToken")

		setSimplyinToken(simplyinTokenFromStorage as string)

		const simplyinPhoneFromStorage = () => {

			if (sessionStorage.getItem("phoneNumber") === "undefined") {
				return undefined
			}
			return sessionStorage.getItem("phoneNumber")

		}


		setPhoneNumber(simplyinPhoneFromStorage() || "")
	}, [])


	useEffect(() => {

		setVisible(false)

		setSelectedBillingIndex(0)
		setSelectedShippingIndex(null)
		setSelectedDeliveryPointIndex(null)


		if (!isSimplyModalSelected && !simplyinToken) {

			const debouncedRequest = debounce(() => {
				middlewareApi({
					endpoint: "checkout/submitEmail",
					method: 'POST',
					requestBody: { "email": simplyInput.trim().toLowerCase() }
				}).then(res => {

					setVisible(true)
					setPhoneNumber(res.data)
					saveDataSessionStorage({ key: 'phoneNumber', data: res.data })
					setVisible(true)
					console.log(res)

					if (res.error) {

						console.log('error', res.error);
					}
				}).catch((err) => {
					console.log(err);
				})
			}, 500);

			debouncedRequest();
			return () => {
				debouncedRequest.cancel();
			};

		}

	}, []);


	useInsertFormData(userData, listOfCountries)


	useEffect(() => {
		setUserData(JSON.parse(sessionStorage.getItem("UserData") as string))
	}, [])

	return (
		<div>
			<ApiContext.Provider value={simplyinToken}>
				<SelectedDataContext.Provider value={{
					selectedBillingIndex,
					setSelectedBillingIndex,
					selectedShippingIndex,
					setSelectedShippingIndex,
					sameDeliveryAddress,
					setSameDeliveryAddress,
					selectedDeliveryPointIndex,
					setSelectedDeliveryPointIndex,
					pickupPointDelivery,
					setPickupPointDelivery,
					simplyInput
				}}>
					<SimplyIn className="REACT_APP">
						{!isSimplyModalSelected && isUserLoggedIn && phoneNumber && <PinCodeModal
							render={true}
							simplyInput={simplyInput}
							setToken={setSimplyinToken}
							phoneNumber={phoneNumber}
							visible={visible}
							setVisible={setVisible}
							listOfCountries={listOfCountries}
							userData={userData}
							setUserData={setUserData}

						/>}




					</SimplyIn >
				</SelectedDataContext.Provider>
			</ApiContext.Provider>
		</div>
	);
};


export default SimplyIDLogged