import { Subscription } from "@/lib/types";
import { createContext, ReactNode, useContext } from "react";

interface SubscriptionContextType {
	subscription: Subscription | null;
}

export const SubscriptionContext = createContext<SubscriptionContextType>({
	subscription: null,
});

export const SubscriptionProvider = ({
	children,
	subscription,
}: {
	children: ReactNode;
	subscription: Subscription | null;
}) => {
	return <SubscriptionContext.Provider value={{ subscription }}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
	const { subscription } = useContext(SubscriptionContext);
	return { subscription };
};
