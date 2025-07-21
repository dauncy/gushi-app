import { createContext, ReactNode, useContext } from "react";
import { CustomerInfo } from "react-native-purchases";

interface SubscriptionContextType {
	customerInfo: CustomerInfo | null;
}

export const SubscriptionContext = createContext<SubscriptionContextType>({
	customerInfo: null,
});

export const SubscriptionProvider = ({
	children,
	customerInfo,
}: {
	children: ReactNode;
	customerInfo: CustomerInfo | null;
}) => {
	return <SubscriptionContext.Provider value={{ customerInfo }}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
	const { customerInfo } = useContext(SubscriptionContext);
	const activeEntitlements = customerInfo?.entitlements?.active;
	if (!activeEntitlements) {
		return { customerInfo, hasSubscription: false, subscriptionType: null };
	}
	if (activeEntitlements["Pro - Lifetime"]) {
		return { customerInfo, hasSubscription: true, subscriptionType: "lifetime" };
	}
	if (activeEntitlements["Pro - Recurring"]) {
		return { customerInfo, hasSubscription: true, subscriptionType: "recurring" };
	}
	return { customerInfo, hasSubscription: false, subscriptionType: null };
};
