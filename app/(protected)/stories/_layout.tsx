import { Stack } from "expo-router";

export default function ThreadsLayout() {
	return (
		<Stack
			screenOptions={{
				contentStyle: {
					backgroundColor: "#0a0a0a",
					height: "100%",
				},
			}}
		>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="[storyId]"
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
		</Stack>
	);
}
