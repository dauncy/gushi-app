import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";
interface SubscriptionContextType {
	customerInfo: CustomerInfo | null;
	revalidateSubscription: () => Promise<void>;
	revalidating: boolean;
}

export const SubscriptionContext = createContext<SubscriptionContextType>({
	customerInfo: null,
	revalidateSubscription: async () => {},
	revalidating: false,
});

export const SubscriptionProvider = ({
	children,
	customerInfo,
}: {
	children: ReactNode;
	customerInfo: CustomerInfo | null;
}) => {
	const [subscription, setSubscription] = useState<CustomerInfo | null>(customerInfo);
	const [revalidating, setRevalidating] = useState(false);

	useEffect(() => {
		setSubscription(customerInfo);
	}, [customerInfo]);

	const revalidateSubscription = useCallback(async () => {
		setRevalidating(true);
		const customerInfo = await Purchases.getCustomerInfo();
		setSubscription(customerInfo);
		setRevalidating(false);
	}, [setSubscription]);

	return (
		<SubscriptionContext.Provider value={{ customerInfo: subscription, revalidateSubscription, revalidating }}>
			{children}
		</SubscriptionContext.Provider>
	);
};

export const useSubscription = () => {
	const { customerInfo, revalidateSubscription, revalidating } = useContext(SubscriptionContext);

	const activeEntitlements = customerInfo?.entitlements?.active;
	if (!activeEntitlements) {
		return { customerInfo, hasSubscription: false, subscriptionType: null, revalidateSubscription, revalidating };
	}
	if (activeEntitlements["Pro - Lifetime"]) {
		return { customerInfo, hasSubscription: true, subscriptionType: "lifetime", revalidateSubscription, revalidating };
	}
	if (activeEntitlements["Pro - Recurring"]) {
		return { customerInfo, hasSubscription: true, subscriptionType: "recurring", revalidateSubscription, revalidating };
	}
	return { customerInfo, hasSubscription: false, subscriptionType: null, revalidateSubscription, revalidating };
};
