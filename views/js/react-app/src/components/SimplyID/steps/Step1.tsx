import { useContext, useEffect, useState } from 'react'

import { PopupTitle, PopupTextMain, PinInputContainer, PopupTextSecondary } from '../SimplyID.styled'
import { middlewareApi } from '../../../services/middlewareApi'
import { PopupTextError } from '../../PhoneField/PhoneField.styled'
import { removeDataSessionStorage, saveDataSessionStorage } from '../../../services/sessionStorageApi'
import { SelectedDataContext } from '../SimplyID'
import { selectPickupPointInpost } from '../../../functions/selectInpostPoint'
import { OtpInput as OtpInputReactJS } from 'reactjs-otp-input'

interface IStep1 {
	handleClosePopup: () => void;
	phoneNumber: string;
	setModalStep: (arg: number) => void;
	setUserData: any
	setToken: any
	setSelectedUserData: any


}

export const Step1 = ({ handleClosePopup, phoneNumber, setModalStep, setUserData, setToken, setSelectedUserData }: IStep1) => {

	const [modalError, setModalError] = useState("")
	const [pinCode, setPinCode] = useState('');
	const {
		setSelectedBillingIndex,
		setSelectedShippingIndex,
		setSelectedDeliveryPointIndex,
		setSameDeliveryAddress,
		setPickupPointDelivery
	} = useContext(SelectedDataContext)


	const handlePinComplete = (value: string) => {
		middlewareApi({
			endpoint: "checkout/submitCheckoutCode",
			method: 'POST',
			requestBody: { "code": value }
		}).then(res => {
			removeDataSessionStorage({ key: 'customChanges' })
			console.log(res);
			setModalError("")
			if (res.error) {
				setModalError('Błędny kod weryfikacyjny')
				throw new Error(res.error)		

			} else if (res.data) {
				console.log('RES DATA', res.data);


				removeDataSessionStorage({ key: 'delivery-address' })
				removeDataSessionStorage({ key: 'invoice-address' })

				setUserData({ ...res.data })
				saveDataSessionStorage({ key: 'UserData', data: res.data })

				sessionStorage.setItem("simplyinToken", res.authToken);

				setToken(res.authToken)

				setModalStep(2)

				const { billingAddresses, shippingAddresses, parcelLockers } = res.data

				if (billingAddresses.length === 0) {
					setModalStep(2)
					return
				}

				if (billingAddresses.length === 1 && shippingAddresses.length === 1 && parcelLockers.length === 0) {
					setSelectedBillingIndex(0)
					setSelectedShippingIndex(0)
					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `0`)
					sessionStorage.setItem("ParcelIndex", `null`)
					setSelectedDeliveryPointIndex(null)
					setSameDeliveryAddress(false)
					setSelectedUserData((prev: any) => {
						return ({
							...prev,
							billingAddresses: billingAddresses[0],
							shippingAddresses: shippingAddresses[0],
							parcelLockers: null
						})
					})
					handleClosePopup()
					setModalStep(2)
					return
				}

				if (billingAddresses.length === 1 && shippingAddresses.length && parcelLockers.length === 0) {
					console.log('init case 2 1X0');

					setSelectedBillingIndex(0)
					setSelectedShippingIndex(0)
					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `0`)
					sessionStorage.setItem("ParcelIndex", `null`)
					setSameDeliveryAddress(false)
					setSelectedDeliveryPointIndex(null)
					setSelectedUserData((prev: any) => {
						return ({
							...prev,
							billingAddresses: billingAddresses[0],
							shippingAddresses: shippingAddresses[0],
							parcelLockers: null
						})
					})
					setModalStep(2)
					return
				}

				if (billingAddresses.length === 1 && shippingAddresses.length === 0 && parcelLockers.length === 0) {
					console.log('init case 3 100');

					setSelectedBillingIndex(0)
					setSelectedShippingIndex(null)
					setSameDeliveryAddress(true)
					setSelectedDeliveryPointIndex(null)
					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `null`)
					sessionStorage.setItem("ParcelIndex", `null`)
					setSelectedUserData((prev: any) => {
						return ({
							...prev,
							billingAddresses: billingAddresses[0],
							shippingAddresses: null,
							parcelLockers: null
						})
					})

					setModalStep(2)
					handleClosePopup()
					return
				}


				if (billingAddresses.length === 1 && shippingAddresses.length === 0 && parcelLockers.length === 1) {
					console.log('init case 4 101');

					setSelectedBillingIndex(0)
					setSelectedShippingIndex(null)
					setSelectedDeliveryPointIndex(0)
					setSameDeliveryAddress(true)

					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `null`)
					sessionStorage.setItem("ParcelIndex", `0`)


					setSelectedUserData((prev: any) => {
						return ({
							...prev,
							billingAddresses: billingAddresses[0],
							shippingAddresses: null,
							parcelLockers: parcelLockers[0]

						})
					})
					selectPickupPointInpost({ deliveryPointID: parcelLockers[0].lockerId });
					setModalStep(2)
					handleClosePopup()
					return
				}


				if (billingAddresses.length === 1 && shippingAddresses.length === 0 && parcelLockers.length) {
					console.log('init case 5 10X');

					setSelectedBillingIndex(0)
					setSelectedShippingIndex(null)

					setSelectedDeliveryPointIndex(0)
					setSameDeliveryAddress(true)
					setPickupPointDelivery(true)

					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `null`)
					sessionStorage.setItem("ParcelIndex", `0`)


					setSelectedUserData((prev: any) => {
						return ({
							...prev,
							billingAddresses: billingAddresses[0],
							shippingAddresses: null,
							parcelLockers: parcelLockers[0]

						})
					})

					setModalStep(2)
					return
				}
				setModalStep(2)

			}
		});
	};

	useEffect(() => {
		console.log('pinCode', pinCode);
		if (pinCode?.length > 3) {
			handlePinComplete(pinCode)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pinCode])


	useEffect(() => {

		const inputElement = document.querySelectorAll('#OTPForm input') as NodeListOf<HTMLInputElement>

		if (inputElement[0]) {
			inputElement[0].blur();

		}
		inputElement.forEach((el) => {
			el.pattern = "\\d*"
			el.inputMode = "numeric"
		})


	}, [phoneNumber])
	return (
		<>
			<PopupTitle> Potwierdź, że to Ty </PopupTitle>
			<PopupTextMain> Wpisz kod przesłany na numer </PopupTextMain>
			<PopupTextMain> {phoneNumber} </PopupTextMain>


			<PinInputContainer  >


				<div>
					<form id="OTPForm">
						<OtpInputReactJS
							value={pinCode}
							onChange={setPinCode}
							numInputs={4}

							inputStyle={{
								width: "40px",
								height: "56px",
								border: "1px solid #D9D9D9",
								borderRadius: "8px",
								fontSize: "30px",
								textAlign: "center",

							}}
							isInputNum={true}
							shouldAutoFocus="false"
							renderInput={(props: any, id: any) => <input {...props} type="number" pattern="\d*" autoComplete='one-time-code' id={`otp-input-${id + 1}`} inputMode='numeric' />}

							inputType='numeric'
							pattern="\d*"



						/>

					</form>
				</div>
				{/* } */}
			</PinInputContainer>
			<PopupTextError >
				{modalError}
			</PopupTextError>
			<PopupTextSecondary>
				Będziesz mógł edytować swoje dane po zalogowaniu.
			</PopupTextSecondary>

		</>
	)
}

export default Step1