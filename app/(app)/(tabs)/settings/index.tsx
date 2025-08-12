import { Ban } from "@/components/ui/icons/ban-icon";
import { Bug } from "@/components/ui/icons/bug-icon";
import { Feather } from "@/components/ui/icons/feather-icon";
import { Lightbulb } from "@/components/ui/icons/lightbulb-icon";
import { Shield } from "@/components/ui/icons/shield-icons";
import { Trash2 } from "@/components/ui/icons/trash-icon";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function SettingsListPage() {
	const clickRef = useRef(false);
	const { subscriptionType } = useSubscription();
	const router = useRouter();
	const resetUserAppData = useMutation(api.users.mutations.resetAppData);

	const handleCancelSubscription = () => {
		if (clickRef.current) return;
		clickRef.current = true;
		Alert.alert("Cancel Subscription", "Are you sure you want to cancel your subscription?", [
			{
				text: "Cancel Subscription",
				onPress: () => {
					Linking.openURL("https://apps.apple.com/account/subscriptions");
					setTimeout(() => {
						clickRef.current = false;
					}, 500);
				},
				style: "destructive",
			},
			{
				text: "Keep Subscription",
				style: "cancel",
				onPress: () => {
					clickRef.current = false;
				},
			},
		]);
	};

	const handleResetAppData = () => {
		if (clickRef.current) return;
		clickRef.current = true;
		Alert.alert("Reset App Data", "Are you sure you want to reset your app data? This action cannot be undone.", [
			{
				text: "Reset App Data",
				onPress: async () => {
					clickRef.current = false;
					await resetUserAppData({});
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
	};

	const handleWebClick = (url: string) => {
		if (clickRef.current) return;
		clickRef.current = true;
		Linking.openURL(url);
		setTimeout(() => {
			clickRef.current = false;
		}, 500);
	};

	const handleFeedback = (type: "feature" | "issue") => {
		if (clickRef.current) return;
		clickRef.current = true;
		router.push(`/settings/feedback?type=${type}`);
		setTimeout(() => {
			clickRef.current = false;
		}, 500);
	};

	return (
		<View className="flex-1 flex flex-col px-2 gap-y-12" style={{ marginTop: 56 }}>
			<View className="flex flex-col gap-1">
				<Text className="text-slate-500 text-sm font-semibold ml-2">{"FEEDBACK"}</Text>
				<View className="bg-slate-800/50 rounded-2xl flex flex-col">
					<TouchableOpacity
						activeOpacity={0.8}
						className="px-4 border-b border-slate-700 py-4 flex flex-row items-center gap-4"
						onPress={() => handleFeedback("feature")}
					>
						<Lightbulb className="w-4 h-4 text-slate-400" />
						<Text className="text-slate-400 text-base font-medium">{"Suggest a Feature"}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.8}
						className="px-4 py-4 flex flex-row items-center gap-4"
						onPress={() => handleFeedback("issue")}
					>
						<Bug className="w-4 h-4 text-slate-400" />
						<Text className="text-slate-400 text-base font-medium">{"Report an Issue"}</Text>
					</TouchableOpacity>
				</View>
			</View>
			<View className="flex flex-col gap-1">
				<Text className="text-slate-500 text-sm font-semibold ml-2">{"LEGAL"}</Text>
				<View className="bg-slate-800/50 rounded-2xl flex flex-col">
					<TouchableOpacity
						activeOpacity={0.8}
						className="px-4 border-b border-slate-700 py-4 flex flex-row items-center gap-4"
						onPress={() => handleWebClick(`${process.env.EXPO_PUBLIC_WEB_URL}/terms-of-service`)}
					>
						<Feather className="w-4 h-4 text-slate-400" />
						<Text className="text-slate-400 text-base font-medium">{"Terms of Service"}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.8}
						className="px-4 py-4 flex flex-row items-center gap-4"
						onPress={() => handleWebClick(`${process.env.EXPO_PUBLIC_WEB_URL}/privacy`)}
					>
						<Shield className="w-4 h-4 text-slate-400" />
						<Text className="text-slate-400 text-base font-medium">{"Privacy Policy"}</Text>
					</TouchableOpacity>
				</View>
			</View>
			<View className="flex flex-col gap-y-12 mt-auto mb-4">
				{subscriptionType === "recurring" && (
					<View className="flex flex-col gap-1 ">
						<Text className="text-slate-500 text-sm font-semibold ml-2">{"Subscription"}</Text>
						<View className="bg-slate-800/50 rounded-2xl flex flex-col">
							<TouchableOpacity
								activeOpacity={0.8}
								className="px-4 py-4 flex flex-row items-center gap-4"
								onPress={handleCancelSubscription}
							>
								<Ban className="w-4 h-4 text-red-500" />
								<Text className="text-red-500 text-base font-medium">{"Cancel Subscription"}</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				<View className="flex flex-col gap-1">
					<Text className="text-slate-500 text-sm font-semibold ml-2">{"Personal Data"}</Text>
					<View className="bg-slate-800/50 rounded-2xl flex flex-col">
						<TouchableOpacity
							activeOpacity={0.8}
							className="px-4 py-4 flex flex-row items-center gap-4"
							onPress={handleResetAppData}
						>
							<Trash2 className="w-4 h-4 text-red-500" />
							<Text className="text-red-500 text-base font-medium">{"Reset App Data"}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</View>
	);
}
