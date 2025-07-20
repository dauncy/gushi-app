import { Doc } from "@/convex/_generated/dataModel";
import { JWTPayload } from "@/convex/auth/types";
import { getConvexSiteURL } from "@/lib/utils";
import { AuthTokenFetcher, ConvexProviderWithAuth } from "convex/react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSubscription } from "./SubscriptionContext";

type IConvexReactClient = {
	setAuth(fetchToken: AuthTokenFetcher): void;
	clearAuth(): void;
};

const AuthContext = createContext<{
	jwtClaims: JWTPayload | null;
	loading: boolean;
	dbUser: Doc<"users"> | null;
	setDbUser: (user: Doc<"users"> | null) => void;
	setJwtClaims: (claims: JWTPayload | null) => void;
}>({
	jwtClaims: null,
	loading: false,
	dbUser: null,
	setDbUser: () => {},
	setJwtClaims: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [loading, setLoading] = useState(true);
	const [jwtClaims, setJwtClaims] = useState<JWTPayload | null>(null);
	const [dbUser, setDbUser] = useState<Doc<"users"> | null>(null);
	const { customerInfo } = useSubscription();

	const customerId = useMemo(() => {
		return customerInfo?.originalAppUserId;
	}, [customerInfo]);

	useEffect(() => {
		const handleLogin = async () => {
			setLoading(true);
			try {
				const url = `${getConvexSiteURL()}/auth/login`;
				if (!customerId) {
					return null;
				}
				const res = await fetch(url, {
					method: "POST",
					body: JSON.stringify({
						revenuecat_user_id: customerId,
					}),
				});
				if (!res.ok) {
					return null;
				}
				const data = await res.json();
				setJwtClaims(data.claims);
				setDbUser(data.dbUser);
				return null;
			} catch (error) {
				console.error(error);
				return null;
			} finally {
				setLoading(false);
			}
		};

		handleLogin();
	}, [customerId, setJwtClaims, setLoading]);

	return (
		<AuthContext.Provider
			value={{
				jwtClaims,
				loading,
				dbUser,
				setDbUser,
				setJwtClaims,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const { jwtClaims, loading, dbUser, setDbUser, setJwtClaims } = useContext(AuthContext);
	return {
		jwtClaims,
		loading,
		dbUser,
		setDbUser,
		setJwtClaims,
	};
};

export const ConvexProviderWithCustomAuth = ({
	children,
	client,
}: {
	children: ReactNode;
	client: IConvexReactClient;
}) => {
	return (
		<ConvexProviderWithAuth client={client} useAuth={useCustomAuth}>
			{children}
		</ConvexProviderWithAuth>
	);
};

const useCustomAuth = () => {
	// Only use state here, not actions - prevents unnecessary re-renders
	const { loading, dbUser } = useAuth();
	const { customerInfo } = useSubscription();
	const customerId = useMemo(() => {
		return customerInfo?.originalAppUserId;
	}, [customerInfo]);

	const fetchAccessToken = useCallback(
		async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
			const url = `${getConvexSiteURL()}/auth/refresh`;
			if (!customerId || !dbUser) {
				return null;
			}

			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					revenuecat_user_id: customerId,
					force_refresh: forceRefreshToken,
				}),
			});
			if (!res.ok) {
				return null;
			}
			const data = await res.json();
			return data.token;
		},
		[customerId, dbUser],
	);

	return useMemo(() => {
		return {
			isLoading: loading,
			isAuthenticated: !!dbUser,
			fetchAccessToken,
		};
	}, [loading, dbUser, fetchAccessToken]);
};
