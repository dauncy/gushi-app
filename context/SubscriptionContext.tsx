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
	const hasSubscription = (customerInfo?.activeSubscriptions?.length ?? 0) > 0;
	return { customerInfo, hasSubscription };
};
