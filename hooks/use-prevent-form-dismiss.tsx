import { usePreventRemove } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
import { Alert } from "react-native";

export const usePreventFormDismiss = ({
	isDirty,
	alertTitle = "Discard Changes",
	alertMessage = "Are you sure you want to cancel this form?",
}: {
	isDirty: boolean;
	alertTitle?: string;
	alertMessage?: string;
}) => {
	const navigation = useNavigation();

	usePreventRemove(true, async (data) => {
		if (data.data.action.type === "POP_TO") {
			navigation.dispatch(data.data.action);
			return;
		}
		if (data.data.action.type === "GO_BACK") {
			navigation.dispatch(data.data.action);
			return;
		}
		if (!isDirty) {
			navigation.dispatch(data.data.action);
			return;
		}
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		Alert.alert(alertTitle, alertMessage, [
			{
				text: alertTitle,
				style: "destructive",
				onPress: async () => {
					await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					navigation.dispatch(data.data.action);
				},
			},
			{
				text: "Cancel",
				style: "cancel",
			},
		]);
	});
};
