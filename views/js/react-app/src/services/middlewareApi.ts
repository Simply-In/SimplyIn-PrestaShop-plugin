import axios from "axios";

interface IMiddlewareApi {
	endpoint: "checkout/submitEmail" | "checkout/submitPhoneNumber" | "checkout/submitCheckoutCode" | "checkout/createUserData" | "userData" | "checkout/createOrder" | "checkout/resend-checkout-code-via-email",
	method: "GET" | "POST" | "PATCH",
	requestBody: { email: string } | { code: string } | { phoneNumber: string }
	token?: string
}

export const middlewareApi = ({ endpoint, method, requestBody, token }: IMiddlewareApi) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	const baseUrl = base_url || '.'
	// return axios.post('./../../modules/simplyin/api/submitData.php', {   //stage
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
}

