import { useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
			layout={({ children }) => (
				<View className="flex-1" style={{ backgroundColor: "#036aacc" }}>
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
						height: "100%",
					},
				}}
			/>

			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />

			<Stack.Screen
				name="stories"
				options={{
					headerShown: false,
					fullScreenGestureEnabled: true,
					sheetGrabberVisible: true,
					sheetCornerRadius: 48,
					headerLargeTitleShadowVisible: true,
					presentation: "formSheet",
					contentStyle: {
						height: "100%",
						width: "100%",
					},
					gestureEnabled: true,
				}}
			/>

			<Stack.Screen name="+not-found" options={{ headerShown: false }} />
		</Stack>
	);
}

const RenderLayout = ({ children }: { children: ReactNode }) => {
	const { isAuthenticated, isLoading } = useConvexAuth();
	if (isLoading && !isAuthenticated) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" color="#7AC0B4" />
			</View>
		);
	}
	return children;
};
