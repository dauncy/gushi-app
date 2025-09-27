import { useAudio } from "@/context/AudioContext";
import { StoryPreview } from "@/convex/stories/schema";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Modal, Text, TouchableWithoutFeedback, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
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
import { Fullscreen } from "../ui/icons/full-screen-icon";
import { Share } from "../ui/icons/share-icon";
import { Star } from "../ui/icons/star-icon";
import { Separator } from "../ui/separator";
import { StoryCard } from "./story-card";

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
									<StoryCard story={story} active={false} hasPlayButton={false} />
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

const EnhancedStoryCardComp = ({
	story,
	onCardPress,
	margin,
}: {
	story: StoryPreview;
	onCardPress: () => void;
	margin: "right" | "left";
}) => {
	useEffect(() => {
		console.log("EnhancedStoryCard: --- story ---  initialRender: ", story.title);
	});
	const [showModal, setShowModal] = useState(false);
	const scale = useSharedValue(1);
	const rotation = useSharedValue(0);
	const { storyId } = useAudio();
	const isActive = storyId === story._id;

	const handleLongPress = useCallback(() => {
		"worklet";
		runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
		runOnJS(setShowModal)(true);
	}, []);

	const longPressGesture = Gesture.LongPress()
		.minDuration(500)
		.onStart(() => {
			"worklet";
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
			console.log("TapGesture: --- onStart --- ");
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
		transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
	}));

	return (
		<>
			<GestureDetector gesture={composedGesture}>
				<Animated.View
					className="grow"
					style={[
						animatedStyle,
						{
							marginRight: margin === "right" ? 6 : 0,
							marginBottom: 12,
							marginLeft: margin === "left" ? 6 : 0,
						},
					]}
				>
					<StoryCard story={story} active={isActive} hasPlayButton={true} />
				</Animated.View>
			</GestureDetector>

			<LongPressModal
				visible={showModal}
				story={story}
				onClose={() => {
					setShowModal(false);
					setTimeout(() => {
						scale.value = withSequence(
							withTiming(1, { duration: 100 }),
							withSpring(1, { damping: 10, stiffness: 200 }),
							withSpring(1, { damping: 15, stiffness: 150 }),
						);
					}, 750);
				}}
			/>
		</>
	);
};

export const EnhancedStoryCard = memo(EnhancedStoryCardComp, (prevProps, nextProps) => {
	return (
		prevProps.story._id === nextProps.story._id &&
		prevProps.onCardPress === nextProps.onCardPress &&
		prevProps.margin === nextProps.margin
	);
});

EnhancedStoryCard.displayName = "EnhancedStoryCard";
