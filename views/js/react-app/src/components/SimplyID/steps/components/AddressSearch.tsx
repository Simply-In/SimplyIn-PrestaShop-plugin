import TextField from '@material-ui/core/TextField';
import axios from 'axios';
import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import geolib from 'geolib';
import { RadioElementContainerSelectMachine, StyledAddressSearchContainer, StyledRadioContainer, StyledRadioGroupSelectMachine, StyledSearchField } from './components.styled';
import { FormControlLabel, Radio } from '@mui/material';

import { DataValueContainer, DataValueTitle, DataValueLabel, NoDataLabel } from '../../SimplyID.styled';

import NoData from '../../../../assets/NoData.svg';
import { CalculateSquareCoordinate, Coordinates, calculateSquareCorners, getLogo, getPoints } from '../functions';



interface IAddressSearch {
	setLockerIdValue: any
	setValue: any
	setAdditionalInfo: any
	addressNameRef: any
}

export const AddressSearch = ({
	setLockerIdValue,
	setValue,
	setAdditionalInfo,
	addressNameRef }:
	IAddressSearch) => {

	const [searchInput, setSearchInput] = useState<string>('');
	const [addressOptions, setAddressOptions] = useState<any[]>([]);
	const [selectedValue, setSelectedValue] = useState<any>(null);
	const [machineData, setMachineData] = useState<any[]>([])

	const handleChangeSearchInput = (_: any, val: string) => {
		setSearchInput(val)
	}

	const getAddress = debounce(() => {

		axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&format=json`)
			.then((res) => {
				console.log(res?.data);
				setAddressOptions(res?.data || []);
			})
			.catch((error) => {
				console.error("Error fetching address:", error);
			});
	}, 300);


	useEffect(() => {
		setMachineData([])
		getAddress();
		return () => getAddress.cancel();
	}, [searchInput]);


	const handleAutocompleteChange = (_: any, val: any) => {

		setSelectedValue(val)

		if (val?.lat && val?.lon && val) {

			const coordsObject: CalculateSquareCoordinate[] = calculateSquareCorners({ latitude: val?.lat, longitude: val?.lon }, 500)


			getPoints(coordsObject)
				.then(response => {
					if (!response.ok) {
						throw new Error(`HTTP error! Status: ${response.status}`);
					}
					return response.json();
				})

				.then(({ data }) => {
					if (data.length) {
						return { data: data }
					} else {
						return getPoints(calculateSquareCorners({ latitude: val?.lat, longitude: val?.lon }, 5000)).then(response => {
							if (!response.ok) {
								throw new Error(`HTTP error! Status: ${response.status}`);
							}
							return response.json();
						})
					}
				})
				.then(({ data }) => {

					const calculateDistance = (item: Coordinates) => {
						if (val?.lat && val?.lon) {
							return geolib.getDistance({ latitude: val?.lat, longitude: val?.lon }, { latitude: item.latitude, longitude: item.longitude })
						}

						return null
					}

					const pointsWithDistance = data.map((item: Coordinates) => {
						return { ...item, distance: calculateDistance(item) }
					})


					const sortedFromClosest = pointsWithDistance.sort((a: any, b: any) => a?.distance - b?.distance);

					setMachineData(sortedFromClosest)

				})
				.catch(error => {
					console.error("Error fetching machines:", error);
				});
		}


	}

	const handleChangeMachine = (e: any) => {

		const selectedPoint = machineData[e.target.value]
		setLockerIdValue(selectedPoint?.foreign_access_point_id || "")
		setValue("lockerId", selectedPoint.foreign_access_point_id || "")
		setValue('address', `${selectedPoint?.street || ""} ${selectedPoint?.house_number || ""} ${selectedPoint?.postal_code || ""} ${selectedPoint?.city || ""}`)
		setValue('label', selectedPoint?.supplier || "")
		setAdditionalInfo(selectedPoint?.name || "")

		if (addressNameRef?.current) {

			const inputElement = addressNameRef.current?.querySelector('input');

			if (inputElement) {
				inputElement.focus();
				const containerElement = document.getElementById('containerSimply');
				if (containerElement) {


					setTimeout(() => containerElement.scrollTo({
						top: document.body.scrollHeight,
						behavior: 'smooth',
					}), 50)
				}
			}
		}



	}

	return (
		<StyledAddressSearchContainer>
			{/* mui v4 on purpose, v5 is not working */}
			<StyledSearchField
				freeSolo
				id="addressSearchInput"
				value={selectedValue}
				onChange={handleAutocompleteChange}
				inputValue={searchInput}
				//filterOptions is a fix for not refreshing results bug
				filterOptions={x => x}
				onInputChange={handleChangeSearchInput}
				options={addressOptions}
				getOptionLabel={(option: any) => option?.display_name}
				renderInput={(params) => <TextField {...params} label="Wyszukaj adres" variant="outlined" />}
			/>

			<StyledRadioContainer >
				<StyledRadioGroupSelectMachine
					aria-labelledby="demo-radio-buttons-group-label"
					name="radio-buttons-group"
					onChange={handleChangeMachine}
				>
					{machineData?.filter(Boolean)?.slice(0, 5).length
						?
						machineData?.filter(Boolean)?.slice(0, 5)?.map((machine: any, index: number) => {
							return (
								<RadioElementContainerSelectMachine>
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
													<img src={getLogo({ label: machine?.supplier || "" }) || ""} alt={machine?.supplier || ""} style={{
														width: '42px',
														height: '42px'
													}} />
												</div>
												<DataValueContainer>
													<DataValueTitle>{machine?.foreign_access_point_id}</DataValueTitle>
													<DataValueLabel>{machine?.street?.charAt(0).toUpperCase() + machine?.street?.slice(1).toLowerCase()}{" "}{machine?.house_number}{" "}{machine?.postal_code}{" "}{machine?.city.charAt(0).toUpperCase() + machine?.city.slice(1).toLowerCase()}</DataValueLabel>
													<DataValueLabel>Odległość: {machine?.distance}m</DataValueLabel>
												</DataValueContainer>
											</div>
										} style={{ marginBottom: 0 }} />

								</RadioElementContainerSelectMachine>)

						})
						:
						<div style={{
							width: "100%",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							flexDirection: "column"
						}}>
							<div className="logo"
								style={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",

									marginRight: "8px",
									alignItems: "center"
								}}>
								{/* // eslint-disable-next-line @typescript-eslint/ban-ts-comment
								//@ts-ignore */}
								<img src={`${files_url}/views/js/react-app/dist/${NoData}`} alt="Brak danych" style={{
									width: '90%',
									height: 'auto'
								}} />
								<NoDataLabel style={{ color: "#707070", fontSize: 14, fontWeight: 600 }}>Nie znaleziono żadnych punktów w pobliżu podanego adresu</NoDataLabel>
							</div>
						</div>
					}
				</StyledRadioGroupSelectMachine>
			</StyledRadioContainer>
		</StyledAddressSearchContainer>
	)
}
