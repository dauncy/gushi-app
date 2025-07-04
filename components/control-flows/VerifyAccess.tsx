import { useSubscription } from "@/context/SubscriptionContext";
import { Redirect, Route } from "expo-router";
import { ReactNode } from "react";

export const VerifyAccess = ({
	children,
	fallback = null,
	redirect,
}: {
	children: ReactNode;
	fallback?: ReactNode;
	redirect?: Route;
}) => {
	const { hasSubscription } = useSubscription();

	if (hasSubscription) {
		return <>{children}</>;
	}

	if (redirect) {
		return <Redirect href={redirect} />;
	}

	return <>{fallback}</>;
};
