import { usePreventRemove } from "@react-navigation/native";
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

	usePreventRemove(true, (data) => {
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
		Alert.alert(alertTitle, alertMessage, [
			{
				text: alertTitle,
				style: "destructive",
				onPress: () => {
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
