import { PlaylistForm } from "@/components/playlists/playlist-form";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import Toast from "react-native-toast-message";

const ALERT_TITLE = "Discard Changes";
const ALERT_MESSAGE = "Are you sure you want to cancel this playlist?";

export default function CreatePlaylistPage() {
	const createPlaylist = useConvexMutation(api.playlists.mutations.createPlaylist);
	const router = useRouter();
	const handleSubmit = useCallback(
		async ({ title, imageId }: { title: string; imageId?: Id<"files"> }) => {
			const { data, error } = await createPlaylist({ title, imageId });
			if (error) {
				Toast.show({ type: "error", text1: "Failed to create playlist", text2: error });
				return;
			}

			if (!data) {
				Toast.show({
					type: "error",
					text1: "Failed to create playlist",
					text2: "Something wen wrong processing your request. Please try again later",
				});
				return;
			}
			Toast.show({ type: "success", text1: "Playlist created", text2: "Your playlist has been created" });
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.push(`/playlists/${data}`);
		},
		[createPlaylist, router],
	);

	return (
		<PlaylistForm
			onSubmit={handleSubmit}
			formTitle="Create a Playlist"
			alertTitle={ALERT_TITLE}
			alertMessage={ALERT_MESSAGE}
			submitText="Create"
			dismissTo="/playlists"
		/>
	);
}
