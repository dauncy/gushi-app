import { Stack } from "expo-router";

export default function SettingsLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="feedback"
				options={{
					headerShown: false,
					presentation: "modal",
					sheetCornerRadius: 48,
					sheetGrabberVisible: true,
					animation: "slide_from_bottom",
					animationDuration: 300,
					contentStyle: {
						height: "100%",
						backgroundColor: "#0f172a",
					},
				}}
			/>
		</Stack>
	);
}
