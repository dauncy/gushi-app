import { AudioProvider } from "@/context/AudioContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
	const { isDarkColorScheme } = useColorScheme();

	return (
		<AudioProvider>
			<StatusBar style={isDarkColorScheme ? "light" : "dark"} />

			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: {
						backgroundColor: "#0f172a",
					},
				}}
				layout={({ children }) => (
					<View className="flex-1">
						<RenderLayout>{children}</RenderLayout>
					</View>
				)}
			>
				<Stack.Screen
					name="upgrade"
					options={{
						headerShown: false,
						presentation: "formSheet",
						sheetCornerRadius: 48,
						gestureEnabled: true,
						animation: "slide_from_bottom",
						animationDuration: 300,
						sheetGrabberVisible: true,
						contentStyle: {
							backgroundColor: "#0f172a",
							height: "100%",
						},
					}}
				/>

				<Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: "#0f172a" } }} />

				<Stack.Screen name="+not-found" options={{ headerShown: false }} />
			</Stack>
		</AudioProvider>
	);
}

const RenderLayout = ({ children }: { children: ReactNode }) => {
	const { isAuthenticated, isLoading } = useConvexAuth();
	if (isLoading && !isAuthenticated) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-900">
				<ActivityIndicator size="large" color="#c026d3" />
			</View>
		);
	}
	return children;
};
