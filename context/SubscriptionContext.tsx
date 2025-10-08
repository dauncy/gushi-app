import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from "react-native-purchases";
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

export const useSubscription = (): {
	customerInfo: CustomerInfo | null;
	hasSubscription: boolean;
	subscriptionType: "lifetime" | "recurring" | null;
	revalidateSubscription: () => Promise<void>;
	revalidating: boolean;
	entitlement: PurchasesEntitlementInfo | null;
} => {
	const { customerInfo, revalidateSubscription, revalidating } = useContext(SubscriptionContext);
	const activeEntitlements = customerInfo?.entitlements?.active;
	if (!activeEntitlements) {
		return {
			customerInfo,
			hasSubscription: false,
			subscriptionType: null,
			revalidateSubscription,
			revalidating,
			entitlement: null,
		};
	}
	if (activeEntitlements["Pro - Lifetime"]) {
		return {
			customerInfo,
			hasSubscription: true,
			subscriptionType: "lifetime",
			revalidateSubscription,
			revalidating,
			entitlement: activeEntitlements["Pro - Lifetime"],
		};
	}
	if (activeEntitlements["Pro - Recurring"]) {
		const entitlement = activeEntitlements["Pro - Recurring"];
		const expiresAt = new Date(entitlement.expirationDateMillis as number).toISOString();
		const now = new Date().toISOString();
		const isExpired = expiresAt < now;
		if (isExpired) {
			return {
				customerInfo,
				hasSubscription: false,
				subscriptionType: null,
				revalidateSubscription,
				revalidating,
				entitlement: null,
			};
		}
		return {
			customerInfo,
			hasSubscription: true,
			subscriptionType: "recurring",
			revalidateSubscription,
			revalidating,
			entitlement,
		};
	}
	return {
		customerInfo,
		hasSubscription: false,
		subscriptionType: null,
		revalidateSubscription,
		revalidating,
		entitlement: null,
	};
};
