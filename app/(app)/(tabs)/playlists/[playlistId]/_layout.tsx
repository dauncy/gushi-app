import { Stack } from "expo-router";

export default function PlaylistLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="add-stories"
				options={{
					headerShown: false,
					presentation: "modal",
					sheetCornerRadius: 48,
					sheetGrabberVisible: true,
					animation: "slide_from_bottom",
					animationDuration: 300,
					contentStyle: {
						height: "100%",
					},
				}}
			/>
			<Stack.Screen
				name="edit"
				options={{
					headerShown: false,
					presentation: "modal",
					sheetCornerRadius: 48,
					sheetGrabberVisible: true,
					animation: "slide_from_bottom",
					animationDuration: 300,
					contentStyle: {
						height: "100%",
					},
				}}
			/>
		</Stack>
	);
}
