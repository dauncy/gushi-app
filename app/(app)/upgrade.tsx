import { toastConfig } from "@/components/ui/toast";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { CustomerInfo } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import Toast from "react-native-toast-message";

export default function UpgradePage() {
	const { customerInfo, hasSubscription } = useSubscription();
	const router = useRouter();
	const updateCustomer = useAction(api.subscriptions.mutations.bustSubscriptionCache);
	const handleToast = useCallback(() => {
		Toast.show({
			type: "proUpgrade",
			text1: "Congrats! You've upgraded to TuckedIn Pro 🌙",
		});
	}, []);

	useEffect(() => {
		console.log("[UpgradePage.tsx]: Customer: ", { customerID: customerInfo?.originalAppUserId });
	}, [customerInfo]);

	const handleDismiss = useCallback(() => {
		router.back();
	}, [router]);

	const handlePurchaseCompleted = useCallback(async () => {
		console.log("[UpgradePage.tsx]: Purchase completed");
		console.log("[UpgradePage.tsx]: Customer: ", { customerID: customerInfo?.originalAppUserId });
		await updateCustomer({ revenueCatId: customerInfo?.originalAppUserId ?? "" });
		handleToast();
	}, [handleToast, updateCustomer, customerInfo]);

	const handleRestorePurchase = useCallback(
		async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
			console.log("[UpgradePage.tsx]: Restore purchase: ", { customerID: customerInfo.originalAppUserId });
			await updateCustomer({ revenueCatId: customerInfo.originalAppUserId });
			handleToast();
		},
		[handleToast, updateCustomer],
	);

	return (
		<>
			{!hasSubscription ? (
				<RevenueCatUI.Paywall
					onPurchaseCompleted={handlePurchaseCompleted}
					onPurchaseError={({ error }) => {
						console.log("purchase error: ", error);
					}}
					onRestoreCompleted={handleRestorePurchase}
					onPurchaseStarted={({ packageBeingPurchased }) => {
						console.log("purchase started: ", packageBeingPurchased);
					}}
					onDismiss={handleDismiss}
				/>
			) : (
				<View className="flex-1 items-center flex-col justify-center">
					<Text className="text-2xl font-bold text-slate-200">Welcome to TuckedIn Pro 🌙</Text>
					<Text className="text-lg text-slate-400 mt-3">{"Enjoy access to every story."}</Text>
					<Pressable
						className="bg-slate-800 rounded-xl py-2 px-4 mt-4 border border-slate-700"
						onPress={() => router.replace("/(app)/(protected)/stories")}
					>
						<Text className="text-lg text-slate-400 font-bold">{"Continue"}</Text>
					</Pressable>
				</View>
			)}
			<Toast config={toastConfig} position={"top"} topOffset={48} />
		</>
	);
}
