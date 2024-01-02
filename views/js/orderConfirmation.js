const middlewareApi = async ({ endpoint, method, requestBody, token }) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const baseUrl = base_url || ".";

  const url = `${baseUrl}./modules/simplyin/api/submitData.php`;
  const headers = {
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    endpoint,
    method,
    requestBody,
    ...(token ? { token } : {}),
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(error);
  }
};

const loadDataFromSessionStorage = ({ key }) => {
  try {
    const serializedData = sessionStorage.getItem(key);
    if (serializedData === null) {
      return undefined;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error("Error loading data", error);
    return undefined;
  }
};

$(document).ready(async function () {
  console.log("params", params);
  console.log("order_carrier", order_carrier);
  console.log("carrier", carrier);

  console.log("delivery_address", delivery_address);
  console.log("delivery_State", delivery_State);
  console.log("billing_address", billing_address);
  console.log("billing_State", billing_State);
  console.log("billing_country", billing_country);
  console.log("delivery_country", delivery_country);

  console.log("totalPaid", totalPaid);
  console.log("currency", currency);
  console.log("customer", customer);
  console.log("orderProducts", orderProducts);
  console.log("customer_data", customer_data);

  console.log("deliveryPoint", deliveryPoint);

  console.log("shopName", shopName);

  const getLangBrowser = () => {
    if (navigator.languages !== undefined) return navigator.languages[0];
    else return navigator.language;
  };

  let shortLang = (lang) => lang.substring(0, 2).toUpperCase();

  const billingAddresses = [
    {
      addressName: billing_address.company.trim().substring(0, 15) || "",
      street: (billing_address.address1 || "").trim(),
      appartmentNumber: (billing_address.address2 || "").trim() || "",
      city: (billing_address.city || "").trim(),
      postalCode: (billing_address.postcode || "").trim(),
      country: (billing_country.iso_code || "").trim(),
      companyName: (billing_address.company || "").trim(),
      name: (billing_address.firstname || "").trim(),
      surname: (billing_address.lastname || "").trim(),
      taxId: (billing_address.vat_number || "").trim() || "",
      phone: (billing_address.phone || "").trim(),
      state: (billing_State?.iso_code || "").trim() || "",
    },
  ];

  const shippingAddresses = [
    {
      addressName: billing_address.company.trim().substring(0, 15) || "",
      street: (delivery_address.address1 || "").trim(),
      appartmentNumber: (delivery_address.address2 || "").trim() || "",
      city: (delivery_address.city || "").trim(),
      postalCode: (delivery_address.postcode || "").trim(),
      country: (delivery_country.iso_code || "").trim(),
      companyName: (delivery_address.company || "").trim(),
      name: (delivery_address.firstname || "").trim(),
      surname: (delivery_address.lastname || "").trim(),
      phone: (delivery_address.phone || "").trim(),
      state: (delivery_State?.iso_code || "").trim() || "",
    },
  ];

  //   const res = await axios(
  //     `https://api-pl-points.easypack24.net/v1/points/${deliveryPoint}`
  //   );
  //   const inpostPointData = res?.data;

  const response = await fetch(
    `https://api-pl-points.easypack24.net/v1/points/${deliveryPoint}`
  );

  // if (response.ok) {
  const inpostPointData = await response.json();
  // Use inpostPointData as needed
  // } else {
  //   console.error(`Failed to fetch data. Status: ${response.status}`);
  // }

  console.log("inpostPointData", inpostPointData);

  const parcelLockers = [
    {
      addressName: "",
      label: "",
      lockerId: deliveryPoint,
      address: `${inpostPointData?.address?.line1 || ""}, ${
        inpostPointData?.address?.line2 || ""
      }`,
    },
  ];

  const createAccount = loadDataFromSessionStorage({
    key: "createSimplyAccount",
  });

  const phoneNumber = loadDataFromSessionStorage({ key: "phoneNumber" });
  const simplyinToken = sessionStorage.getItem("simplyinToken");

  if (!!simplyinToken) {
    const userData = loadDataFromSessionStorage({
      key: "UserData",
    });

    function addIfValueNotExists(newObj, arrayKey) {
      const keys = Object.keys(newObj)
        .filter((key) => newObj[key] != "")
        .filter((key) => newObj[key] != null)
        .filter((key) => key != "addressName")
        .filter((key) => key != "_id");

      for (let existingObj of userData[arrayKey]) {
        if (keys.every((key) => newObj[key] === existingObj[key])) {
          return;
        }
      }

      userData[arrayKey].push(newObj);
    }

    addIfValueNotExists(billingAddresses[0], "billingAddresses");
    addIfValueNotExists(shippingAddresses[0], "shippingAddresses");

    if (deliveryPoint) {
      addIfValueNotExists(parcelLockers[0], "parcelLockers");
    }

    // if there is parcelLocker without id it means it has been just added
    const arrayOfIdParcel = userData.parcelLockers.map((el) => el._id);
    const indexOfUndefinedParcel = arrayOfIdParcel.indexOf(undefined);

    const arrayOfId = userData.shippingAddresses.map((el) => el._id);
    const indexOfUndefined = arrayOfId.indexOf(undefined);

    const arrayOfIdBilling = userData.billingAddresses.map((el) => el._id);
    const indexOfUndefinedBilling = arrayOfIdBilling.indexOf(undefined);

    middlewareApi({
      endpoint: "userData",
      method: "PATCH",
      requestBody: userData,
      token: simplyinToken,
    })
      .then((res) => {
        console.log("User data updated");
        console.log(res);
        let newItem;

        if (indexOfUndefined !== -1) {
          const idNotInModel = res.data.shippingAddresses.filter(
            (item) => !arrayOfId.includes(item._id)
          )[0];

          newItem = res.data.shippingAddresses.find(
            (item) => item._id === idNotInModel._id
          );
        } else {
          const ShippingIndex = loadDataFromSessionStorage({
            key: "ShippingIndex",
          });
          const BillingIndex = loadDataFromSessionStorage({
            key: "BillingIndex",
          });
          newItem =
            ShippingIndex !== null
              ? res.data?.shippingAddresses[ShippingIndex]
              : res.data?.billingAddresses[BillingIndex];
          //nie ma nowego elementu
        }

        let newItemBilling;
        if (indexOfUndefinedBilling !== -1) {
          //jest nowy element

          const idNotInModel = res.data.billingAddresses.filter(
            (item) => !arrayOfIdBilling.includes(item._id)
          )[0];

          newItemBilling = res.data.billingAddresses.find((item) => {
            if (idNotInModel && "_id" in idNotInModel) {
              return item._id === idNotInModel._id;
            }
          });
        } else {
          const BillingIndex = loadDataFromSessionStorage({
            key: "BillingIndex",
          });
          newItemBilling = res.data?.billingAddresses[BillingIndex];
          if (!newItemBilling.state) {
            newItemBilling.state = "";
          }
          if (!newItemBilling.taxId) {
            newItemBilling.taxId = "";
          }
          if (!newItemBilling.appartmentNumber) {
            newItemBilling.appartmentNumber = "";
          }
          //   console.log("2 newItem", newItem);
          //nie ma nowego elementu
        }
        console.log("newItemBilling", newItemBilling);

        let newItemParcel;
        if (indexOfUndefinedParcel !== -1) {
          //jest nowy element
          const idNotInModel = res.data.parcelLockers.filter(
            (item) => !arrayOfIdParcel.includes(item._id)
          )[0];

          newItemParcel = res.data.parcelLockers.find(
            (item) => item._id === idNotInModel._id
          );
        } else {
          const ParcelIndex = loadDataFromSessionStorage({
            key: "ParcelIndex",
          });

          newItemParcel = res.data?.parcelLockers[ParcelIndex];

          //nie ma nowego elementu
        }

        middlewareApi({
          endpoint: "checkout/createOrder",
          method: "POST",
          token: simplyinToken,
          requestBody: {
            desc: "",
            price: Number(totalPaid),
            currency: currency,
            placedDuringAccountCreation: false,
            name: customer.firstname.trim(),
            surname: customer.lastname.trim(),
            items: customer_data.products,
            shopName: shopName || "",
            billingData: { ...newItemBilling },
            ...(deliveryPoint
              ? {
                  parcelLockerData: {
                    _id: newItemParcel?._id,
                    addressName: newItemParcel?.addressName,
                    label: newItemParcel?.label,
                    lockerId: newItemParcel?.lockerId,
                    address: newItemParcel?.address,
                  },
                }
              : {
                  shippingData: {
                    state: "",
                    ...shippingAddresses[0],
                    _id: newItem._id,
                  },
                }),
          },
        });
      })

      .then(() => {
        sessionStorage.removeItem("phoneNumber");
        sessionStorage.removeItem("createSimplyAccount");
        sessionStorage.removeItem("simplyinToken");
        sessionStorage.removeItem("UserData");
        sessionStorage.removeItem("BillingIndex");
        sessionStorage.removeItem("ShippingIndex");
        sessionStorage.removeItem("inpost-delivery-point");
      });

    return;
  }

  if (!createAccount) {
    return;
  }

  const parcelLockersNewAccount = deliveryPoint
    ? [
        {
          addressName: "",
          label: "",
          lockerId: deliveryPoint,
          address: `${inpostPointData?.address?.line1 || ""}, ${
            inpostPointData?.address?.line2 || ""
          }`,
        },
      ]
    : [];

  middlewareApi({
    endpoint: "checkout/createUserData",
    method: "POST",
    requestBody: {
      name: (customer.firstname || "").trim(),
      surname: (customer.lastname || "").trim(),
      email: (customer.email || "").trim().toLowerCase(),
      phoneNumber: (phoneNumber || "").trim(),
      billingAddresses: billingAddresses || [],
      shippingAddresses: shippingAddresses || [],
      parcelLockers: parcelLockersNewAccount,

      language: shortLang(getLangBrowser()) ?? language_code.toUpperCase(),
      termsAndConditionsAccepted: true,
      marketingConsent: true,
    },
  })
    .then((res) => {
      if (res.error) {
        throw new Error(res.error);
      }
      console.log("Simply account created with data:", res);

      return res;
    })
    .then((res) => {
      const orderShippingParcelInfoNewAccount = deliveryPoint
        ? {
            parcelLockerData: {
              _id: res?.data?.parcelLockers[0]?._id,
              addressName: res?.data?.parcelLockers[0]?.addressName,
              label: res?.data?.parcelLockers[0]?.label,
              lockerId: res?.data?.parcelLockers[0]?.lockerId,
              address: res?.data?.parcelLockers[0]?.address,
            },
          }
        : { shippingData: res?.data?.shippingAddresses[0] };

      middlewareApi({
        endpoint: "checkout/createOrder",
        method: "POST",
        token: res.authToken,
        requestBody: {
          price: Number(totalPaid),
          currency: currency,
          placedDuringAccountCreation: true,
          name: (customer.firstname || "").trim(),
          surname: (customer.lastname || "").trim(),
          shopName: shopName || "",
          billingData: res?.data?.billingAddresses[0],
          items: customer_data.products,
          ...orderShippingParcelInfoNewAccount,
        },
      });
    })
    .then(() => {
      sessionStorage.removeItem("phoneNumber");
      sessionStorage.removeItem("createSimplyAccount");
      sessionStorage.removeItem("simplyinToken");
      sessionStorage.removeItem("UserData");
      sessionStorage.removeItem("BillingIndex");
      sessionStorage.removeItem("ShippingIndex");
      sessionStorage.removeItem("inpost-delivery-point");
    })
    .catch((error) => {
      console.log(error);
    });
});
