import { selectDeliveryMethod } from "../../../functions/selectDeliveryMethod"
import placeholder from '../../../assets/placeholder.png';

export const getPlaceholder = () => {
	return placeholder
}

type addressType = { [key: string]: string }

type isSameShippingAndBillingAddressesType = {
	billingAddress: addressType,
	shippingAddress: addressType,
}

export const isSameShippingAndBillingAddresses = ({ billingAddress, shippingAddress }: isSameShippingAndBillingAddressesType): boolean => {


	if (!shippingAddress) {
		return false
	}
	const comparingKeys = Object.keys(shippingAddress).filter((key) => key !== "_id") || []

	for (const key of comparingKeys) {
		if (shippingAddress[key] !== billingAddress[key]) {
			return false
		}
	}
	return true
}







export const predefinedFill = (userData: any, handleClosePopup: any, indexContext: any) => {
	const {
		setSelectedBillingIndex,
		setSelectedShippingIndex,
		setSelectedDeliveryPointIndex,
		setSameDeliveryAddress,
		setPickupPointDelivery
	} = indexContext


	console.log(userData);
	if (!userData) {
		return
	}
	const { billingAddresses, shippingAddresses, parcelLockers } = userData

	if (billingAddresses === undefined) { return }


	console.log('hook', { billingAddresses, shippingAddresses, parcelLockers });


	if (billingAddresses?.length === 0) {

		return
	}

	if (billingAddresses?.length === 1 && shippingAddresses?.length === 1 && parcelLockers?.length === 0) {


		if (isSameShippingAndBillingAddresses({ billingAddress: billingAddresses[0], shippingAddress: shippingAddresses[0] })) {
			setSelectedShippingIndex(null)
			setSelectedDeliveryPointIndex(null)
			setSameDeliveryAddress(true)
			sessionStorage.setItem("ShippingIndex", `null`)

		} else {
			setSelectedShippingIndex(0)
			setSelectedDeliveryPointIndex(0)
			setSameDeliveryAddress(false)
			sessionStorage.setItem("ShippingIndex", `0`)
		}

		setSelectedBillingIndex(0)
		sessionStorage.setItem("BillingIndex", `0`)
		sessionStorage.setItem("ParcelIndex", `null`)

		handleClosePopup()

		selectDeliveryMethod({ provider: "default" })

		return
	}

	if (billingAddresses?.length === 1 && shippingAddresses?.length && parcelLockers?.length === 0) {


		setSelectedBillingIndex(0)
		setSelectedShippingIndex(0)
		sessionStorage.setItem("BillingIndex", `0`)
		sessionStorage.setItem("ShippingIndex", `0`)
		sessionStorage.setItem("ParcelIndex", `null`)
		setSameDeliveryAddress(false)
		setSelectedDeliveryPointIndex(null)

		selectDeliveryMethod({ provider: "default" })
		return
	}

	if (billingAddresses?.length === 1 && shippingAddresses?.length === 0 && parcelLockers?.length === 0) {


		setSelectedBillingIndex(0)
		setSelectedShippingIndex(null)
		setSameDeliveryAddress(true)
		setSelectedDeliveryPointIndex(null)
		sessionStorage.setItem("BillingIndex", `0`)
		sessionStorage.setItem("ShippingIndex", `null`)
		sessionStorage.setItem("ParcelIndex", `null`)
		selectDeliveryMethod({ provider: "default" })

		handleClosePopup()
		return
	}


	if (billingAddresses?.length === 1 && shippingAddresses?.length === 0 && parcelLockers?.length === 1) {

		setSelectedBillingIndex(0)
		setSelectedShippingIndex(null)
		setSelectedDeliveryPointIndex(0)
		setSameDeliveryAddress(true)

		sessionStorage.setItem("BillingIndex", `0`)
		sessionStorage.setItem("ShippingIndex", `null`)
		sessionStorage.setItem("ParcelIndex", `0`)


		selectDeliveryMethod({ deliveryPointID: parcelLockers[0].lockerId });

		handleClosePopup()
		return
	}


	if (billingAddresses?.length === 1 && shippingAddresses?.length === 0 && parcelLockers?.length) {

		setSelectedBillingIndex(0)
		setSelectedShippingIndex(null)

		setSelectedDeliveryPointIndex(0)
		setSameDeliveryAddress(true)
		setPickupPointDelivery(true)

		sessionStorage.setItem("BillingIndex", `0`)
		sessionStorage.setItem("ShippingIndex", `null`)
		sessionStorage.setItem("ParcelIndex", `0`)

	}


}




