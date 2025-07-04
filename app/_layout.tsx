import { AudioProvider } from "@/context/AudioContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { NAV_THEME } from "@/lib/constants";
import { convex, queryClient } from "@/lib/convex.client";
import { Subscription } from "@/lib/types";
import { useColorScheme } from "@/lib/useColorScheme";
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import "../global.css";

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
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

const fetchSubscription = async () => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	const subscription = null;
	return subscription;
};

export default function RootLayout() {
	const { isDarkColorScheme } = useColorScheme();
	const hasMounted = useRef(false);
	const [appReady, setAppReady] = useState(false);
	const [subscription, setSubscription] = useState<Subscription | null>(null);

	useLayoutEffect(() => {
		async function prepare() {
			if (hasMounted.current) {
				return;
			}
			hasMounted.current = true;
			try {
				console.log("prepare => ");
				await Font.loadAsync({
					SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
				});
				const subscription = await fetchSubscription();
				console.log("subscription => ", subscription);
				setSubscription(subscription);
			} catch (e) {
				console.warn(e);
			} finally {
				setAppReady(true);
			}
		}
		prepare();
	}, []);

	const onLayoutRootView = useCallback(() => {
		console.log("onLayoutRootView => ", appReady);
		if (appReady) {
			// This tells the splash screen to hide immediately! If we call this after
			// `setAppIsReady`, then we may see a blank screen while the app is
			// loading its initial state and rendering its first pixels. So instead,
			// we hide the splash screen once we know the root view has already
			// performed layout.
			SplashScreen.hide();
		}
	}, [appReady]);

	if (!appReady) {
		return null;
	}

	return (
		<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
			<SubscriptionProvider subscription={subscription}>
				<ConvexProvider client={convex}>
					<QueryClientProvider client={queryClient}>
						<AudioProvider>
							<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
							<Stack
								layout={({ children }) => (
									<View onLayout={onLayoutRootView} className="flex-1">
										{children}
									</View>
								)}
							>
								<Stack.Screen name="index" options={{ headerShown: false }} />
								<Stack.Screen
									name="upgrade"
									options={{
										contentStyle: { height: "100%" },
										fullScreenGestureEnabled: true,
										sheetGrabberVisible: true,
										sheetCornerRadius: 48,
										headerShown: false,
										headerLargeTitleShadowVisible: true,
										presentation: "formSheet",
										animation: "slide_from_bottom",
										animationDuration: 300,
										animationTypeForReplace: "push",
									}}
								/>
								<Stack.Screen
									name="(protected)"
									options={{ headerShown: false, contentStyle: { backgroundColor: "#0a0a0a" } }}
								/>

								<Stack.Screen name="+not-found" />
							</Stack>
						</AudioProvider>
					</QueryClientProvider>
				</ConvexProvider>
			</SubscriptionProvider>
		</ThemeProvider>
	);
}
