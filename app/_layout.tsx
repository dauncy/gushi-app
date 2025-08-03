import { toastConfig } from "@/components/ui/toast";
import { AuthProvider, ConvexProviderWithCustomAuth } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { NAV_THEME } from "@/lib/constants";
import { convex, queryClient } from "@/lib/convex.client";
import { DarkTheme, Theme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Font from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases, { CustomerInfo } from "react-native-purchases";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import "../global.css";

const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
	duration: 1000,
	fade: true,
});

const initRevenueCat = async (onUpdate: (customerInfo: CustomerInfo) => void) => {
	const appleKey = process.env.EXPO_PUBLIC_REVENUE_PUBLIC_KEY;
	if (!appleKey) {
		throw new Error("EXPO_PUBLIC_REVENUE_PUBLIC_KEY is not set");
	}
	Purchases.configure({ apiKey: appleKey });
	const customerInfo = await new Promise<CustomerInfo>((resolve, reject) => {
		Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
			console.log("[RootLayout.tsx]: Update -> Customer: ", { customerID: customerInfo.originalAppUserId });
			// onUpdate(customerInfo);
			resolve(customerInfo);
		});
	});
	console.log("[RootLayout.tsx]: Init -> Customer: ", { customerID: customerInfo.originalAppUserId });
	return customerInfo;
};

export default function RootLayout() {
	const hasMounted = useRef(false);
	const initialCustomerRef = useRef(false);
	const [appReady, setAppReady] = useState(false);
	const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

	useLayoutEffect(() => {
		async function prepare() {
			if (hasMounted.current) {
				return;
			}
			hasMounted.current = true;
			try {
				await Font.loadAsync({
					SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
				});
				const customerInfo = await initRevenueCat((updates) => {});
				setCustomerInfo(customerInfo);
				if (!initialCustomerRef.current) {
					initialCustomerRef.current = true;
					setTimeout(() => {
						setAppReady(true);
					}, 500);
				}
			} catch (e) {
				console.warn(e);
			}
		}
		prepare();
	}, []);

	const onLayoutRootView = useCallback(() => {
		if (appReady) {
			SplashScreen.hide();
		}
	}, [appReady]);

	if (!appReady) {
		return null;
	}

	return (
		<ThemeProvider value={DARK_THEME}>
			<SubscriptionProvider customerInfo={customerInfo}>
				<AuthProvider>
					<ConvexProviderWithCustomAuth client={convex}>
						<QueryClientProvider client={queryClient}>
							<GestureHandlerRootView onLayout={onLayoutRootView} style={{ flex: 1, backgroundColor: "#0f172a" }}>
								<Slot />
								<Toast config={toastConfig} position={"top"} topOffset={48} />
							</GestureHandlerRootView>
						</QueryClientProvider>
					</ConvexProviderWithCustomAuth>
				</AuthProvider>
			</SubscriptionProvider>
		</ThemeProvider>
	);
}
