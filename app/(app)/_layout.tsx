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
				layout={({ children }) => (
					<View className="flex-1">
						<RenderLayout>{children}</RenderLayout>
					</View>
				)}
			>
				<Stack.Screen name="index" options={{ headerShown: false }} />
				<Stack.Screen
					name="(protected)"
					options={{ headerShown: false, contentStyle: { backgroundColor: "#0f172a" } }}
				/>
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
				<Stack.Screen name="+not-found" options={{ headerShown: false }} />
			</Stack>
		</AudioProvider>
	);
}

const RenderLayout = ({ children }: { children: ReactNode }) => {
	const { isAuthenticated, isLoading } = useConvexAuth();
	console.log("RenderLayout: props => ", { isAuthenticated, isLoading });
	if (isLoading && !isAuthenticated) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-900">
				<ActivityIndicator size="large" color="#c026d3" />
			</View>
		);
	}
	return children;
};
