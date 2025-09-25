import { Clock } from "@/components/ui/icons/clock-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { StoryPreview } from "@/convex/stories/schema";
import { sanitizeStorageUrl, secondsToMinuteString } from "@/lib/utils";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Carrot } from "../ui/icons/carrot-icon";
import { Circle } from "../ui/icons/circle-icon";
import { Fullscreen } from "../ui/icons/full-screen-icon";
import { Share } from "../ui/icons/share-icon";
import { Star } from "../ui/icons/star-icon";
import { Separator } from "../ui/separator";
import { CategoryToColor, CategoryToIcon } from "./category-utils";
import { StoryCard } from "./story-card";
import { StoryImagePreview } from "./story-image";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LongPressModalProps {
	visible: boolean;
	story: StoryPreview | null;
	onClose: () => void;
}

const LongPressModal: React.FC<LongPressModalProps> = ({ visible, story, onClose }) => {
	const [shouldRender, setShouldRender] = useState(visible);

	useEffect(() => {
		if (visible) {
			setShouldRender(true);
		} else if (shouldRender) {
			// Unmount after animation completes
			setTimeout(() => {
				setShouldRender(false);
			}, 600); // Match your longest exit animation duration
		}
	}, [visible, shouldRender, setShouldRender]);

	const requestClose = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		onClose();
	}, [onClose]);

	if (!story) {
		return null;
	}

	return (
		<Modal
			animationType="none"
			transparent={true}
			visible={shouldRender}
			onRequestClose={requestClose}
			statusBarTranslucent
		>
			<View className="flex-1 flex relative">
				<BlurView intensity={30} tint="light" className="absolute inset-0" />
				<View className="flex-1 z-20">
					{visible && (
						<TouchableWithoutFeedback onPress={requestClose}>
							<View className="flex-1 flex flex-col items-center justify-center gap-y-4">
								<Animated.View
									entering={SlideInDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0)).duration(150)}
									exiting={SlideOutDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0))
										.duration(150)
										.delay(150)}
									className="w-full max-w-[51%] h-[282px] rounded-xl bg-background"
									style={{
										shadowColor: "#000000",
										shadowOffset: {
											width: 0.5,
											height: 0.85,
										},
										shadowOpacity: 0.5,
										shadowRadius: 8,
									}}
								>
									<StoryCard story={story} onCardPress={onClose} />
								</Animated.View>
								<Animated.View
									entering={SlideInDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0))
										.duration(150)
										.delay(150)}
									exiting={SlideOutDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0)).duration(150)}
									className="w-full max-w-[66%]"
									style={{
										shadowColor: "#000000",
										shadowOffset: {
											width: 0.5,
											height: 0.85,
										},
										shadowOpacity: 0.5,
										shadowRadius: 8,
									}}
								>
									<View className="bg-background w-full rounded-xl border-2 border-border">
										<View className="p-2 w-full flex flex-col gap-y-0.5">
											<View className="flex flex-row items-center gap-x-2">
												<Carrot className="size-4 text-foreground" size={16} />
												<Text className="text-foreground text-sm font-medium">Story seed</Text>
											</View>
											<Text className="text-foreground/60 text-sm font-normal pl-6">{story.description}</Text>
										</View>
										<Separator className="h-[2px]" />
										<View className="p-3 px-4 w-full flex flex-row items-center gap-x-2">
											<Share className="size-4 text-foreground" size={16} />
											<Text className="text-foreground text-sm font-medium">Share story</Text>
										</View>
										<Separator className="h-[2px]" />
										<View className="p-3 px-4 w-full flex flex-row items-center gap-x-2">
											<Star className="size-4 text-foreground" size={16} />
											<Text className="text-foreground text-sm font-medium">Add to favorites</Text>
										</View>
										<Separator className="h-[2px]" />
										<View className="p-3 px-4 w-ful flex-row items-center gap-x-2">
											<Fullscreen className="size-4 text-foreground" size={16} />
											<Text className="text-foreground text-sm font-medium">Fullscreen</Text>
										</View>
									</View>
								</Animated.View>
							</View>
						</TouchableWithoutFeedback>
					)}
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
			handleLongPress();
		})
		.onBegin(() => {
			"worklet";
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
						<View className="w-full flex flex-row gap-x-2 p-2  items-start">
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
						<View
							className="flex items-center gap-x-2 flex-row flex-wrap w-full pb-4 p-2"
							style={{ flexWrap: "wrap", flexDirection: "row" }}
						>
							{story.categories.map((category) => {
								const color = CategoryToColor[category.name.toLowerCase() as keyof typeof CategoryToColor] ?? {
									background: "#0395ff",
									foreground: "#fffbf3",
								};
								const Icon = CategoryToIcon[category.name.toLowerCase() as keyof typeof CategoryToIcon] ?? Circle;
								return (
									<View
										key={category._id}
										className="flex flex-row items-center gap-x-1 py-0.5 px-1 rounded-md"
										style={{ backgroundColor: color.background, borderColor: color.foreground, borderWidth: 1 }}
									>
										<Icon color={color.foreground} size={16} />
										<Text key={category._id} className="text-sm font-medium" style={{ color: color.foreground }}>
											{category.name}
										</Text>
									</View>
								);
							})}
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
