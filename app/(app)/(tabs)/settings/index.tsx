import { Ban } from "@/components/ui/icons/ban-icon";
import { Bug } from "@/components/ui/icons/bug-icon";
import { Feather } from "@/components/ui/icons/feather-icon";
import { Lightbulb } from "@/components/ui/icons/lightbulb-icon";
import { LockKeyholeOpen } from "@/components/ui/icons/lock-keyhole-open-icon";
import { Shield } from "@/components/ui/icons/shield-icons";
import { Trash2 } from "@/components/ui/icons/trash-icon";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { usePresentPaywall } from "@/hooks/use-present-paywall";
import { useMutation } from "convex/react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function SettingsListPage() {
	const clickRef = useRef(false);
	const { subscriptionType, hasSubscription } = useSubscription();
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
				style: "destructive",
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

	const { presentPaywall } = usePresentPaywall();

	const handleUpgradeToPro = () => {
		if (clickRef.current) return;
		clickRef.current = true;
		presentPaywall();
		setTimeout(() => {
			clickRef.current = false;
		}, 500);
	};

	return (
		<View style={{ flex: 1 }} className="relative bg-[#fffbf3] flex flex-col px-0 pt-4">
			<View className="flex-1 bg-black/10 px-2 gap-y-8" style={{ marginTop: 46, paddingTop: 12, paddingBottom: 12 }}>
				<View className="flex flex-col gap-1 ">
					<Text className="text-foreground text-sm font-semibold ml-2">{"FEEDBACK"}</Text>
					<View className="bg-background rounded-2xl flex flex-col border border-border">
						<TouchableOpacity
							activeOpacity={0.8}
							className="px-4 border-b border-border py-4 flex flex-row items-center gap-4"
							onPress={() => handleFeedback("feature")}
						>
							<Lightbulb className="w-4 h-4 text-primary" strokeWidth={2.5} />
							<Text className="text-primary text-base font-semibold">{"SUGGEST A FEATURE"}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							activeOpacity={0.8}
							className="px-4 py-4 flex flex-row items-center gap-4"
							onPress={() => handleFeedback("issue")}
						>
							<Bug className="w-4 h-4 text-primary" strokeWidth={2.5} />
							<Text className="text-primary text-base font-semibold">{"REPORT AN ISSUE"}</Text>
						</TouchableOpacity>
					</View>
				</View>
				<View className="flex flex-col gap-1">
					<Text className="text-foreground text-sm font-semibold ml-2">{"LEGAL"}</Text>
					<View className="bg-background border border-primary rounded-2xl flex flex-col">
						<TouchableOpacity
							activeOpacity={0.8}
							className="px-4 border-b border-primary py-4 flex flex-row items-center gap-4"
							onPress={() => handleWebClick(`${process.env.EXPO_PUBLIC_WEB_URL}/terms-of-service`)}
						>
							<Feather className="w-4 h-4 text-border" strokeWidth={2.5} />
							<Text className="text-border text-base font-semibold">{"TERMS OF SERVICE"}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							activeOpacity={0.8}
							className="px-4 py-4 flex flex-row items-center gap-4"
							onPress={() => handleWebClick(`${process.env.EXPO_PUBLIC_WEB_URL}/privacy`)}
						>
							<Shield className="w-4 h-4 text-border" strokeWidth={2.5} />
							<Text className="text-border text-base font-semibold">{"PRIVACY POLICY"}</Text>
						</TouchableOpacity>
					</View>
				</View>
				<View className="flex flex-col gap-y-8 mt-auto mb-4">
					{subscriptionType === "recurring" ? (
						<View className="flex flex-col gap-1 ">
							<Text className="text-foreground text-sm font-semibold ml-2">{"SUBSCRIPTION"}</Text>
							<View className="bg-background border border-destructive rounded-2xl flex flex-col">
								<TouchableOpacity
									activeOpacity={0.8}
									className="px-4 py-4 flex flex-row items-center gap-4"
									onPress={handleCancelSubscription}
								>
									<Ban className="w-4 h-4 text-destructive" strokeWidth={1.5} />
									<Text className="text-destructive text-base font-medium">{"CANCEL SUBSCRIPTION"}</Text>
								</TouchableOpacity>
							</View>
						</View>
					) : hasSubscription === false ? (
						<View className="flex flex-col gap-1 ">
							<Text className="text-foreground text-sm font-semibold ml-2">{"SUBSCRIPTION"}</Text>
							<View className="bg-secondary border border-border rounded-2xl flex flex-col shadow">
								<TouchableOpacity
									activeOpacity={0.8}
									className="px-4 py-4 flex flex-row items-center gap-4"
									onPress={handleUpgradeToPro}
								>
									<LockKeyholeOpen className="w-4 h-4 text-border" strokeWidth={2.5} />
									<Text className="text-border text-base font-bold">{"UPGRADE TO PRO"}</Text>
								</TouchableOpacity>
							</View>
						</View>
					) : null}

					<View className="flex flex-col gap-1">
						<Text className="text-foreground text-sm font-semibold ml-2">{"PERSONAL DATA"}</Text>
						<View className="bg-background border border-destructive rounded-2xl flex flex-col">
							<TouchableOpacity
								activeOpacity={0.8}
								className="px-4 py-4 flex flex-row items-center gap-4"
								onPress={handleResetAppData}
							>
								<Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} />
								<Text className="text-destructive text-base font-medium">{"RESET APP DATA"}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
}
