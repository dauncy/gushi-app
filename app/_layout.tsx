import { AudioProvider } from "@/context/AudioContext";
import { NAV_THEME } from "@/lib/constants";
import { convex, queryClient } from "@/lib/convex.client";
import { useColorScheme } from "@/lib/useColorScheme";
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useLayoutEffect, useRef, useState } from "react";
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

export default function RootLayout() {
	const { isDarkColorScheme } = useColorScheme();
	const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);
	const hasMounted = useRef(false);
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useLayoutEffect(() => {
		if (hasMounted.current) {
			return;
		}
		setIsColorSchemeLoaded(true);
		hasMounted.current = true;
	}, []);

	if (!loaded || !isColorSchemeLoaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
			<ConvexProvider client={convex}>
				<QueryClientProvider client={queryClient}>
					<AudioProvider>
						<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
						<Stack>
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
								name="stories"
								options={{
									fullScreenGestureEnabled: true,
									sheetGrabberVisible: true,
									sheetCornerRadius: 48,
									headerLargeTitleShadowVisible: true,
									presentation: "formSheet",
									headerShown: false,

									contentStyle: {
										backgroundColor: "#0f172a",
										height: "100%",
									},
									gestureEnabled: true,
								}}
							/>
							<Stack.Screen name="+not-found" />
						</Stack>
					</AudioProvider>
				</QueryClientProvider>
			</ConvexProvider>
		</ThemeProvider>
	);
}
