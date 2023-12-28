import { useState } from 'react'
import { Box, Link } from '@mui/material'

import Modal from '@mui/material/Modal';

import { CloseContainer, PinInputContainer, PopupContainer, PopupHeader, PopupSendAgain, PopupSimplyinLogo, PopupTextMain, PopupTextSecondary, PopupTitle } from '../SimplyID/SimplyID.styled';
import PinInput from 'react-pin-input';
import { CloseIcon } from '../../assets/CloseIcon';
import { middlewareApi } from '../../services/middlewareApi';
import { PopupTextError } from './PhoneField.styled';
import { removeDataSessionStorage, saveDataSessionStorage } from '../../services/sessionStorageApi';


interface IPhoneCodePopup {
	visible: boolean
	setVisible: (arg: boolean) => void
	phoneNumber: string
	handleChangeCheckbox: (arg: boolean) => void
	setSimplyinPhoneToken: any
}


const style = {
	position: 'absolute' as 'const',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	p: 1,
	boxShadow: 5,
	borderRadius: 3,
	bgcolor: "background.paper",
};

export const PhoneCodeModal = ({ visible, setVisible, phoneNumber, handleChangeCheckbox, setSimplyinPhoneToken }: IPhoneCodePopup) => {

	const [phoneVerificationMessage, setPhoneVerificationMessage] = useState("")

	const handlePinComplete = (value: string) => {

		console.log('pin complete');

		middlewareApi({
			endpoint: "checkout/verifyPhoneNumber",
			method: 'POST',
			requestBody: { "code": value }
		}).then(res => {
			console.log(res);
			if (res.error) {
				setPhoneVerificationMessage(res.error)
				removeDataSessionStorage({ key: "phoneNumber" })
				throw new Error(res.error)

			} else if (res.data) {
				const phoneTokenInputField = document.getElementById('phoneTokenInput')
				saveDataSessionStorage({ key: 'phoneToken', data: res.data })
				saveDataSessionStorage({ key: 'phoneNumber', data: phoneNumber })
				removeDataSessionStorage({ key: 'simplyinToken' })
				setSimplyinPhoneToken(res.data)
				setPhoneVerificationMessage("")
				if (phoneTokenInputField) {
					(phoneTokenInputField as HTMLInputElement).value = res.data;
				}
				setVisible(false)


			}
		});
	};


	const handleSendPinAgain = () => {
		console.log('send pin again is not handled ');
		// setCountdown(true)
		// setCountdownTime(Date.now() + countdownTimeSeconds * 1000)

	}

	const handleCloseModal = () => {
		setVisible(false)
		handleChangeCheckbox(false)
	}


	return (<>
		{<Modal
			open={visible}
			onClose={handleCloseModal}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box
				sx={style}
			>
				<PopupContainer>

					<PopupHeader>
						<PopupSimplyinLogo >
							Simply.IN
						</PopupSimplyinLogo>
						<CloseContainer onClick={handleCloseModal}>
							<CloseIcon />
						</CloseContainer>
					</PopupHeader>
					<PopupTitle> Potwierdź, swój numer telefonu </PopupTitle>
					<PopupTextMain> Wpisz kod przesłany na numer </PopupTextMain>
					<PopupTextMain> {phoneNumber} </PopupTextMain>
					<PinInputContainer>
						<PinInput
							length={4}
							secret={false}
							type="numeric"
							focus
							inputStyle={{
								width: "40px",
								height: "50px",
								border: "1px solid #D9D9D9",
								borderRadius: "8px",
								fontSize: "30px",
								textAlign: "center",
							}}
							inputFocusStyle={{
								border: "2px solid #3167B9",
							}}
							onComplete={handlePinComplete}
						/>
					</PinInputContainer>
					<PopupTextError >
						{phoneVerificationMessage}
					</PopupTextError>
					<PopupTextSecondary>
						Będziesz mógł edytować swoje dane po zalogowaniu.
					</PopupTextSecondary>

				</PopupContainer>

				<PopupSendAgain>
					<Link component="button" id="send-again-btn" underline="hover" onClick={
						handleSendPinAgain
					}>
						Wyślij ponownie
					</Link>

				</PopupSendAgain>
			</Box>
		</Modal >
		}</>
	)
}

export default PhoneCodeModal
