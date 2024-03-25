import { useContext, useEffect, useState } from 'react'

import { PopupTitle, PopupTextMain, PinInputContainer, PopupTextSecondary, PopupCountDownContainer, PopupCodeNotDelivered, PopupSendAgain, MobileSystemsLinksContainer, SingleSystemLink } from '../SimplyID.styled'
import { middlewareApi } from '../../../services/middlewareApi'
import { PopupTextError } from '../../PhoneField/PhoneField.styled'
import { removeDataSessionStorage, saveDataSessionStorage } from '../../../services/sessionStorageApi'
import { SelectedDataContext, TypedLoginType } from '../SimplyID'
import { selectDeliveryMethod } from '../../../functions/selectDeliveryMethod'
import { OtpInput as OtpInputReactJS } from 'reactjs-otp-input'
import { Divider, Link } from '@mui/material'
import Countdown from 'react-countdown'
import { useTranslation } from "react-i18next";
import { AndroidIcon } from '../../../assets/AndroidIcon'
import { IosIcon } from '../../../assets/IosIcon'

const countdownRenderer = ({ formatted: { minutes, seconds } }: any) => {
	return <span>{minutes}:{seconds}</span>;
};
const countdownTimeSeconds = 10
interface IStep1 {
	handleClosePopup: () => void;
	phoneNumber: string;
	setModalStep: (arg: number) => void;
	setUserData: any
	setToken: any
	simplyInput: string
	loginType: TypedLoginType


}

export const Step1 = ({ handleClosePopup, phoneNumber, setModalStep, setUserData, setToken, simplyInput, loginType }: IStep1) => {
	const { t, i18n } = useTranslation();

	const [countdown, setCountdown] = useState<boolean>(false)

	const [countdownTime, setCountdownTime] = useState<number>(0)
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
			setModalError("")
			if (res?.isCodeValid === false) {
				setModalError(t('modal-step-1.codeInvalid'))
				throw new Error(res.message)

			} else if (res?.data) {
				if (res.data?.language) {
					i18n.changeLanguage(res.data?.language.toLowerCase())
				}


				removeDataSessionStorage({ key: 'delivery-address' })
				removeDataSessionStorage({ key: 'invoice-address' })
				removeDataSessionStorage({ key: "selectedShippingMethod" })

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
					setSelectedDeliveryPointIndex(null)
					setSameDeliveryAddress(false)
					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `0`)
					sessionStorage.setItem("ParcelIndex", `null`)
					setSelectedDeliveryPointIndex(null)
					setSameDeliveryAddress(false)

					handleClosePopup()
					setModalStep(2)
					selectDeliveryMethod({ provider: "default" })

					return
				}

				if (billingAddresses.length === 1 && shippingAddresses.length && parcelLockers.length === 0) {


					setSelectedBillingIndex(0)
					setSelectedShippingIndex(0)
					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `0`)
					sessionStorage.setItem("ParcelIndex", `null`)
					setSameDeliveryAddress(false)
					setSelectedDeliveryPointIndex(null)
					setModalStep(2)
					selectDeliveryMethod({ provider: "default" })


					return

				}

				if (billingAddresses.length === 1 && shippingAddresses.length === 0 && parcelLockers.length === 0) {


					setSelectedBillingIndex(0)
					setSelectedShippingIndex(null)
					setSameDeliveryAddress(true)
					setSelectedDeliveryPointIndex(null)
					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `null`)
					sessionStorage.setItem("ParcelIndex", `null`)

					selectDeliveryMethod({ provider: "default" })
					setModalStep(2)
					handleClosePopup()

					return
				}


				if (billingAddresses.length === 1 && shippingAddresses.length === 0 && parcelLockers.length === 1) {

					setSelectedBillingIndex(0)
					setSelectedShippingIndex(null)
					setSelectedDeliveryPointIndex(0)
					setSameDeliveryAddress(true)

					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `null`)
					sessionStorage.setItem("ParcelIndex", `0`)


					selectDeliveryMethod({ deliveryPointID: parcelLockers[0].lockerId });
					setModalStep(2)
					handleClosePopup()
					return
				}


				if (billingAddresses.length === 1 && shippingAddresses.length === 0 && parcelLockers.length) {

					setSelectedBillingIndex(0)
					setSelectedShippingIndex(null)

					setSelectedDeliveryPointIndex(0)
					setSameDeliveryAddress(true)
					setPickupPointDelivery(true)

					sessionStorage.setItem("BillingIndex", `0`)
					sessionStorage.setItem("ShippingIndex", `null`)
					sessionStorage.setItem("ParcelIndex", `0`)




					setModalStep(2)
					return
				}
				setModalStep(2)

			}
		});
	};

	useEffect(() => {
		if (pinCode?.length > 3) {
			handlePinComplete(pinCode)
		}
		setModalError("")

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pinCode])


	useEffect(() => {

		const inputElement = document.querySelectorAll('#OTPForm input') as NodeListOf<HTMLInputElement>

		if (inputElement[0]) {
			inputElement[0].blur();
			setTimeout(() => {
				inputElement[0].focus()
			}, 300)
		}

		inputElement.forEach((el) => {
			el.pattern = "\\d*"
			el.inputMode = "numeric"
			el.type = "text"
			el.ariaRequired = "false"
		})


	}, [phoneNumber])

	const handleSendPinAgain = () => {
		setCountdown(true)
		setCountdownTime(Date.now() + countdownTimeSeconds * 1000)
		middlewareApi({
			endpoint: "checkout/resend-checkout-code-via-email",
			method: 'POST',
			requestBody: { "email": simplyInput }
		}).catch((err) => {

			console.log(err);

		})

	}
	const handleCountdownCompleted = () => {
		setCountdown(false)
	}

	return (
		<>
			<PopupTitle> {t('modal-step-1.confirm')} </PopupTitle>
			{loginType === "pinCode" &&
				<>
				<PopupTextMain>{t('modal-step-1.insertCode')} </PopupTextMain>
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
									border: modalError ? "1px solid red" : "1px solid #D9D9D9",
									borderRadius: "8px",
									fontSize: "30px",
									textAlign: "center",
									padding: 0,
									outlineWidth: "0px",

								}}
								isInputNum={true}
								shouldAutoFocus={true}
								renderInput={
									(props: any, id: any) =>
										<input
											{...props}
											type="number"
											pattern="\d*"
											autoComplete='one-time-code'
											id={`otp-input-${id + 1}`}
											inputMode='numeric' />}
								inputType='numeric'
								inputMode='numeric'
								pattern="\d*"
							/>
						</form>
					</div>

					</PinInputContainer>
				</>
			}


			{loginType === "app" &&

				<PopupTextMain>
					{t('modal-step-1.checkInApp')}
				</PopupTextMain>

			}
			{modalError &&
				<PopupTextError >
					{modalError}
				</PopupTextError>
			}
			<PopupTextSecondary style={{ paddingBottom: loginType === "app" ? '32px' : "inherit" }}>
				{t('modal-step-1.editAfterLogin')}
			</PopupTextSecondary>

			{loginType === "pinCode" && <> {
				(countdown) ?

					<PopupCountDownContainer>
						<PopupCodeNotDelivered>
							{t('modal-step-1.codeHasBeenSent')}
						</PopupCodeNotDelivered>

						<Countdown daysInHours={false} renderer={countdownRenderer} zeroPadTime={2} zeroPadDays={2}
							date={countdownTime} onComplete={handleCountdownCompleted} /></PopupCountDownContainer>

					:
					<>
						<PopupCodeNotDelivered>
							{t('modal-step-1.codeNotArrived')}
						</PopupCodeNotDelivered>
						<PopupSendAgain>
							<Link
								component="button"
								id="send-again-email-btn"
								value="mail"
								onClick={handleSendPinAgain}
								underline="hover"
							>
								{t('modal-step-1.sendViaEmail')}
							</Link>
						</PopupSendAgain>
					</>
			}</>}
			{loginType === "pinCode" &&
				<>
					<Divider style={{ marginTop: 24, marginBottom: 12 }} />
					<PopupTextSecondary>
						Loguj się za pomocą aplikacji. Pobierz teraz.
					</PopupTextSecondary>
					<MobileSystemsLinksContainer>
						<SingleSystemLink href='#'><AndroidIcon />Android</SingleSystemLink>
						<SingleSystemLink href='#'><IosIcon />iOS</SingleSystemLink>
					</MobileSystemsLinksContainer>
				</>}
		</>
	)
}

export default Step1