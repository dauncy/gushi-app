import { Clock } from "@/components/ui/icons/clock-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { StoryPreview } from "@/convex/stories/schema";
import { sanitizeStorageUrl, secondsToMinuteString } from "@/lib/utils";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, Text, TouchableWithoutFeedback, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	FadeIn,
	runOnJS,
	SlideInDown,
	SlideOutDown,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { StoryCard } from "./story-card";
import { StoryImagePreview } from "./story-image";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LongPressModalProps {
	visible: boolean;
	story: StoryPreview | null;
	onClose: () => void;
}

const LongPressModal: React.FC<LongPressModalProps> = ({ visible, story, onClose }) => {
	if (!story) return null;

	return (
		<Modal animationType="none" transparent={true} visible={visible} onRequestClose={onClose} statusBarTranslucent>
			<View className="flex-1 flex relative">
				<BlurView intensity={30} tint="light" className="absolute inset-0" />
				<View className="flex-1 z-20">
					{/* Animated Backdrop */}
					<TouchableWithoutFeedback onPress={onClose}>
						<View className="flex-1 flex flex-col items-center justify-center gap-y-1">
							<Animated.View
								entering={SlideInDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0)).duration(300)}
								exiting={SlideOutDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0))
									.duration(300)
									.delay(300)}
								className="w-full max-w-[51%] h-[300px]"
								style={{ paddingLeft: 6, paddingRight: 6 }}
							>
								<StoryCard story={story} onCardPress={onClose} />
							</Animated.View>
							<Animated.View
								entering={SlideInDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0))
									.duration(300)
									.delay(300)}
								exiting={SlideOutDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0)).duration(300)}
								className="w-full max-w-[51%]"
								style={{ paddingLeft: 6, paddingRight: 6 }}
							>
								<View className="bg-background w-ful h-24 rounded-xl border border-border"></View>
							</Animated.View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</View>
		</Modal>
	);
};

// Enhanced StoryCard with Long Press using Reanimated
export const EnhancedStoryCard = ({
	story,
	onCardPress,
	margin,
}: {
	story: StoryPreview;
	onCardPress: () => void;
	margin: "right" | "left";
}) => {
	const [showModal, setShowModal] = useState(false);
	const [cardDimensions, setCardDimensions] = useState<{
		width: number;
		height: number;
	}>({ width: 0, height: 0 });

	const scale = useSharedValue(1);
	const rotation = useSharedValue(0);

	const { hasSubscription } = useSubscription();
	const { play, setStory, isPlaying, storyId, stop } = useAudio();

	const handleLongPress = useCallback(() => {
		"worklet";
		runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
		runOnJS(setShowModal)(true);
	}, []);

	const longPressGesture = Gesture.LongPress()
		.minDuration(500)
		.onStart(() => {
			"worklet";
			// Initial press animation

			console.log("onStart");
			handleLongPress();
		})
		.onBegin(() => {
			"worklet";
			console.log("onBegin");
			scale.value = withSequence(
				withTiming(0.95, { duration: 100 }),
				withSpring(0.95, { damping: 10, stiffness: 200 }),
				withSpring(0.95, { damping: 15, stiffness: 150 }),
			);
		});
	const tapGesture = Gesture.Tap()
		.onStart(() => {
			"worklet";
			scale.value = withTiming(0.97, { duration: 100 });
		})
		.onEnd(() => {
			"worklet";
			scale.value = withSpring(1, { damping: 10, stiffness: 200 });
			runOnJS(onCardPress)();
		});

	const composedGesture = Gesture.Simultaneous(tapGesture, longPressGesture);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
	}));

	const handlePlay = useCallback(() => {
		if (story.audioUrl) {
			setStory({
				storyUrl: sanitizeStorageUrl(story.audioUrl),
				storyId: story._id,
				storyImage: sanitizeStorageUrl(story.imageUrl ?? ""),
				storyTitle: story.title,
				autoPlay: true,
			});
		}
	}, [story, setStory]);

	const isCurrentStory = useMemo(() => {
		return storyId === story._id;
	}, [storyId, story._id]);

	const locked = useMemo(() => {
		if (!story.audioUrl) return true;
		if (!story.subscription_required) return false;
		return !hasSubscription;
	}, [hasSubscription, story.subscription_required, story.audioUrl]);

	if (locked) {
		// Return your existing locked card implementation
		return null; // Replace with your locked card component
	}

	return (
		<>
			<GestureDetector gesture={composedGesture}>
				<Animated.View
					style={[
						{
							marginRight: margin === "right" ? 6 : 0,
							marginBottom: 12,
							marginLeft: margin === "left" ? 6 : 0,
						},
						animatedStyle,
					]}
				>
					<View
						className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff] h-full"
						onLayout={(e) => {
							setCardDimensions({
								width: e.nativeEvent.layout.width,
								height: e.nativeEvent.layout.width,
							});
						}}
					>
						<View className="w-full rounded-t-xl relative" style={{ height: cardDimensions.width }}>
							<StoryImagePreview
								imageUrl={story.imageUrl}
								blurHash={story.blurHash ?? undefined}
								size={"featured"}
								active={isCurrentStory}
							/>
							{story.featured && (
								<View
									className="absolute top-2 right-2 bg-[#fffbf3] z-20 w-24 rounded-md p-1 border border-[#ff2d01]"
									style={{
										shadowColor: "#f8fafc",
										shadowOffset: { width: 0.5, height: 1.5 },
										shadowOpacity: 0.25,
										shadowRadius: 4,
									}}
								>
									<Text className="text-[#ff2d01] text-center text-xs font-bold">FEATURED</Text>
								</View>
							)}
						</View>
						<View className="w-full flex flex-row gap-x-2 p-2 pb-4 items-start">
							<View className="flex-1 flex flex-col gap-y-1">
								<Text className="text-[#0D3311] text-lg font-medium" style={{ fontSize: 16, lineHeight: 20 }}>
									{story.title}
								</Text>
								<View className="flex flex-row items-center gap-x-2">
									<Clock className="size-4 text-[#0D3311]/50" size={16} />
									<Text className="text-[#0D3311]/50 text-sm font-medium">{secondsToMinuteString(story.duration)}</Text>
								</View>
							</View>
							<View className="flex items-center justify-center mt-0.5">
								<AnimatedPressable
									onPress={(e) => {
										e.stopPropagation();
										if (isPlaying && isCurrentStory) {
											stop();
										} else if (isCurrentStory) {
											play();
										} else {
											handlePlay();
										}
									}}
									className={`${
										isCurrentStory ? "bg-transparent" : "bg-[#ff78e5] active:bg-[#ff78e5]/80"
									} border-white border rounded-full p-1`}
									entering={FadeIn}
								>
									<Play className="text-white fill-white" size={20} />
								</AnimatedPressable>
							</View>
						</View>
					</View>
				</Animated.View>
			</GestureDetector>

			<LongPressModal
				visible={showModal}
				story={story}
				onClose={() => {
					scale.value = withSequence(
						withTiming(1, { duration: 100 }),
						withSpring(1, { damping: 10, stiffness: 200 }),
						withSpring(1, { damping: 15, stiffness: 150 }),
					);
					setShowModal(false);
				}}
			/>
		</>
	);
};
