import * as Haptics from "expo-haptics";
import { Href, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export const FormHeader = ({
	isDirty,
	submitDisabled,
	backDisabled,
	dismissTo,
	onSubmit,
	formTitle,
	alertTitle = "Discard Changes",
	submitText = "Submit",
	alertMessage = "Are you sure you want to cancel this form?",
}: {
	isDirty: boolean;
	submitDisabled: boolean;
	backDisabled: boolean;
	dismissTo: Href;
	formTitle: string;
	alertTitle?: string;
	alertMessage?: string;
	submitText?: string;
	onSubmit: () => Promise<void>;
}) => {
	const clickRef = useRef(false);
	const router = useRouter();
	const handleBack = useCallback(async () => {
		if (clickRef.current) return;
		if (backDisabled) return;
		clickRef.current = true;
		if (!isDirty) {
			if (router.canGoBack()) {
				router.back();
			} else {
				router.dismissTo(dismissTo);
			}
			return;
		}
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		Alert.alert(alertTitle, alertMessage, [
			{
				text: alertTitle,
				style: "destructive",
				onPress: async () => {
					await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					if (router.canGoBack()) {
						router.back();
					} else {
						router.dismissTo("/playlists");
					}
					setTimeout(() => {
						clickRef.current = false;
					}, 500);
				},
			},
			{
				text: "Cancel",
				style: "cancel",
				onPress: () => {
					clickRef.current = false;
				},
			},
		]);
	}, [backDisabled, isDirty, alertTitle, alertMessage, router, dismissTo]);

	const handleSubmit = useCallback(() => {
		if (clickRef.current) return;
		clickRef.current = true;
		onSubmit();
		setTimeout(() => {
			clickRef.current = false;
		}, 500);
	}, [onSubmit]);

	return (
		<View className="w-full px-4 p-4 items-center flex flex-row gap-x-4">
			<TouchableOpacity
				disabled={backDisabled}
				className="mb-4 disabled:opacity-50"
				activeOpacity={0.8}
				onPress={handleBack}
			>
				<Text className="text-destructive/80 font-medium text-lg" maxFontSizeMultiplier={1.2}>
					{"Cancel"}
				</Text>
			</TouchableOpacity>
			<View className="flex-1 items-center justify-center">
				<Text
					style={{ fontFamily: "Baloo", lineHeight: 32, fontSize: 24 }}
					className="text-foreground font-normal text-2xl"
					maxFontSizeMultiplier={1.2}
				>
					{formTitle}
				</Text>
			</View>
			<TouchableOpacity onPress={handleSubmit} className="mb-4 disabled:opacity-50" disabled={submitDisabled}>
				<Text className="text-border font-semibold text-lg" maxFontSizeMultiplier={1.2}>
					{submitText}
				</Text>
			</TouchableOpacity>
		</View>
	);
};
