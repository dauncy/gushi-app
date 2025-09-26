import { useAudio } from "@/context/AudioContext";
import { Stack } from "expo-router";

export default function StoriesLayout() {
	const { ended, stop } = useAudio();
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: {
					height: "100%",
				},
			}}
		>
			<Stack.Screen
				name="[storyId]"
				listeners={{
					beforeRemove: async (e) => {
						if (ended) {
							await stop();
						}
					},
				}}
			/>
		</Stack>
	);
}
