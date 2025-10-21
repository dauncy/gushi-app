import { Stack } from "expo-router";

export default function PlaylistsLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="create"
				options={{
					headerShown: false,
					presentation: "modal",
					sheetGrabberVisible: true,
					animation: "slide_from_bottom",
					animationDuration: 300,
					contentStyle: {
						height: "100%",
					},
				}}
			/>
			<Stack.Screen name="[playlistId]" options={{ headerShown: false }} />
		</Stack>
	);
}
