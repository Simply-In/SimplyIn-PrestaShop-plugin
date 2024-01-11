import { useContext, useEffect, useState } from 'react'
import { PopupHeader, Step2Title, SectionTitle, RadioElementContainer, DataValueContainer, DataValueLabel, DataValueTitle, AddNewData, AddNewDataText, NoDataLabel } from '../SimplyID.styled'
import { IconButton, CardContent, CardActions, Collapse, Button, FormControl, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IconButtonProps } from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import { Step2Form } from './components/Step2Form';
import { styled } from '@mui/material/styles';
import { PlusIcon } from '../../../assets/PlusIcon';
import ContextMenu from '../ContextMenu';
import { SelectedDataContext } from '../SimplyID';
import { removeDataSessionStorage, saveDataSessionStorage } from '../../../services/sessionStorageApi';
import axios from 'axios';
import { selectPickupPointInpost } from '../../../functions/selectInpostPoint';
import { getLogo } from './functions';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';



interface IStep2 {
	handleClosePopup: () => void;
	userData: any
	setUserData: any,
	setSelectedUserData: any,
	listOfCountries: any
	editItemIndex: any,
	setEditItemIndex: any,
}

interface ExpandMoreProps extends IconButtonProps {
	expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
	const { ...other } = props;
	return <IconButton {...other} />;
})(({ theme, expand }) => ({
	transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
	marginLeft: 'auto',
	transition: theme.transitions.create('transform', {
		duration: theme.transitions.duration.shortest,
	}),
}));



export const Step2 = ({ handleClosePopup, userData, setUserData, setSelectedUserData, editItemIndex, setEditItemIndex, listOfCountries }: IStep2) => {


	const [expanded, setExpanded] = useState({
		billing: true,
		shipping: false,
		deliveryPoint: true
	});




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
		setPickupPointDelivery,
		simplyInput } = useContext(SelectedDataContext)

	const handleExpandClick = (property: "billing" | "shipping" | "deliveryPoint", value?: boolean) => {

		setExpanded((prev) => {
			return ({ ...prev, [property]: value ? value : !prev[property] })
		});
	};
	type DeliveryType = "address" | "machine"
	const [deliveryType, setDeliveryType] = useState<DeliveryType>("address");

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>, type: "billing" | "shipping" | "parcelLockers") => {
		if (type === "billing") {
			setSelectedBillingIndex(+(event.target as HTMLInputElement).value);
		}
		else if (type === "shipping") {

			setSelectedShippingIndex(+(event.target as HTMLInputElement).value);
			setSameDeliveryAddress(false)
		}
		else if (type === "parcelLockers") {
			setSelectedDeliveryPointIndex(+(event.target as HTMLInputElement).value);
			setPickupPointDelivery(true)
		}

	}



	const handleAddNewData = (property: "billingAddresses" | "shippingAddresses" | "parcelLockers") => {
		setEditItemIndex({ property: property, itemIndex: userData[property]?.length ? userData[property]?.length : 0, isNewData: true })
	}



	const handleSelectData = () => {

		if (!userData?.billingAddresses[selectedBillingIndex]) {
			return
		}

		if (deliveryType === "address") {

			// resetDeliveryMethod()
			setSelectedUserData((prev: any) => {
				sessionStorage.setItem("BillingIndex", `${selectedBillingIndex}`)
				sessionStorage.setItem("ShippingIndex", `${selectedShippingIndex}`)
				sessionStorage.setItem("ParcelIndex", `null`)
				return ({
					...prev,
					billingAddresses: userData?.billingAddresses[selectedBillingIndex || 0],
					shippingAddresses: (selectedShippingIndex !== null && userData?.shippingAddresses?.length) ? userData?.shippingAddresses[selectedShippingIndex || 0] : null,
					parcelLockers: null
				})
			})
		} else {
			setSelectedUserData((prev: any) => {
				sessionStorage.setItem("BillingIndex", `${selectedBillingIndex}`)
				sessionStorage.setItem("ShippingIndex", `null`)
				sessionStorage.setItem("ParcelIndex", `${selectedDeliveryPointIndex}`)
				return ({
					...prev,
					billingAddresses: userData?.billingAddresses[selectedBillingIndex || 0],
					shippingAddresses: null,
					parcelLockers: userData?.parcelLockers[selectedDeliveryPointIndex]?.lockerId || null
				})
			})
			if (selectedDeliveryPointIndex !== undefined) {
				selectPickupPointInpost({ deliveryPointID: userData?.parcelLockers[selectedDeliveryPointIndex]?.lockerId });
			}


		}


		saveDataSessionStorage({ key: 'isParcelAdded', data: false })

		removeDataSessionStorage({ key: 'delivery-address' })
		removeDataSessionStorage({ key: 'invoice-address' })
		removeDataSessionStorage({ key: 'inpost-delivery-point' })
		// removeDataSessionStorage({ key: 'customChanges' })



		const billingData = userData?.billingAddresses[selectedBillingIndex || 0]
		const shippingData = (selectedShippingIndex !== null && userData?.shippingAddresses?.length) ? userData?.shippingAddresses[selectedShippingIndex || 0] : null


		if (billingData) { handlePhpScript(billingData, 'billingAddressesId') }
		if (shippingData) { handlePhpScript(shippingData, 'shippingAddressesId') }





		if (selectedDeliveryPointIndex !== undefined) {
			removeDataSessionStorage({ key: 'isParcelAdded' })
			selectPickupPointInpost({ deliveryPointID: userData?.parcelLockers[selectedDeliveryPointIndex]?.lockerId });
		}

		handleClosePopup()

	}


	const handleChangeShippingCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSameDeliveryAddress(() => {
			handleExpandClick("shipping", !event.target.checked)
			if (event.target.checked) {
				setSelectedShippingIndex(null)
				handleExpandClick("shipping", false)
			} else {
				setSelectedShippingIndex(0)
			}
			return (event.target.checked)
		});
	};
	// const handleChangeDeliveryCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {

	// 	setPickupPointDelivery(() => {
	// 		handleExpandClick("parcelLockers", !event.target.checked)
	// 		if (event.target.checked) {
	// 			setSelectedDeliveryPointIndex(0)
	// 			handleExpandClick("parcelLockers", true)
	// 			saveDataSessionStorage({
	// 				key: 'useParcel',
	// 				data: true
	// 			});
	// 		}
	// 		else {
	// 			handleExpandClick("parcelLockers", false)
	// 			setSelectedDeliveryPointIndex(null)
	// 			saveDataSessionStorage({
	// 				key: 'useParcel',
	// 				data: false
	// 			});
	// 		}
	// 		return (event.target.checked)
	// 	});
	// };

	interface IAddress {
		addressName: string,
		name: string,
		surname: string,
		street: string,
		appartmentNumber?: string,
		city: string,
		postalCode: string,
		country: string,
		state?: string,
		companyName?: string,
		taxId?: string
	}

	const handlePhpScript = (data: IAddress, addresNameId: "billingAddressesId" | "shippingAddressesId") => {

		const shippingData = (selectedShippingIndex !== null && userData?.shippingAddresses?.length) ? userData?.shippingAddresses[selectedShippingIndex || 0] : null


		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		data.country = listOfCountries?.find((el: any) => el.iso_code === data?.country)?.id_country ?? 1

		if (!data.addressName) {
			data.addressName = `Adres ${addresNameId === "billingAddressesId" ? selectedBillingIndex : selectedShippingIndex}`
		}


		console.log(data);

		const dataToSend = {
			email: simplyInput,
			addressData: data,
			use_same_address: addresNameId === "shippingAddressesId" ? 0 : 1
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		const baseUrl = base_url || '.'
		console.log(dataToSend);
		// return
		// axios.post('../modules/simplyin/api/createAddresses.php', { //stage
		axios.post(`${baseUrl}/modules/simplyin/api/createAddresses.php`, {	//dev
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			dataToSend

		})
			.then(response => {
				console.log(response.data);
				saveDataSessionStorage({ key: addresNameId, data: response.data?.newAddressId })

				if (!shippingData) {
					saveDataSessionStorage({ key: "shippingAddressesId", data: response.data?.newAddressId })


				}
				if (response.data.status === 'success') {
					// Handle the success response
				} else {
					// Handle any errors
					console.error(response.data.message);
				}
			})
			.catch(error => {
				console.error('An error occurred:', error);
			});

	}


	const handleChangeDelivery = (event: React.ChangeEvent<HTMLInputElement>) => {
		setDeliveryType((event.target as HTMLInputElement).value as DeliveryType);

		if ((event.target as HTMLInputElement).value === "machine") {
			if (userData?.parcelLockers?.length && !selectedDeliveryPointIndex) {
				setSelectedDeliveryPointIndex(0)
				setPickupPointDelivery(true)
			}
		}
	};

	useEffect(() => {

		if (selectedDeliveryPointIndex !== null && selectedShippingIndex == null) {
			console.log("MACHINE")

			return setDeliveryType("machine")
		}
		console.log('address');
		setDeliveryType("address")
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	console.log('modal data', userData);
	return (
		<>
			{!editItemIndex?.property &&
				<PopupHeader style={{ position: "relative", zIndex: 1, padding: 0, borderBottom: "none" }}>

					<Step2Title >
						Wybierz dane
					</Step2Title>
				</PopupHeader>
			}


			{!editItemIndex?.property && <>
				<CardActions disableSpacing sx={{ padding: 0 }}>
					<SectionTitle>Dane rozliczeniowe</SectionTitle>

					<ExpandMore
						expand={expanded.billing}
						onClick={() => handleExpandClick('billing')}
						aria-expanded={expanded.billing}
						aria-label="show more"
					>
						<ExpandMoreIcon />
					</ExpandMore>
				</CardActions>

				<Collapse in={!expanded.billing} timeout="auto" unmountOnExit>
					{userData?.billingAddresses?.length
						?
						<DataValueContainer style={{ padding: 8 }}>
							<DataValueTitle>
								{userData?.billingAddresses[selectedBillingIndex || 0]?.addressName ?? <>Adres{" "}{(+selectedBillingIndex || 0) + 1}</>}
							</DataValueTitle>
							{userData?.billingAddresses &&
								<DataValueLabel>
									{userData?.billingAddresses[selectedBillingIndex || 0]?.street}{" "}{userData?.billingAddresses[selectedBillingIndex || 0]?.appartmentNumber},{" "}{userData?.billingAddresses[selectedBillingIndex || 0]?.postalCode},{" "}{userData?.billingAddresses[selectedBillingIndex || 0]?.city}
								</DataValueLabel>
							}
						</DataValueContainer>
						:
						<CardContent>
							<NoDataLabel>Brak danych</NoDataLabel>
						</CardContent>
					}
				</Collapse>
				<Collapse in={expanded.billing} timeout="auto" unmountOnExit>
					<CardContent sx={{ padding: '8px', paddingBottom: '0px !important' }}>
						<RadioGroup
							value={selectedBillingIndex}
							aria-labelledby="demo-radio-buttons-group-label"
							name="radio-buttons-group"
							onChange={(e) => handleChange(e, "billing")}
						>
							{userData?.billingAddresses?.length
								?
								userData?.billingAddresses.map((el: any, index: number) => {
									return (
										<RadioElementContainer>
											<FormControlLabel value={index} control={<Radio />}
												label={
													<DataValueContainer>
														<DataValueTitle>{el?.addressName ? el.addressName : <>Adres{" "}{index + 1}</>}</DataValueTitle>
														<DataValueLabel>{el.street}{" "}{el.appartmentNumber},{" "}{el.postalCode},{" "}{el.city}</DataValueLabel>
													</DataValueContainer>
												} style={{ marginBottom: 0 }} />
											<ContextMenu userData={userData} setUserData={setUserData} item={index} setEditItemIndex={setEditItemIndex} property={'billingAddresses'}
												selectedPropertyIndex={selectedBillingIndex}
												setSelectedPropertyIndex={setSelectedBillingIndex}

											/>
										</RadioElementContainer>)

								})
								:

								<NoDataLabel>Brak danych</NoDataLabel>
							}
						</RadioGroup>


					</CardContent>

				</Collapse>
				<AddNewData onClick={() => handleAddNewData("billingAddresses")} style={{ paddingBottom: 12, borderBottom: " 1px solid #D9D9D9" }}>

					<PlusIcon />
					<AddNewDataText>Dodaj nowe dane rozliczeniowe</AddNewDataText>
				</AddNewData>





				{/* <HorizontalLine /> */}
				<FormControl style={{ fontFamily: "font-family: Inter, sans-serif;", borderBottom: " 1px solid #D9D9D9", marginBottom: 12, width: "100%" }}>
					<SectionTitle>Dostawa</SectionTitle>
					<RadioGroup
						aria-labelledby="radioDeliveryType"
						name="radioDeliveryType"
						value={deliveryType}
						onChange={handleChangeDelivery}
						style={{ padding: "8px 8px 0 8px" }}
					>
						<FormControlLabel value="address" control={<Radio />} label={<Typography style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: "16px", color: "rgb(35,35,35)" }}>Dostawa pod drzwi</Typography>} />
						<FormControlLabel value="machine" control={<Radio />} label={<Typography style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: "16px", color: "rgb(35,35,35)" }}>Dostawa do automatu lub punktu</Typography>} />

					</RadioGroup>
				</FormControl>

				{deliveryType === "address" && <>
					<CardActions disableSpacing sx={{ padding: 0 }}>
						<SectionTitle>Dane dostawy</SectionTitle>
						<ExpandMore
							expand={expanded.shipping}
							onClick={() => handleExpandClick("shipping")}
							aria-expanded={expanded.shipping}
							aria-label="show more"
						>
							<ExpandMoreIcon />
						</ExpandMore>
					</CardActions>
					<FormGroup>
						<FormControlLabel sx={{
							textAlign: 'left',
							fontFamily: 'Inter, sans-serif',
							'& .MuiTypography-root': {
								fontFamily: 'Inter, sans-serif'
							}
						}} style={{ textAlign: 'left', fontFamily: "Inter, sans-serif" }} control={<Checkbox checked={sameDeliveryAddress} onChange={handleChangeShippingCheckbox} />} label="Dane dostawy są takie same jak dane rozliczeniowe." />

					</FormGroup>
					<Collapse in={!expanded.shipping} timeout="auto" unmountOnExit>
						{userData?.shippingAddresses?.length
							?
							<DataValueContainer style={{ padding: 8 }}>
								{!sameDeliveryAddress && (selectedShippingIndex !== null && !isNaN(selectedShippingIndex)) &&
									<>
										<DataValueTitle>
											{userData?.shippingAddresses[selectedShippingIndex]?.addressName ?? <>Adres {+selectedShippingIndex + 1}</>}
										</DataValueTitle>
										{userData?.shippingAddresses &&
											<DataValueLabel>
												{userData?.shippingAddresses[selectedShippingIndex]?.street || ""}{" "}{userData?.shippingAddresses[selectedShippingIndex]?.appartmentNumber || ""},{" "}{userData?.shippingAddresses[selectedShippingIndex]?.postalCode || ""},{" "}{userData?.shippingAddresses[selectedShippingIndex]?.city || ""}
											</DataValueLabel>
										}
									</>


								}
							</DataValueContainer>
							:
							null
						}

					</Collapse>
					<Collapse in={expanded.shipping} timeout="auto" unmountOnExit sx={{ padding: '0px !important' }}>
						<CardContent sx={{ padding: '8px', paddingBottom: '0px !important' }}>
							<RadioGroup
								value={selectedShippingIndex}
								aria-labelledby="demo-radio-buttons-group-label"
								name="radio-buttons-group"
								onChange={(e) => handleChange(e, "shipping")}

							>
								{userData?.shippingAddresses?.length
									?
									userData?.shippingAddresses.map((el: any, index: number) => {
										return (
											<RadioElementContainer>
												<FormControlLabel value={index} control={<Radio />}
													label={
														<DataValueContainer>
															<DataValueTitle>{el?.addressName ? el?.addressName : <>Adres{" "}{index + 1}</>}</DataValueTitle>
															<DataValueLabel>{el.street}{" "}{el.appartmentNumber},{" "}{el.postalCode},{" "}{el.city}</DataValueLabel>
														</DataValueContainer>
													} style={{ marginBottom: 0 }} />
												<ContextMenu setUserData={setUserData} item={index} setEditItemIndex={setEditItemIndex} property={"shippingAddresses"} userData={userData}
													selectedPropertyIndex={selectedShippingIndex}
													setSelectedPropertyIndex={setSelectedShippingIndex} />
											</RadioElementContainer>)

									})
									:

									<NoDataLabel>Brak danych</NoDataLabel>

								}

							</RadioGroup>


						</CardContent>

					</Collapse>
					<AddNewData onClick={() => handleAddNewData("shippingAddresses")}>
						<PlusIcon />
						<AddNewDataText>Dodaj nowe dane dostawy</AddNewDataText>
					</AddNewData>
				</>}

				{deliveryType === "machine" &&
					<><CardActions disableSpacing sx={{ padding: 0 }}>
						<SectionTitle>Automaty paczkowe</SectionTitle>
					<ExpandMore
						expand={expanded.deliveryPoint}
						onClick={() => handleExpandClick("deliveryPoint")}
						aria-expanded={expanded.deliveryPoint}
						aria-label="show more"
					>
						<ExpandMoreIcon />
					</ExpandMore>
				</CardActions>
					{/* <FormGroup>
						<FormControlLabel sx={{
							textAlign: 'left',
							fontFamily: 'Inter, sans-serif',
							'& .MuiTypography-root': {
								fontFamily: 'Inter, sans-serif'
							}
						}} style={{ textAlign: 'left', fontFamily: "Inter, sans-serif" }} control={<Checkbox checked={pickupPointDelivery} onChange={handleChangeDeliveryCheckbox} />} label="Dostawa do paczkomatu" />

					</FormGroup> */}
					<Collapse in={!expanded.deliveryPoint} timeout="auto" unmountOnExit>
						{userData?.parcelLockers.length
							?
							<DataValueContainer style={{ padding: 8 }}>

								{pickupPointDelivery && (selectedDeliveryPointIndex !== null && !isNaN(selectedDeliveryPointIndex)) ?

									<>
										<DataValueTitle>
											{userData?.parcelLockers[selectedDeliveryPointIndex]?.addressName || "Adres" + +selectedDeliveryPointIndex + 1}

										</DataValueTitle>
										{userData?.deliveryPoints &&
											<DataValueLabel>
												{userData?.parcelLockers[selectedDeliveryPointIndex]?.address || ""}

											</DataValueLabel>
										}
									</>
									:
									<div style={{ padding: "8px" }}>
										<NoDataLabel>Punkt odbioru nie został wybrany</NoDataLabel>
									</div>

								}
							</DataValueContainer>
							:

							<CardContent>
								<NoDataLabel>Brak danych</NoDataLabel>
							</CardContent>

						}

					</Collapse>
					<Collapse in={expanded.deliveryPoint} timeout="auto" unmountOnExit>
						<CardContent sx={{ padding: '8px', paddingBottom: '0px !important' }}>
							<RadioGroup
								value={selectedDeliveryPointIndex}
								aria-labelledby="demo-radio-buttons-group-label"
								name="radio-buttons-group"
								onChange={(e) => handleChange(e, "parcelLockers")}

							>
								{userData?.parcelLockers.length
									?
									userData?.parcelLockers.map((el: any, index: number) => {
										return (
											<RadioElementContainer>
												<FormControlLabel value={index} control={<Radio />}
													label={
														<div style={{ display: "flex" }}>

															<div className="logo"
																style={{
																	display: "flex",
																	justifyContent: "center",
																	alignItems: "center",
																	minWidth: "50px",
																	width: "50px",
																	marginRight: "8px"
																}}>
																<img src={getLogo({ label: el.label || "" }) || ""} alt={el.label || "supplier logo"} style={{
																	width: '42px',
																	height: '42px'
																}} />
															</div>
															<DataValueContainer>
																<DataValueTitle>{el?.addressName ?? el?.lockerId ?? <>Punkt{" "}{index + 1}</>}</DataValueTitle>
																<DataValueLabel>{el?.address ?? ""}</DataValueLabel>
															</DataValueContainer>
														</div>
													} style={{ marginBottom: 0 }} />
												<ContextMenu setUserData={setUserData} item={index} setEditItemIndex={setEditItemIndex} property={"parcelLockers"} userData={userData}
													selectedPropertyIndex={selectedDeliveryPointIndex}
													setSelectedPropertyIndex={setSelectedDeliveryPointIndex} />
											</RadioElementContainer>)

									})
									:

									<NoDataLabel>Brak danych</NoDataLabel>
								}
							</RadioGroup>
						</CardContent>

						</Collapse>
						<AddNewData onClick={() => handleAddNewData("parcelLockers")}>
							<PlusIcon />
							<AddNewDataText>Dodaj nowe dane paczkomatu lub punktu</AddNewDataText>
						</AddNewData></>}


				<div style={{
					position: "sticky",
					margin: "0 -16px",
					padding: "16px 16px 8px",
					background: "white",
					bottom: "0px",
					zIndex: "10",
					borderTop: "1px solid #F1F7FF"
				}}>
					<Button type="button" variant="contained" color="primary" fullWidth onClick={handleSelectData}
						sx={{
							fontFamily: 'Inter, sans-serif'
						}}>
						Wybierz
					</Button>
				</div>

			</>}

			{editItemIndex?.property &&
				<Step2Form
					userData={userData}
					isNewData={editItemIndex?.isNewData}
					setUserData={setUserData}
					editItem={{ ...(editItemIndex), editData: (userData[editItemIndex?.property])[editItemIndex?.itemIndex] }}
					setEditItemIndex={setEditItemIndex}
					setSelectedBillingIndex={setSelectedBillingIndex}
					setSelectedShippingIndex={setSelectedShippingIndex}
					setSelectedDeliveryPointIndex={setSelectedDeliveryPointIndex}
					setSameDeliveryAddress={setSameDeliveryAddress}
				/>
			}

			{/* <button onClick={handlePhpScript}> call php script</button> */}
		</>
	)
}

export default Step2