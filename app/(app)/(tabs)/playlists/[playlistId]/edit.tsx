import { FormHeader } from "@/components/nav/form-header";
import { PlaylistForm } from "@/components/playlists/playlist-form";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { useConvexMutation } from "@convex-dev/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";

const ALERT_TITLE = "Discard Changes";
const ALERT_MESSAGE = "Your current changes will be lost.";

export default function EditPlaylist() {
	const params = useLocalSearchParams();
	const playlistId = params.playlistId as Id<"playlists">;
	const updatePlaylist = useConvexMutation(api.playlists.mutations.updatePlaylist);
	const router = useRouter();

	const { isLoading, data: playlist } = useConvexQuery(api.playlists.queries.getPlaylist, { playlistId });

	const handleSubmit = useCallback(
		async ({ title, imageId }: { title: string; imageId?: Id<"files"> }) => {
			const { data, error } = await updatePlaylist({ playlistId, title, imageId });
			if (error) {
				Toast.show({ type: "error", text1: "Failed to update playlist", text2: error });
				return;
			}

			if (!data) {
				Toast.show({
					type: "error",
					text1: "Failed to update playlist",
					text2: "Something wen wrong processing your request. Please try again later",
				});
				return;
			}

			Toast.show({ type: "success", text1: "Playlist updated", text2: "Your playlist has been updated" });
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.dismissTo(`/playlists/${playlistId}`);
		},
		[playlistId, router, updatePlaylist],
	);

	const playlistData = useMemo(() => {
		if (!playlist) {
			return undefined;
		}
		const data: { title: string; image?: { url: string; fileId: Id<"files"> } } = {
			title: playlist.name,
			image: undefined,
		};

		if (playlist.imageId && playlist.image) {
			data.image = {
				url: playlist.image,
				fileId: playlist.imageId,
			};
		}
		return data;
	}, [playlist]);

	if (isLoading) {
		return (
			<View className="flex-1 flex-col bg-background">
				<FormHeader
					isDirty={false}
					submitDisabled={true}
					backDisabled={true}
					dismissTo={`/playlists/${playlistId}`}
					formTitle={"Edit Playlist"}
					alertTitle={ALERT_TITLE}
					alertMessage={ALERT_MESSAGE}
					onSubmit={async () => {}}
					submitText={"Update"}
				/>
				<View className="flex-1 flex flex-col items-center  p-8 gap-y-8 w-full">
					<Skeleton className={"size-48 rounded-md bg-foreground/10 items-center justify-center relative"} />

					<Skeleton className="h-11 w-full rounded-md bg-foreground/10" />
				</View>
			</View>
		);
	}

	if (!playlist) {
		return null;
	}

	return (
		<PlaylistForm
			onSubmit={handleSubmit}
			formTitle="Edit Playlist"
			alertTitle={ALERT_TITLE}
			alertMessage={ALERT_MESSAGE}
			submitText="Update"
			dismissTo={`/playlists/${playlistId}`}
			playlistData={playlistData}
		/>
	);
}
