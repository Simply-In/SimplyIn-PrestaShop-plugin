import { Checkbox, Divider } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckboxContainer, CheckboxLabel, PhoneInputDescription, PhoneInputDescriptionLink, PhoneInputDescriptionSecondary } from "./PhoneField.styled";

import { debounce } from "lodash";

import 'react-phone-input-2/lib/style.css'
import { saveDataSessionStorage } from "../../services/sessionStorageApi";

import PhoneInput, { Country, isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { SimplyInFullLogo } from "../../assets/SimplyInFullLogo";




const phoneLabel = document.querySelector("[for=billing_phone]")
phoneLabel?.remove()


const MyCustomInput = React.forwardRef((props, ref: any) => (
	<div style={{ display: 'flex', flex: "1 1 auto" }}>
		<input ref={ref} {...props} className="" style={{ flex: "1 1 auto" }} />
	</div>
))

export const PhoneField = () => {

	const [phoneInput, setPhoneInput] = useState<string>();
	const [checked, setChecked] = useState(false);
	const [simplyinToken, setSimplyinToken] = useState<string>("")
	const [countryCode, setCountryCode] = useState<Country>("PL")

	const [error, setError] = useState("")
	const checkedRef = useRef(false);

	useEffect(() => {

		// if (checked && !checkedRef.current) {
		setError("")




			const selectedInvoiceAddress = document.getElementById("invoice-addresses")?.querySelector(".selected")

			let selectedDeliveryAddress = null
			if (!selectedInvoiceAddress) {
				selectedDeliveryAddress = document.getElementById("delivery-addresses")?.querySelector(".selected")
			}


			const addressData = selectedInvoiceAddress ?? selectedDeliveryAddress
			const allAddressDataArray = addressData?.querySelector('.address')?.innerHTML.split("<br>")
		let phoneInputField = ""
		let phoneVal = ""
			if (allAddressDataArray?.length) {
				console.log(allAddressDataArray[allAddressDataArray.length - 1]);

				phoneInputField = allAddressDataArray[allAddressDataArray.length - 1]
				phoneVal = allAddressDataArray[allAddressDataArray.length - 1].replace(/^00|^0/, '+')

			}

		if (!phoneVal) return


		if (isValidPhoneNumber(phoneVal || "")) {

			setPhoneInput(phoneVal || "")
		} else {


			if (phoneVal.startsWith("+")) {

				setPhoneInput(phoneVal || "")
				setError("Sprawdź poprawność wprowadzonego numeru")
			} else {

				try {

					const countrySelect = document.getElementById('billing_country') as HTMLSelectElement

					const countryCode = countrySelect?.options[countrySelect?.selectedIndex]?.value || "PL"


					const selectedCountryNumber = parsePhoneNumber(phoneInputField, countryCode as Country || "PL")


					if (!selectedCountryNumber) {
						return
					}
					setCountryCode(countryCode as Country)

					setPhoneInput(selectedCountryNumber?.number || "")

					if (!isValidPhoneNumber(selectedCountryNumber?.number as string || "") && phoneVal) {

						setError("Sprawdź poprawność wprowadzonego numeru")
					}
				}
				catch (err) {
					setError("Wystąpił błąd, wprowadź numer ręcznie")
					console.log('błąd', err);
				}
			}

		}
		checkedRef.current = true;
	}, [checked])


	const handleChangeCheckbox = () => {
		setChecked((prev) => {
			saveDataSessionStorage({ key: 'createSimplyAccount', data: !prev })
			return !prev
		});
	};


	const debouncedValidation = useCallback(
		debounce((number) => {
			validatePhoneNumber(number);
		}, 1000),
		[],
	);
	const phoneChange = (number: string) => {
		setPhoneInput(number)
		setError("")
		debouncedValidation(number);
	}


	const validatePhoneNumber = (number: string) => {
		if (isValidPhoneNumber(number || "") || !number) {
			setError('');
		} else {
			setError('Numer telefonu jest nieprawidłowy.');
		}
	}

	useEffect(() => {

		const simplyinTokenFromStorage = sessionStorage.getItem("simplyinToken")
		if (simplyinTokenFromStorage) {

			setSimplyinToken(simplyinTokenFromStorage || "")
		}

	}, [])


	const BubblingHandling = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		e.stopPropagation()
	}



	useEffect(() => {
		const debouncedRequest = debounce(() => {
			if (checked && phoneInput && isValidPhoneNumber(phoneInput || "")) {

				saveDataSessionStorage({ key: "phoneNumber", data: phoneInput })
			}

		}, 1500);
		debouncedRequest();
		return () => {
			debouncedRequest.cancel();
		};
	}, [phoneInput, checked])



	return (
		!simplyinToken && <div style={{ marginTop: 20 }}>



		{!simplyinToken && <>
			<CheckboxContainer>
				<Checkbox
						style={{ paddingLeft: 0 }}
					id="simply-save-checkbox"
					name="simply-save-checkbox"
					checked={simplyinToken ? !!simplyinToken : checked}
					onChange={handleChangeCheckbox}
					inputProps={{ 'aria-label': 'controlled' }} />
				<CheckboxLabel onClick={() => handleChangeCheckbox()}>
					Zapisz moje dane aby jeszcze szybciej się logować i płacić.
				</CheckboxLabel>
			</CheckboxContainer>

				<div onClick={BubblingHandling}>
					{checked && <>
						<SimplyInFullLogo style={{ marginBottom: "8px" }} />

						<PhoneInput
							style={{ padding: 5 }}
							autocomplete="off"
							international
							countryCallingCodeEditable={false}
							defaultCountry={countryCode || "PL"}
							value={phoneInput}
							onChange={phoneChange}
							inputComponent={MyCustomInput} /> 

						{error && <div style={{ color: '#ff8000' }}>{error}</div>}
						<Divider style={{ marginTop: "16px", marginBottom: "16px" }} />
					</>}
				</div>
				{checked && <>
					<PhoneInputDescription>
					Następnym razem, gdy dokonasz płatności tutaj lub w innych sklepach używających
					<PhoneInputDescriptionLink href="https://simply.in/">{" "}Simply.IN{" "}</PhoneInputDescriptionLink>
					, otrzymasz kod SMS-em i będziesz mógł bezpiecznie robić zakupy za pomocą
					<PhoneInputDescriptionLink href="https://simply.in/">{" "}Simply.IN.</PhoneInputDescriptionLink>
				</PhoneInputDescription>
				<PhoneInputDescriptionSecondary>
					Klikając przycisk „Zamawiam” lub analogiczny, potwierdzam że zapoznałem się i akceptuję Regulamin
					<PhoneInputDescriptionLink href="https://simply.in/terms-and-conditions">{" "}Simply.In.{" "}</PhoneInputDescriptionLink >
					Administratorem Twoich danych osobowych jest
					<PhoneInputDescriptionLink href="https://simply.in/">{" "}Simply.In.</PhoneInputDescriptionLink>
					Zobacz więcej w
					<PhoneInputDescriptionLink href="https://simply.in/gdpr-rules">{" "}Polityce Prywatności. </PhoneInputDescriptionLink>
				</PhoneInputDescriptionSecondary>


			</>}
		</>
		}

		</div>
	)
}

export default PhoneField
