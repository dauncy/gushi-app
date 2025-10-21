import { NAV_THEME } from "@/lib/constants";
import { useConvexAuth } from "convex/react";
import { Stack, usePathname } from "expo-router";
import { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
	const pathname = usePathname();
	const onAddToPlaylist = pathname.includes("add-to-playlist");
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
					...(!onAddToPlaylist
						? {
								sheetCornerRadius: 36,
							}
						: {}),
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
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color={NAV_THEME.dark.primary} />
			</View>
		);
	}
	return children;
};
