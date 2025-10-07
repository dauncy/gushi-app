import { useSubscription } from "@/context/SubscriptionContext";
import { StoryPreview } from "@/convex/stories";
import { secondsToMinuteString } from "@/lib/utils";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { Clock } from "../ui/icons/clock-icon";
import { LockKeyhole } from "../ui/icons/lock-icon";
import { StoryCardPlayButton } from "./story-card-play-button";
import { StoryImagePreview } from "./story-image";
import { StoryModal } from "./story-modal";

const LockedStorySearchCard = ({ story }: { story: StoryPreview }) => {
	return (
		<View className="w-full border-b border-border p-2 py-4 pb-6 flex-row gap-x-4 bg-background/60 relative">
			<StoryImagePreview size={"md"} imageUrl={story.imageUrl} blurHash={story.blurHash ?? undefined} />
			<View className="flex flex-col gap-y-2 flex-1 mt-1">
				<View className="flex-row flex flex-1 gap-x-4 items-center">
					<View className="flex flex-col gap-y-1 flex-1">
						<Text
							className="text-foreground font-semibold"
							numberOfLines={2}
							ellipsizeMode="tail"
							maxFontSizeMultiplier={1.2}
						>
							{story.title}
						</Text>
						<View className="flex flex-row gap-x-2 items-center mt-auto">
							<Clock className="size-4 text-foreground/80" size={14} />
							<Text className="text-foreground/80 text-sm" allowFontScaling={false}>
								{secondsToMinuteString(story.duration)}
							</Text>
						</View>
					</View>
					<View className="flex items-center justify-center size-10"></View>
				</View>
				<Text
					className="text-foreground/80 text-sm max-w-[424px]"
					numberOfLines={2}
					ellipsizeMode="tail"
					maxFontSizeMultiplier={1.2}
				>
					{story.description}
				</Text>
			</View>
			<View className="absolute inset-0 bg-black opacity-40 overflow-hidden" style={{ zIndex: 1 }} />
			<View className="absolute inset-0 items-center justify-center overflow-hidden" style={{ zIndex: 3 }}>
				<View
					style={{
						shadowColor: "#ffffff",
						shadowOffset: {
							width: 0.5,
							height: 1.5,
						},
						shadowOpacity: 0.5,
						shadowRadius: 14,
					}}
					className="flex flex-row items-center justify-center size-12 rounded-full bg-slate-800 p-1"
				>
					<LockKeyhole className="text-slate-200" size={24} />
				</View>
			</View>
			<BlurView
				intensity={8}
				tint="dark"
				className="absolute inset-0 rounded-xl bg-black overflow-hidden"
				style={{ zIndex: 2, borderRadius: 12 }}
			/>
		</View>
	);
};

const UnlockedStorySearchCard = ({ story }: { story: StoryPreview }) => {
	return (
		<View className="w-full border-b border-border p-2 py-4 pb-6  flex-row gap-x-4 bg-background/60">
			<StoryImagePreview size={"md"} imageUrl={story.imageUrl} blurHash={story.blurHash ?? undefined} />
			<View className="flex flex-col gap-y-2 flex-1 mt-1">
				<View className="flex-row flex flex-1 gap-x-4 items-center">
					<View className="flex flex-col gap-y-1 flex-1">
						<Text
							className="text-foreground font-semibold"
							numberOfLines={2}
							ellipsizeMode="tail"
							maxFontSizeMultiplier={1.2}
						>
							{story.title}
						</Text>
						<View className="flex flex-row gap-x-2 items-center mt-auto">
							<Clock className="size-4 text-foreground/80" size={14} />
							<Text className="text-foreground/80 text-sm" allowFontScaling={false}>
								{secondsToMinuteString(story.duration)}
							</Text>
						</View>
					</View>
					<View className="flex items-center justify-center">
						<StoryCardPlayButton story={story} />
					</View>
				</View>
				<Text
					className="text-foreground/80 text-sm max-w-[424px]"
					numberOfLines={2}
					ellipsizeMode="tail"
					maxFontSizeMultiplier={1.2}
				>
					{story.description}
				</Text>
			</View>
		</View>
	);
};

export const StorySearchCard = ({ story }: { story: StoryPreview }) => {
	const { hasSubscription } = useSubscription();

	if (story.subscription_required && !hasSubscription) {
		return <LockedStorySearchCard story={story} />;
	}

	return <UnlockedStorySearchCard story={story} />;
};

export const EnhancedStorySearchCard = ({ story, onCardPress }: { story: StoryPreview; onCardPress: () => void }) => {
	const [showModal, setShowModal] = useState(false);
	const scale = useSharedValue(1);

	const handleLongPress = useCallback(() => {
		"worklet";
		runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
		runOnJS(setShowModal)(true);
	}, []);

	const longPressGesture = Gesture.LongPress()
		.minDuration(500)
		.onStart(() => {
			"worklet";
			console.log("long press");
			scale.value = withSequence(
				withTiming(0.95, { duration: 100 }),
				withSpring(0.95, { damping: 10, stiffness: 200 }),
				withSpring(0.95, { damping: 15, stiffness: 150 }),
			);
			handleLongPress();
		});

	const tapGesture = Gesture.Tap()
		.onStart(() => {
			"worklet";
			scale.value = withSequence(
				withTiming(0.95, { duration: 100 }),
				withSpring(0.95, { damping: 10, stiffness: 200 }),
				withSpring(0.95, { damping: 15, stiffness: 150 }),
			);
		})
		.onEnd(() => {
			"worklet";
			scale.value = withSpring(1, { damping: 10, stiffness: 200 });
			runOnJS(onCardPress)();
		});

	const composedGesture = Gesture.Simultaneous(tapGesture, longPressGesture);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<>
			<GestureDetector gesture={composedGesture}>
				<Animated.View className="relative" style={[animatedStyle]}>
					<StorySearchCard story={story} />
				</Animated.View>
			</GestureDetector>

			<StoryModal
				visible={showModal}
				story={story}
				onClose={() => {
					setShowModal(false);
					setTimeout(() => {
						scale.value = withSpring(1, { damping: 12, stiffness: 180 });
					}, 50);
				}}
			/>
		</>
	);
};
