import GushiThumbnail from "@/assets/images/thumbnail.png";
import { SecondaryHeader } from "@/components/nav/secondary-header";
import { ChevronRight } from "@/components/ui/icons/chevron-right-icon";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useIsIpad } from "@/hooks/use-is-ipad";
import { usePresentPaywall } from "@/hooks/use-present-paywall";
import { AUTOPLAY_KEY, BLUR_HASH } from "@/lib/constants";
import { getData, storeData } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import * as Linking from "expo-linking";
import { Href, router } from "expo-router";
import { debounce } from "lodash";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";

export default function SettingsListPage() {
	const clickRef = useRef(false);

	return (
		<View className="flex-1 relative bg-background">
			<SecondaryHeader title="Settings" />
			<View style={{ flex: 1 }} className="relative flex-col px-0 bg-background">
				<ScrollView
					contentContainerStyle={{
						alignItems: "stretch",
						flexGrow: 1,
					}}
					className="bg-foreground/10 gap-y-8 flex-1"
					showsVerticalScrollIndicator={false}
					alwaysBounceVertical={false}
				>
					{/* <AutoPlaySection /> */}
					<FeedbackRow
						title="Report an issue"
						description="Something not working the way it should? Let us know!"
						link={"/settings/feedback?type=issue"}
						clickRef={clickRef}
					/>
					<FeedbackRow
						title="Provide feedback"
						description="Shae your thoughts, give kudos, or request a feature!"
						link={"/settings/feedback?type=feature"}
						clickRef={clickRef}
					/>
					<LegalRow
						title="Privacy Policy"
						description="Read our privacy policy"
						link={`${process.env.EXPO_PUBLIC_WEB_URL}/privacy`}
						clickRef={clickRef}
					/>
					<LegalRow
						title="Terms of Service"
						description="Read our terms of service"
						link={`${process.env.EXPO_PUBLIC_WEB_URL}/terms`}
						clickRef={clickRef}
					/>
					<ResetAppDataRow clickRef={clickRef} />
					<SubscriptionRow clickRef={clickRef} />
				</ScrollView>
			</View>
		</View>
	);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AutoPlaySection = () => {
	const [autoPlay, setAutoPlay] = useState(false);
	useEffect(() => {
		const init = async () => {
			const value = await getData({ key: AUTOPLAY_KEY });
			setAutoPlay(value ?? false);
		};
		init();
	}, []);

	const debounceAutoplay = debounce(async (value: boolean) => {
		await storeData({ key: AUTOPLAY_KEY, value });
	}, 300);

	const toggleAutoPlay = useCallback(
		(value: boolean) => {
			setAutoPlay(value);
			debounceAutoplay(value);
		},
		[debounceAutoplay],
	);

	return (
		<Pressable className="w-full py-4 px-4 flex flex-row gap-x-4 items-center border-b border-foreground/20">
			<View className="flex-1 flex flex-col gap-y-0">
				<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
					Auto play
				</Text>
				<Text className="text-foreground w-3/4 text-sm" maxFontSizeMultiplier={1.2}>
					Automatically play the next story when the current one ends
				</Text>
			</View>
			<Switch value={autoPlay} onValueChange={toggleAutoPlay} trackColor={{ true: "#0395ff" }} />
		</Pressable>
	);
};

const LegalRow = ({
	title,
	description,
	link,
	clickRef,
}: {
	title: string;
	description: string;
	link: string;
	clickRef: RefObject<boolean>;
}) => {
	const handlePress = useCallback(() => {
		if (clickRef.current) return;
		clickRef.current = true;
		Linking.openURL(link);
		setTimeout(() => {
			clickRef.current = false;
		}, 500);
	}, [clickRef, link]);
	return (
		<Pressable
			onPress={handlePress}
			className="w-full py-4 px-4 flex flex-row gap-x-4 items-center border-b border-foreground/20 "
		>
			<View className="flex-1 flex flex-col gap-y-0">
				<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
					{title}
				</Text>
				<Text className="text-foreground w-3/4 text-sm" maxFontSizeMultiplier={1.2}>
					{description}
				</Text>
			</View>
			<Pressable
				onPress={handlePress}
				className="size-[34px] rounded-full active:bg-foreground/10 flex items-center justify-center"
			>
				<ChevronRight className="size-[24px] text-foreground" />
			</Pressable>
		</Pressable>
	);
};

const FeedbackRow = ({
	title,
	description,
	link,
	clickRef,
}: {
	title: string;
	description: string;
	link: Href;
	clickRef: RefObject<boolean>;
}) => {
	const handlePress = useCallback(() => {
		if (clickRef.current) return;
		clickRef.current = true;
		router.push(link);
		setTimeout(() => {
			clickRef.current = false;
		}, 500);
	}, [link, clickRef]);
	return (
		<Pressable
			onPress={handlePress}
			className="w-full py-4 px-4 flex flex-row gap-x-4 items-center border-b border-foreground/20 "
		>
			<View className="flex-1 flex flex-col gap-y-0">
				<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
					{title}
				</Text>
				<Text className="text-foreground w-3/4 text-sm" maxFontSizeMultiplier={1.2}>
					{description}
				</Text>
			</View>
			<Pressable
				onPress={handlePress}
				className="size-[34px] rounded-full active:bg-foreground/10 flex items-center justify-center"
			>
				<ChevronRight className="size-[24px] text-foreground" />
			</Pressable>
		</Pressable>
	);
};

const ResetAppDataRow = ({ clickRef }: { clickRef: RefObject<boolean> }) => {
	const resetUserAppData = useMutation(api.users.mutations.resetAppData);
	const handleResetAppData = useCallback(() => {
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
	}, [clickRef, resetUserAppData]);
	return (
		<Pressable
			onPress={handleResetAppData}
			className="w-full py-4 px-4 flex flex-row gap-x-4 items-center border-b border-foreground/20 "
		>
			<View className="flex-1 flex flex-col gap-y-0">
				<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
					Reset account
				</Text>
				<Text className="text-foreground w-3/4 text-sm" maxFontSizeMultiplier={1.2}>
					Reset your app data
				</Text>
			</View>
		</Pressable>
	);
};

const SubscriptionRow = ({ clickRef }: { clickRef: RefObject<boolean> }) => {
	const { subscriptionType, hasSubscription } = useSubscription();
	if (!hasSubscription || subscriptionType === null) {
		return <FreeUserSubscriptionRow />;
	}
	if (subscriptionType === "lifetime") {
		return <LifetimeUserSubscriptionRow />;
	}
	return <MonthlyUserSubscriptionRow clickRef={clickRef} />;
};

const FreeUserSubscriptionRow = () => {
	const isIpad = useIsIpad();
	const { presentPaywall } = usePresentPaywall();
	return (
		<Pressable
			onPress={presentPaywall}
			className={cn(
				"w-full py-4 px-4 flex flex-row gap-x-4 items-start border-b border-foreground/20 ",
				!isIpad && "flex-1 self-stretch grow ",
			)}
		>
			<View className="flex-1 flex flex-col gap-y-0">
				<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
					My Subscription
				</Text>
				<Text className="text-foreground text-sm w-3/4" maxFontSizeMultiplier={1.2}>
					{"Upgrade to Gushi Premium to get access to our entire library of stories."}
				</Text>
			</View>
			<Pressable
				onPress={presentPaywall}
				className="size-[34px] rounded-full active:bg-foreground/10 flex items-center justify-center"
			>
				<ChevronRight className="size-[24px] text-foreground" />
			</Pressable>
		</Pressable>
	);
};

const MonthlyUserSubscriptionRow = ({ clickRef }: { clickRef: RefObject<boolean> }) => {
	const isIpad = useIsIpad();
	const initRef = useRef(false);
	const [loading, setLoading] = useState(false);
	const [offering, setOffering] = useState<PurchasesPackage | null>(null);
	const { entitlement } = useSubscription();

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

	useEffect(() => {
		async function init() {
			if (initRef.current) {
				return;
			}
			if (!entitlement) {
				return;
			}
			initRef.current = true;
			setLoading(true);
			const offerings = await Purchases.getOfferings();
			const offering = offerings.current?.availablePackages.find(
				(pkg) => pkg.product.identifier === entitlement.productIdentifier,
			);
			if (!offering) {
				return;
			}
			setOffering(offering);
			setLoading(false);
		}
		init();
	}, [entitlement]);

	const content = useMemo(() => {
		if (loading) {
			return (
				<View className="flex flex-col gap-y-1.5 flex-1">
					<Skeleton className="h-4 w-32 bg-foreground/20" />
					<Skeleton className="h-3 w-16 bg-foreground/20" />
				</View>
			);
		}
		if (!offering) {
			return (
				<View className="flex flex-col gap-y-0 flex-1">
					<Text className="text-border font-semibold text-lg" maxFontSizeMultiplier={1.2}>
						Gushi Premium
					</Text>
				</View>
			);
		}
		return (
			<View className="flex flex-col gap-y-0 flex-1">
				<Text className="text-border font-semibold text-lg" maxFontSizeMultiplier={1.2}>
					{offering.product.title}
				</Text>
				<Text className="text-foreground text-sm" maxFontSizeMultiplier={1.2}>
					{offering.product.pricePerMonthString}/month
				</Text>
			</View>
		);
	}, [loading, offering]);

	return (
		<View
			className={cn(
				"w-full py-4 px-4 flex flex-col gap-y-4  border-b border-foreground/20 ",
				!isIpad && "flex-1 self-stretch grow ",
			)}
		>
			<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
				My Subscription
			</Text>
			<View className="flex flex-row gap-x-4 w-full items-start">
				<View className="size-[56px] rounded-lg bg-foreground/20">
					<Image
						placeholder={{ blurhash: BLUR_HASH }}
						transition={100}
						source={GushiThumbnail}
						className="size-[56px] rounded-lg"
						contentFit="contain"
						cachePolicy={"memory-disk"}
					/>
				</View>
				{content}

				{!loading && (
					<Pressable
						onPress={handleCancelSubscription}
						className="px-8 py-1 min-h-10 border border-destructive rounded-full active:bg-foreground/10 self-center items-center justify-center"
					>
						<Text className="text-destructive text-sm" maxFontSizeMultiplier={1.2}>
							{"Cancel"}
						</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
};

const LifetimeUserSubscriptionRow = () => {
	const isIpad = useIsIpad();
	return (
		<View
			className={cn(
				"w-full py-4 px-4 flex flex-col gap-y-4  border-b border-foreground/20 ",
				!isIpad && "flex-1 self-stretch grow ",
			)}
		>
			<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
				My Subscription
			</Text>
			<View className="flex flex-row gap-x-4 w-full items-start">
				<View className="size-[56px] rounded-lg bg-foreground/20">
					<Image
						placeholder={{ blurhash: BLUR_HASH }}
						transition={100}
						source={GushiThumbnail}
						className="size-[56px] rounded-lg"
						contentFit="contain"
						cachePolicy={"memory-disk"}
					/>
				</View>
				<View className="flex flex-col gap-y-1.5 flex-1">
					<Text className="text-border font-semibold text-lg" maxFontSizeMultiplier={1.2}>
						{"Gushi Premium"}
					</Text>
					<Text className="text-foreground text-sm" maxFontSizeMultiplier={1.2}>
						{"Lifetime member"}
					</Text>
				</View>
			</View>
		</View>
	);
};
