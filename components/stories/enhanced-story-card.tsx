import { Info } from "@/components/ui/icons/info-icon";
import { StoryPreview } from "@/convex/stories/schema";
import { useIsIpad } from "@/hooks/use-is-ipad";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { StoryCard } from "./story-card";
import { StoryModal } from "./story-modal";

const EnhancedStoryCardComp = ({
	story,
	onCardPress,
	margin,
}: {
	story: StoryPreview;
	onCardPress: () => void;
	margin: "right" | "left";
}) => {
	const isIpad = useIsIpad();
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
				<Animated.View
					className="grow relative"
					style={[
						animatedStyle,
						{
							marginRight: margin === "right" ? (isIpad ? 12 : 4) : 0,
							marginBottom: isIpad ? 12 : 8,
							marginLeft: margin === "left" ? 4 : 0,
						},
					]}
				>
					<GestureDetector
						gesture={Gesture.Tap().onStart(() => {
							scale.value = withSequence(
								withTiming(0.95, { duration: 100 }),
								withSpring(0.95, { damping: 10, stiffness: 200 }),
								withSpring(0.95, { damping: 15, stiffness: 150 }),
							);
							handleLongPress();
						})}
					>
						<View
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							className="absolute top-2 right-0 size-[34px] z-50"
							style={{
								shadowColor: "#000000",
								shadowOffset: { width: 0.75, height: 1.75 },
								shadowOpacity: 0.6,
								shadowRadius: 8,
							}}
						>
							<Info className="text-border fill-background/80" size={28} />
						</View>
					</GestureDetector>
					<StoryCard story={story} hasPlayButton={true} />
				</Animated.View>
			</GestureDetector>

			<StoryModal
				visible={showModal}
				story={story}
				onClose={() => {
					// This now fires AFTER the exit animation has finished.
					setShowModal(false);

					// if you still want to bounce the card back after the modal closes:
					setTimeout(() => {
						scale.value = withSpring(1, { damping: 12, stiffness: 180 });
					}, 50);
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
