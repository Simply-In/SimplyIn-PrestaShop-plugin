import geolib from 'geolib';
import inpostLogo from '../../../assets/inpostLogo.png';
import DHLIcon from '../../../assets/DHLIcon.png';
import DPDIcon from '../../../assets/DPDIcon.png';
import PocztaPolskaIcon from '../../../assets/PocztaPolskaIcon.png';
import UPSIcon from '../../../assets/UPSIcon.png';
import OrlenPaczkaIcon from '../../../assets/OrlenPaczkaIcon.png';
import placeholder from '../../../assets/placeholder.png';

export type Coordinates = {
	latitude: number;
	longitude: number;
	[key: string]: any;
};

export type CalculateSquareCoordinate = {
	field: string,
	operator: string,
	value: number
}


export const labelOptions = ["DHL_PARCEL", "DPD", "INPOST", "POCZTA", "UPS", "PWR"] as const



export const getLogo = ({ label }: { label: typeof labelOptions[number] }) => {

	if (label === "INPOST") {
		return inpostLogo
	} else if (label === "DHL_PARCEL") {
		return DHLIcon
	}
	else if (label === "DPD") {
		return DPDIcon
	}
	else if (label === "UPS") {
		return UPSIcon

	} else if (label === "POCZTA") {
		return PocztaPolskaIcon

	} else if (label === "PWR") {
		return OrlenPaczkaIcon
	} else {
		return placeholder
	}


}

export const getPoints = (coordsObject: CalculateSquareCoordinate[]) => {
	return fetch('https://mapa.apaczka.pl/access_points/fetch', {
		method: 'POST',
		mode: 'cors',
		body: JSON.stringify({
			"dataSource": "access_points",
			"operationType": "fetch",
			"data": {
				"operator": "and",
				"criteria": [
					{
						"field": "is_active",
						"operator": "eq",
						"value": "1"
					},
					{
						"field": "supplier",
						"operator": "in",
						"value": [
							"DHL_PARCEL",
							"DPD",
							"INPOST",
							"POCZTA",
							"UPS",
							"PWR"
						]
					},
					{
						"field": "country_code",
						"operator": "eq",
						"value": "PL"
					},
					...coordsObject
				]
			},
			"orderBy": "name"
		}),
	})
}

export const calculateSquareCorners = (center: { latitude: string, longitude: string }, sideLength = 500) => {
	const north = geolib.computeDestinationPoint(center, sideLength / Math.sqrt(2), 0);
	const east = geolib.computeDestinationPoint(center, sideLength / Math.sqrt(2), 90);
	const south = geolib.computeDestinationPoint(center, sideLength / Math.sqrt(2), 180);
	const west = geolib.computeDestinationPoint(center, sideLength / Math.sqrt(2), 270);
	const coordsObject = [
		{
			"field": "latitude",
			"operator": "gt",
			"value": south.latitude
		},
		{
			"field": "latitude",
			"operator": "lt",
			"value": north.latitude
		},
		{
			"field": "longitude",
			"operator": "gt",
			"value": west.longitude
		},
		{
			"field": "longitude",
			"operator": "lt",
			"value": east.longitude
		}]
	return coordsObject
}
