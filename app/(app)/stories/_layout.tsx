import { audioStore, useAudio } from "@/context/AudioContext";
import { eventRegister, EVENTS } from "@/lib/events";
import { useStore } from "@tanstack/react-store";
import { Href, Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function StoriesLayout() {
	const { stop } = useAudio();
	const router = useRouter();
	const ended = useStore(audioStore, (state) => state.audioState.ended);
	const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
	const params = useGlobalSearchParams();

	useEffect(() => {
		const handleCreatePlaylistPress = () => {
			setShowCreatePlaylist(true);
		};
		eventRegister.on(EVENTS.CREATE_PLAYLIST_PRESS, handleCreatePlaylistPress);
		return () => {
			eventRegister.off(EVENTS.CREATE_PLAYLIST_PRESS, handleCreatePlaylistPress);
		};
	}, []);
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
			<Stack.Screen
				name="add-to-playlist"
				listeners={{
					beforeRemove: () => {
						if (showCreatePlaylist) {
							let href = "/playlists/create";
							if (params.storyId) {
								href += `?storyId=${params.storyId}`;
							}
							setTimeout(() => {
								router.push(href as Href);
							}, 500);
						}
					},
				}}
			/>
		</Stack>
	);
}
