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
	const hasAccess = process.env.EXPO_PUBLIC_HAS_SUBSCRIPTION === "true";

	if (hasAccess) {
		return <>{children}</>;
	}

	if (redirect) {
		return <Redirect href={redirect} />;
	}

	return <>{fallback}</>;
};
