import { useState } from 'react';
import { loadDataFromSessionStorage } from '../services/sessionStorageApi';
import { TabType } from '../components/SimplyID/steps/Step2';

export type DeliveryType = "address" | "machine"

export const isNumber = (str: any) => {
	return !isNaN(str) && !isNaN(parseFloat(str));
}

export const useSelectedSimplyData = () => {
	// const BillingIndex = (sessionStorage.getItem("BillingIndex") || 0) as number
	const ShippingIndex = loadDataFromSessionStorage({ key: "ShippingIndex" }) as number | null
	// const ParcelIndex = sessionStorage.getItem("ParcelIndex") as number | null
	const SelectedTab = loadDataFromSessionStorage({ key: "SelectedTab" }) || "parcel_machine" as TabType


	const [selectedBillingIndex, setSelectedBillingIndex] = useState(loadDataFromSessionStorage({ key: "BillingIndex" }) ?? 0);
	const [selectedShippingIndex, setSelectedShippingIndex] = useState<number | null>(loadDataFromSessionStorage({ key: "ShippingIndex" }) ?? null);
	const [selectedDeliveryPointIndex, setSelectedDeliveryPointIndex] = useState<number | null>(loadDataFromSessionStorage({ key: 'ParcelIndex' }) ?? null)
	const [sameDeliveryAddress, setSameDeliveryAddress] = useState<boolean>((loadDataFromSessionStorage({ key: "sameDeliveryAddress" })) ? true : false);
	const [pickupPointDelivery, setPickupPointDelivery] = useState<boolean>(false);
	const [selectedTab, setSelectedTab] = useState<TabType>(SelectedTab ?? "parcel_machine");
	const [deliveryType, setDeliveryType] = useState<DeliveryType>(isNumber(ShippingIndex) ? "address" : "machine");

	return {
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
		selectedTab,
		setSelectedTab,
		deliveryType,
		setDeliveryType
	};
} 