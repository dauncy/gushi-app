import { toastConfig } from "@/components/ui/toast";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { CustomerInfo } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import Toast from "react-native-toast-message";

export default function UpgradePage() {
	const [isLoading, setIsLoading] = useState(false);
	const { customerInfo, hasSubscription, revalidateSubscription, revalidating } = useSubscription();
	const router = useRouter();
	const [completed, setCompleted] = useState(false);

	const updateCustomer = useAction(api.subscriptions.mutations.bustSubscriptionCache);
	const handleToast = useCallback(() => {
		Toast.show({
			type: "proUpgrade",
			text1: "Congrats! You've upgraded to Gushi Pro 🌙",
		});
	}, []);

	const handleDismiss = useCallback(() => {
		router.back();
	}, [router]);

	const handlePurchaseCompleted = useCallback(async () => {
		setIsLoading(true);
		try {
			await updateCustomer({ revenueCatId: customerInfo?.originalAppUserId ?? "" });
			handleToast();
			setCompleted(true);
		} catch (error) {
			console.error("Error updating customer: ", error);
		} finally {
			setIsLoading(false);
		}
	}, [handleToast, updateCustomer, customerInfo, setCompleted]);

	const handleRestorePurchase = useCallback(
		async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
			setIsLoading(true);
			await updateCustomer({ revenueCatId: customerInfo.originalAppUserId });
			const activeEntitlements = customerInfo?.entitlements?.active;
			if (activeEntitlements["Pro - Lifetime"] || activeEntitlements["Pro - Recurring"]) {
				handleToast();
				setCompleted(true);
			}
			setIsLoading(false);
		},
		[handleToast, updateCustomer],
	);

	const handleComplete = useCallback(async () => {
		await revalidateSubscription();
		router.dismissTo("/(app)/(tabs)");
	}, [router, revalidateSubscription]);

	const renderContent = useMemo(() => {
		if (isLoading) {
			return (
				<View className="flex-1 items-center flex-col justify-center">
					<ActivityIndicator size="large" color="#ff78e5" />
				</View>
			);
		}
		if (!hasSubscription && !completed) {
			return (
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
			);
		}
		return (
			<View className="flex-1 items-center flex-col justify-center">
				<Text className="text-2xl font-bold text-foreground">Welcome to Gushi Premium</Text>
				<Text className="text-lg text-foreground/80 mt-1 text-center w-3/4">
					{"Enjoy access to our entire library of stories and premium features."}
				</Text>
				<Pressable
					disabled={revalidating}
					className="bg-secondary rounded-xl py-2 px-4 mt-4 border-2 border-border disabled:opacity-50"
					onPress={handleComplete}
				>
					{revalidating ? (
						<ActivityIndicator size="small" color="#0395ff" />
					) : (
						<Text className="text-lg text-border font-bold">{"Continue"}</Text>
					)}
				</Pressable>
			</View>
		);
	}, [
		isLoading,
		hasSubscription,
		completed,
		revalidating,
		handleComplete,
		handlePurchaseCompleted,
		handleRestorePurchase,
		handleDismiss,
	]);

	return (
		<>
			{renderContent}
			<Toast config={toastConfig} position={"top"} topOffset={48} />
		</>
	);
}
