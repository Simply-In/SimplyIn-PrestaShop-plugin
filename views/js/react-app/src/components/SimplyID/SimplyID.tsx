import { useState, useEffect, ChangeEvent, createContext, useRef } from "react";
import { SimplyinSmsPopupOpenerIcon } from "../../assets/SimplyinSmsPopupOpenerIcon.tsx";
import { SimplyIn, SimplyinContainer, } from "./SimplyID.styled";
import { middlewareApi } from '../../services/middlewareApi.ts'
import { debounce } from 'lodash';
import PinCodeModal from "./PinCodeModal.tsx";
import { loadDataFromSessionStorage, saveDataSessionStorage } from "../../services/sessionStorageApi.ts";
import { useInsertFormData } from "../../hooks/useInsertFormData.ts";
import { useSelectedSimplyData } from "../../hooks/useSelectedSimplyData.ts";



interface ISimplyID {
	listOfCountries: any
	// isUserLoggedIn: boolean
}


export const ApiContext = createContext("");
export const SelectedDataContext = createContext<any>(null);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
// const customerEmail = customer?.email
// isUserLoggedIn

export const SimplyID = ({ listOfCountries }: ISimplyID) => {

	const [simplyInput, setSimplyInput] = useState(loadDataFromSessionStorage({ key: "UserData" })?.email || "");
	// const [simplyInput, setSimplyInput] = useState(isUserLoggedIn ? customerEmail : loadDataFromSessionStorage({ key: "UserData" })?.email || "");
	const [attributeObject, setAttributeObject] = useState({});
	const [visible, setVisible] = useState<boolean>(true)
	const [phoneNumber, setPhoneNumber] = useState("")
	const [simplyinToken, setSimplyinToken] = useState("")
	const [isSimplyIdVisible, setIsSimplyIdVisible] = useState<boolean>(false)

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

	const myRef = useRef();

	useEffect(() => {
		if (!myRef.current) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting === true) {
					setIsSimplyIdVisible(true)
					console.log("Element is visible on screen");
				}
				else {
					setIsSimplyIdVisible(false)
					console.log("Element is not visible on screen");
				}
			},
			{ threshold: [0] }
		)
		observer?.observe(myRef?.current)

		// Clean up function
		return () => { observer?.unobserve((myRef as any)?.current) }
	}, []);


	useEffect(() => {

		const YodaInput = document.getElementById("field-email");
		YodaInput?.remove();

		const attributes: any = YodaInput?.attributes;
		const attributeKeeper: any = {};
		for (let i = 0; i < attributes.length; i++) {
			const attributeName = attributes[i].name;
			const attributeValue = attributes[i].value;
			attributeKeeper[attributeName] = attributeValue;
		}
		setAttributeObject(attributeKeeper);



	}, []);




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



	const handleOpenSmsPopup = () => {
		setVisible((prev) => !prev)
	};

	const handleSimplyInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSimplyInput(e.target.value)
		sessionStorage.removeItem("simplyinToken")
		sessionStorage.removeItem("UserData")
		sessionStorage.removeItem("phoneNumber")
		sessionStorage.removeItem("BillingIndex")
		sessionStorage.removeItem("ShippingIndex")
		setSimplyinToken("")
		setUserData({})
	}

	useEffect(() => {
		setVisible(false)

		setSelectedBillingIndex(0)
		setSelectedShippingIndex(null)
		setSelectedDeliveryPointIndex(null)

		if (!simplyinToken && isSimplyIdVisible) {

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

	}, [simplyInput, isSimplyIdVisible]);





	useInsertFormData(userData, listOfCountries)

	// console.log('render');

	useEffect(() => {
		setUserData(JSON.parse(sessionStorage.getItem("UserData") as string))
	}, [])



	return (
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

					<SimplyinContainer>
						<input autoComplete="off"
							{...attributeObject}
							value={simplyInput}
							onChange={handleSimplyInputChange}
							ref={myRef as any}
							type="email"
						></input>


						{phoneNumber && <SimplyinSmsPopupOpenerIcon onClick={handleOpenSmsPopup} simplyinToken={simplyinToken} />}
					</SimplyinContainer>

					{phoneNumber && isSimplyIdVisible && <PinCodeModal
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
	);
};


export default SimplyID