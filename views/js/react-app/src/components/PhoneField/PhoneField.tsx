import { Checkbox, Divider } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckboxContainer, CheckboxLabel, PhoneInputDescription, PhoneInputDescriptionLink, PhoneInputDescriptionSecondary } from "./PhoneField.styled";

import { debounce } from "lodash";

import 'react-phone-input-2/lib/style.css'
import { saveDataSessionStorage } from "../../services/sessionStorageApi";

import PhoneInput, { Country, isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { SimplyInFullLogo } from "../../assets/SimplyInFullLogo";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const phoneLabel = document.querySelector("[for=billing_phone]")
phoneLabel?.remove()

const MyCustomInput = React.forwardRef((props, ref: any) => (
	<div style={{ display: 'flex', flex: "1 1 auto" }}>
		<input ref={ref} {...props} className="" style={{ flex: "1 1 auto" }} />
	</div>
))


const ClickedDiv = styled.div``

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const valueRegister = SIMPLY_SAVE_CHECKBOX == 1 ? true : false
export const PhoneField = () => {

	const [phoneInput, setPhoneInput] = useState<string>();

	const [checked, setChecked] = useState(valueRegister || false);
	const [simplyinToken, setSimplyinToken] = useState<string>("")
	const [countryCode, setCountryCode] = useState<Country>("PL")
	const { t } = useTranslation();

	const [error, setError] = useState("")
	const checkedRef = useRef(false);

	useEffect(() => {
		setError("");

		const getAddressData = () => {
			const selectedInvoiceAddress = document.getElementById("invoice-addresses")?.querySelector(".selected");
			if (selectedInvoiceAddress) return selectedInvoiceAddress;

			return document.getElementById("delivery-addresses")?.querySelector(".selected");
		};

		const getPhoneNumberFromAddress = (addressData: any) => {
			const allAddressDataArray = addressData?.querySelector('.address')?.innerHTML.split("<br>");
			if (!allAddressDataArray?.length) return "";

			return allAddressDataArray[allAddressDataArray.length - 1].replace(/^00|^0/, '+');
		};

		const updatePhoneNumber = (phoneVal: any) => {
			if (!phoneVal) return;

			if (isValidPhoneNumber(phoneVal)) {
				setPhoneInput(phoneVal);
			} else {
				if (phoneVal.startsWith("+")) {
					setPhoneInput(phoneVal);
					setError(t("payment.checkPhoneNumber"));
				} else {
					updatePhoneNumberWithCountryCode(phoneVal);
				}
			}
		};

		const updatePhoneNumberWithCountryCode = (phoneVal: any) => {
			try {
				const countrySelect = document.getElementById('billing_country') as HTMLSelectElement;
				const countryCode = countrySelect?.options[countrySelect?.selectedIndex]?.value || "PL";
				const selectedCountryNumber = parsePhoneNumber(phoneVal, countryCode as Country || "PL");

				if (!selectedCountryNumber) return;

				setCountryCode(countryCode as Country);
				setPhoneInput(selectedCountryNumber.number || "");

				if (!isValidPhoneNumber(selectedCountryNumber.number) && phoneVal) {
					setError(t("payment.checkPhoneNumber"));
				}
			} catch (err) {
				setError(t('payment.phoneNumberError'));
				console.log(err);
			}
		};

		const addressData = getAddressData();
		const phoneVal = getPhoneNumberFromAddress(addressData);

		updatePhoneNumber(phoneVal);

		checkedRef.current = true;
	}, [checked]);

	const handleChangeCheckbox = () => {
		setChecked((prev: any) => {
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
			setError(t('payment.phoneNumberIncorrect'));
		}
	}

	useEffect(() => {

		const simplyinTokenFromStorage = sessionStorage.getItem("simplyinToken")
		if (simplyinTokenFromStorage) {
			setSimplyinToken(simplyinTokenFromStorage || "")
		}
		sessionStorage.setItem("createSimplyAccount", `${valueRegister || false}`)
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
						style={{ marginLeft: "-11px" }}
					id="simply-save-checkbox"
					name="simply-save-checkbox"
					checked={simplyinToken ? !!simplyinToken : checked}
					onChange={handleChangeCheckbox}
					inputProps={{ 'aria-label': 'controlled' }} />
				<CheckboxLabel onClick={() => handleChangeCheckbox()}>
						<span>{t('payment.paymentTitle-1')}
						</span> {t('payment.paymentTitle-2')}
				</CheckboxLabel>
			</CheckboxContainer>

				<ClickedDiv onClick={BubblingHandling}>
					{checked && <>
						<SimplyInFullLogo style={{ marginBottom: "8px" }} />

						<PhoneInput
							style={{ padding: 5 }}
							autocomplete="off"
							international
							countryCallingCodeEditable={false}
							defaultCountry={countryCode || "PL"}
							value={phoneInput}
							//@ts-ignore
							onChange={phoneChange}
							inputComponent={MyCustomInput} /> 

						{error && <div style={{ color: '#ff8000' }}>{error}</div>}
						<Divider style={{ marginTop: "16px", marginBottom: "16px" }} />
					</>}
				</ClickedDiv>
				{checked && <>
					<PhoneInputDescription>
						{t('payment.createAccountDescription-1')}
						<PhoneInputDescriptionLink href="https://simply.in/" target="_blank">{" "}Simply.IN</PhoneInputDescriptionLink>
						{t('payment.createAccountDescription-2')}
						<PhoneInputDescriptionLink href={"./"} target="_blank">{" "}Simply.IN.</PhoneInputDescriptionLink>
				</PhoneInputDescription>
				<PhoneInputDescriptionSecondary>
						{t('payment.createAccountDescription-3')}
						<PhoneInputDescriptionLink href="https://simply.in/terms-b2c" target="_blank">{" "}	{t('payment.createAccountDescription-4')}
							{" "}Simply.In.{" "}</PhoneInputDescriptionLink >
						{t('payment.createAccountDescription-5')}
						<PhoneInputDescriptionLink href="https://simply.in/" target="_blank">{" "}Simply.In.</PhoneInputDescriptionLink>
						{t('payment.createAccountDescription-6')}
						<PhoneInputDescriptionLink href="https://simply.in/privacy-policy" target="_blank">{" "}{t('payment.createAccountDescription-7')}</PhoneInputDescriptionLink>
				</PhoneInputDescriptionSecondary>


			</>}
		</>
		}

		</div>
	)
}

export default PhoneField
