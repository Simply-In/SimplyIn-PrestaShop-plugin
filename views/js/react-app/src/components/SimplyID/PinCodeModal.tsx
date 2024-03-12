import { useState, useEffect } from 'react'
import Modal from '@mui/material/Modal';
import Step1 from './steps/Step1'
import Step2 from './steps/Step2';
import { CloseContainer, PopupContainer, PopupHeader, StyledBox } from './SimplyID.styled';

import { CloseIcon } from '../../assets/CloseIcon';
import { SimplyinSmsPopupOpenerIcon } from '../../assets/SimplyinSmsPopupOpenerIcon';
import { saveDataSessionStorage } from '../../services/sessionStorageApi';
// import { useInsertFormData } from '../../hooks/useInsertFormData';


interface IPinCodePopup {
	phoneNumber: string
	visible: boolean
	setVisible: (arg: boolean) => void
	setToken: any,
	simplyInput: string,
	listOfCountries: any
	userData: any,
	setUserData: any
	render?: boolean
}



export const PinCodeModal = ({ phoneNumber, visible, setVisible, setToken, simplyInput, listOfCountries, userData, setUserData, render }: IPinCodePopup) => {

	const [modalStep, setModalStep] = useState(1)
	const [, setSelectedUserData] = useState({})
	const [editItemIndex, setEditItemIndex] = useState<{ property: string, itemIndex: number, isNewData?: boolean } | null>(null)


	const BillingIndex = sessionStorage.getItem("BillingIndex")
	const ShippingIndex = sessionStorage.getItem("ShippingIndex")

	useEffect(() => {
		setSelectedUserData({
			...userData,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			billingAddresses: userData?.billingAddresses?.length ? userData?.billingAddresses[0] : {},
			shippingAddresses: null,
			parcelLockers: null
		})
	}, [userData])

	useEffect(() => {
		setToken("")
		setUserData({})
		setModalStep(1)
	}, [simplyInput])


	useEffect(() => {
		setModalStep(1)
	}, [phoneNumber])

	useEffect(() => {
		const UserDataFromStorage = sessionStorage.getItem("UserData") ? JSON.parse(sessionStorage.getItem("UserData") || "") : null
		setUserData(UserDataFromStorage)
		if (UserDataFromStorage) {
			setModalStep(2)
		}
		setToken(sessionStorage.getItem("simplyinToken"))
	}, [])




	useEffect(() => {

		setSelectedUserData({
			...userData,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			billingAddresses: userData?.billingAddresses?.length ? userData?.billingAddresses : {},
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			shippingAddresses: userData?.shippingAddresses?.length ? userData?.shippingAddresses : {}
		})


	}, [userData, BillingIndex, ShippingIndex])



	const handleClosePopup = () => {
		setVisible(false)
		saveDataSessionStorage({ key: 'isSimplyDataSelected', data: true })
	}

	const emailInput = document.getElementById("field-email")

	function checkVisible(elm: any) {
		if (render) return true
		const rect = elm.getBoundingClientRect();
		const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
		return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
	}


	// useInsertFormData(selectedUserData, listOfCountries)

	return (<>
		{checkVisible(emailInput) && <Modal
			open={visible}
			onClose={() => setVisible(false)}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<StyledBox id="containerSimply"
				style={{ maxWidth: editItemIndex?.property === "parcelLockers" ? "650px" : "400px" }}
			>
					<PopupHeader>

						<SimplyinSmsPopupOpenerIcon style={{ marginBottom: "20px" }} />
						<CloseContainer onClick={handleClosePopup}>
							<CloseIcon />
						</CloseContainer>
					</PopupHeader>
				<PopupContainer>
					{modalStep === 1 &&
						<Step1
							setToken={setToken}
							phoneNumber={phoneNumber}
							handleClosePopup={handleClosePopup}
							setModalStep={setModalStep}
							setUserData={setUserData}
						setSelectedUserData={setSelectedUserData}
							simplyInput={simplyInput} />}
					{modalStep === 2 &&
						<Step2
							listOfCountries={listOfCountries}
							handleClosePopup={handleClosePopup}
							userData={userData}
						setUserData={setUserData}
						setSelectedUserData={setSelectedUserData}
							editItemIndex={editItemIndex}
							setEditItemIndex={setEditItemIndex}

						/>}
				</PopupContainer>
			</StyledBox>
		</Modal>
		}</>
	)
}

export default PinCodeModal
