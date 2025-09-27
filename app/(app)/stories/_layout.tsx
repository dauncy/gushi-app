import { audioStore, useAudio } from "@/context/AudioContext";
import { useStore } from "@tanstack/react-store";
import { Stack } from "expo-router";

export default function StoriesLayout() {
	const { stop } = useAudio();
	const ended = useStore(audioStore, (state) => state.audioState.ended);
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
