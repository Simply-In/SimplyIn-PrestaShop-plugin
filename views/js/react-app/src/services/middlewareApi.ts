import axios from "axios";



interface IRequestBoodyCoordinates {
	lat: string, lng: string
}
interface IMiddlewareApi {
	endpoint: "checkout/submitEmail" | "checkout/submitPhoneNumber" | "checkout/submitCheckoutCode" | "checkout/createUserData" | "userData" | "checkout/createOrder" | "checkout/resend-checkout-code-via-email" | "addresses/find" | "parcelLockers/getClosest",
	method: "GET" | "POST" | "PATCH",
	requestBody: { email: string } | { code: string } | { phoneNumber: string } | { searchAddressBy: string, token: string } | IRequestBoodyCoordinates
	token?: string
}

export const middlewareApi = ({ endpoint, method, requestBody, token }: IMiddlewareApi) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	const baseUrl = base_url || '.'
	// return axios.post('./../../modules/simplyin/api/submitData.php', {   //stage
	if (endpoint !== "parcelLockers/getClosest") {
		return axios.post(`${baseUrl}./modules/simplyin/api/submitData.php`, {			//dev

			endpoint,
			method,
			requestBody,
			...(token ? { token } : {}),
		})
			.then((response) => {
				console.log(response);
				return response.data
			})
			.catch((error) => {
				console.log(error);
			})
	} else {
		return axios.post(`${baseUrl}./modules/simplyin/api/submitData.php`, {
			endpoint,
			method,
			requestBody: {
				"acceptedParcelLockerProviders": [
					"inpost",
					"ruch",
					"poczta",
					"ups",
					"dhl",
					"dpd",
					"meest",
					"fedex",
					"orlen"
				],
				"coordinates": {
					"lat": (requestBody as IRequestBoodyCoordinates).lat,
					"lng": (requestBody as IRequestBoodyCoordinates).lng
				},
				"searchRadiusInMeters": 20000,
				"numberOfItemsToFind": 50
			},
			token: token ?? "",
		})
			.then((response) => {
				return response.data
			})
			.catch((error) => {
				console.log(error);
			})

	}






}

