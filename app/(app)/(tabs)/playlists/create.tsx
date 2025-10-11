import { FormHeader } from "@/components/nav/form-header";
import { Camera } from "@/components/ui/icons/camera-icon";
import { X } from "@/components/ui/icons/x-icon";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { toastConfig } from "@/components/ui/toast";
import { useCustomAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { usePreventFormDismiss } from "@/hooks/use-prevent-form-dismiss";
import { cn, getConvexSiteURL } from "@/lib/utils";
import { useConvexMutation } from "@convex-dev/react-query";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, View } from "react-native";
import Toast from "react-native-toast-message";

const ALERT_TITLE = "Discard Changes";
const ALERT_MESSAGE = "Are you sure you want to cancel this playlist?";

export default function CreatePlaylistPage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const createPlaylist = useConvexMutation(api.playlists.mutations.createPlaylist);
	const router = useRouter();
	const { fetchAccessToken } = useCustomAuth();
	const [title, setTitle] = useState("");
	const [image, setImage] = useState<
		(ImagePicker.ImagePickerAsset & { storageId: Id<"_storage">; fileId: Id<"files"> }) | null
	>(null);
	const [uploading, setUploading] = useState(false);
	const isDirty = useMemo(() => {
		return title.trim().length > 0 || image !== null;
	}, [title, image]);

	const submitDisabled = useMemo(() => {
		return title.trim().length <= 2 || uploading;
	}, [title, uploading]);

	const backDisabled = useMemo(() => {
		return uploading;
	}, [uploading]);

	const handleImageUploadError = useCallback(
		async ({
			text1 = "Error uploading image",
			text2 = "We hit a snag trying to uploade this image. Please try again later",
		}: {
			text1?: string;
			text2?: string;
		}) => {
			setUploading(false);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Toast.show({ type: "error", text1, text2 });
		},
		[setUploading],
	);

	const pickImage = useCallback(async () => {
		try {
			setUploading(true);
			const token = await fetchAccessToken({ forceRefreshToken: false });
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				allowsMultipleSelection: false,
				quality: 0.75,
				aspect: [1, 1],
			});
			const imageToUse = (result.assets ?? []).shift();
			if (!imageToUse) {
				setUploading(false);
				return;
			}
			const contentType = imageToUse.mimeType ?? "";
			const imageRes = await fetch(imageToUse.uri);
			const imageBlob = await imageRes.blob();
			if (imageBlob.size > 1024 * 1024 * 5) {
				await handleImageUploadError({
					text1: "Image is too large.",
					text2: "This image excceeds the filesize limit of 5MB. Please try again with a smaller image.",
				});
				return;
			}
			const res = await fetch(`${getConvexSiteURL()}/files`, {
				method: "POST",
				headers: {
					"Content-Type": contentType,
					Authorization: `Bearer ${token}`,
				},
				body: imageBlob,
			});
			if (!res.ok || res.status !== 200) {
				await handleImageUploadError({
					text1: "Error uploading image",
					text2: "We hit a snag trying to uploade this image. Please try again later",
				});
				return;
			}
			const { storageId, imageUrl, fileId } = await res.json();
			if (!storageId || !imageUrl || !fileId) {
				await handleImageUploadError({
					text1: "Error uploading image",
					text2: "We hit a snag trying to uploade this image. Please try again later",
				});
				return;
			}
			setImage({ ...imageToUse, uri: imageUrl, storageId, fileId });
			setUploading(false);
		} catch (e) {
			console.warn("[@/app/(app)/(tabs)/playlists/create.tsx]: Error picking image: ", e);
			await handleImageUploadError({
				text1: "Error uploading image",
				text2: "We hit a snag trying to uploade this image. Please try again later",
			});
		} finally {
			setUploading(false);
		}
	}, [fetchAccessToken, setImage, setUploading, handleImageUploadError]);

	const handleSubmit = useCallback(async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		if (title.trim().length <= 2) {
			Toast.show({ type: "error", text1: "Invalid title", text2: "Please enter a title for your playlist" });
			setIsSubmitting(false);
			return;
		}
		const { data, error } = await createPlaylist({
			title,
			imageId: image?.fileId,
		});

		if (error) {
			Toast.show({ type: "error", text1: "Something went wrong", text2: error });
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			setIsSubmitting(false);
			return;
		}

		if (!data) {
			Toast.show({
				type: "error",
				text1: "Something went wrong",
				text2: "We hit a snag trying to create your playlist. Please try again later",
			});
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			setIsSubmitting(false);
			return;
		}

		Toast.show({ type: "success", text1: "Playlist created", text2: "Your playlist has been created" });
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.dismissTo("/playlists");
		setIsSubmitting(false);
	}, [isSubmitting, title, createPlaylist, image?.fileId, router]);

	usePreventFormDismiss({ isDirty, alertTitle: ALERT_TITLE, alertMessage: ALERT_MESSAGE });

	return (
		<>
			<KeyboardAvoidingView behavior={"padding"} keyboardVerticalOffset={0} className="flex-1 bg-background">
				<ScrollView
					className="flex-1 bg-background "
					bounces={false}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
				>
					<FormHeader
						isDirty={isDirty}
						submitDisabled={submitDisabled}
						backDisabled={backDisabled}
						dismissTo="/playlists"
						formTitle="Create a Playlist"
						alertTitle={ALERT_TITLE}
						alertMessage={ALERT_MESSAGE}
						onSubmit={handleSubmit}
					/>
					<View className="flex-1 flex flex-col items-center  p-8 gap-y-8 w-full">
						<View
							className={cn(
								"size-48 rounded-md bg-foreground/10 items-center justify-center relative",
								isSubmitting && "opacity-50",
							)}
						>
							{image ? (
								<>
									<Image
										source={{ uri: image.uri }}
										className="size-full rounded-md"
										cachePolicy="memory-disk"
										contentFit="cover"
									/>

									<Pressable
										onPress={() => setImage(null)}
										style={{
											shadowColor: "#000000",
											shadowOffset: { width: 4, height: 2 },
											shadowOpacity: 0.4,
											shadowRadius: 8,
										}}
										className="absolute -top-4 -right-4 size-[34px] rounded-full bg-[#a1a1aa] items-center justify-center border border-background/80"
									>
										<X className="size-[24px] text-background/80" />
									</Pressable>
								</>
							) : uploading ? (
								<ActivityIndicator size={24} color="#ff78e5" />
							) : (
								<Pressable
									onPress={pickImage}
									className="flex size-[54px] rounded-full bg-primary/80 items-center justify-center"
									style={{
										shadowColor: "#000000",
										shadowOffset: { width: 4, height: 2 },
										shadowOpacity: 0.4,
										shadowRadius: 8,
									}}
								>
									<Camera className="size-[24px] text-white" />
								</Pressable>
							)}
						</View>
						<Input
							value={title}
							onChangeText={setTitle}
							autoFocus
							placeholder="Playlist title"
							className={cn("w-full flex", isSubmitting && "opacity-50")}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
			<Toast config={toastConfig} position={"top"} topOffset={48} />
		</>
	);
}
