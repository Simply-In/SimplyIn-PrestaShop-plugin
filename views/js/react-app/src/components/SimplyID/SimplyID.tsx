import { useState, useEffect, ChangeEvent, createContext, useRef } from "react";
import { SimplyinSmsPopupOpenerIcon } from "../../assets/SimplyinSmsPopupOpenerIcon.tsx";
import { SimplyIn, SimplyinContainer, } from "./SimplyID.styled";
import { middlewareApi } from '../../services/middlewareApi.ts'
import { debounce } from 'lodash';
import PinCodeModal from "./PinCodeModal.tsx";
import { loadDataFromSessionStorage, saveDataSessionStorage } from "../../services/sessionStorageApi.ts";
import { useInsertFormData } from "../../hooks/useInsertFormData.ts";
import { useSelectedSimplyData } from "../../hooks/useSelectedSimplyData.ts";


export type TypedLoginType = "pinCode" | "app" | undefined
interface ISimplyID {
	listOfCountries: any
	isUserLoggedIn?: boolean
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const customerEmail = customer?.email

export const ApiContext = createContext("");
export const SelectedDataContext = createContext<any>(null);


export const SimplyID = ({ listOfCountries, isUserLoggedIn }: ISimplyID) => {

	const [simplyInput, setSimplyInput] = useState(isUserLoggedIn ? customerEmail : loadDataFromSessionStorage({ key: "UserData" })?.email || "");

	const [attributeObject, setAttributeObject] = useState({});
	const [visible, setVisible] = useState<boolean>(true)
	const [phoneNumber, setPhoneNumber] = useState("")
	const [simplyinToken, setSimplyinToken] = useState("")
	const [isSimplyIdVisible, setIsSimplyIdVisible] = useState<boolean>(false)

	const [loginType, setLoginType] = useState<TypedLoginType>()
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

	const isSimplyModalSelected = loadDataFromSessionStorage({ key: "isSimplyDataSelected" }) === true ? true : false

	useEffect(() => {

		if (!myRef.current) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting === true) {
					setIsSimplyIdVisible(true)
				}
				else {
					setIsSimplyIdVisible(false)
				}
			},
			{ threshold: [0] }
		)
		observer?.observe(myRef?.current)

		// Clean up function
		return () => { observer?.unobserve((myRef as any)?.current) }
	}, []);



	useEffect(() => {

		if (!isUserLoggedIn) {
			const YodaInput = document.getElementById("field-email");
			YodaInput?.remove()

			const attributes: any = YodaInput?.attributes;
			const attributeKeeper: any = {};
			for (let i = 0; i < attributes.length; i++) {
				const attributeName = attributes[i].name;
				const attributeValue = attributes[i].value;
				attributeKeeper[attributeName] = attributeValue;
			}
			setAttributeObject(attributeKeeper);


		}
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


		setPhoneNumber(simplyinPhoneFromStorage() ?? "")
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
		sessionStorage.removeItem("shippingAddressesId")
		sessionStorage.removeItem("billingAddressesId")
		setSimplyinToken("")
		setUserData({})
	}

	useEffect(() => {
		setVisible(false)
		setSelectedBillingIndex(0)
		setSelectedShippingIndex(null)
		setSelectedDeliveryPointIndex(null)

		if (!simplyinToken && (isSimplyIdVisible || !isSimplyModalSelected)) {

			const debouncedRequest = debounce(() => {
				middlewareApi({
					endpoint: "checkout/submitEmail",
					method: 'POST',
					requestBody: { "email": simplyInput?.trim().toLowerCase() || "" }
				}).then(res => {

					setVisible(true)
					setPhoneNumber(res.data)
					saveDataSessionStorage({ key: 'phoneNumber', data: res.data })
					setVisible(true)
					setLoginType("pinCode")
				}).catch((err) => {
					console.log(err);
				})
			}, 500);

			debouncedRequest();
			return () => {
				debouncedRequest.cancel();
			};

		}

	}, [simplyInput, isSimplyIdVisible, isSimplyModalSelected, isUserLoggedIn]);


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
					requestBody: { "email": simplyInput?.trim().toLowerCase() || "" }
				}).then(res => {

					setVisible(true)
					setPhoneNumber(res.data)
					saveDataSessionStorage({ key: 'phoneNumber', data: res.data })
					setVisible(true)

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

					{!isUserLoggedIn && <SimplyinContainer>
						<input 
							{...attributeObject}
							value={simplyInput}
							onChange={handleSimplyInputChange}
							ref={myRef as any}
							type="email"

						></input>


						{phoneNumber && <SimplyinSmsPopupOpenerIcon onClick={handleOpenSmsPopup} simplyinToken={simplyinToken} />}
					</SimplyinContainer>}

					{!isUserLoggedIn && phoneNumber && isSimplyIdVisible && <PinCodeModal
						simplyInput={simplyInput}
						setToken={setSimplyinToken}
						phoneNumber={phoneNumber}
						visible={visible}
						setVisible={setVisible}
						listOfCountries={listOfCountries}
						userData={userData}
						setUserData={setUserData}
						loginType={loginType}

					/>}

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
						loginType={loginType}

					/>}





				</SimplyIn >
			</SelectedDataContext.Provider>
		</ApiContext.Provider>
	);
};


export default SimplyID