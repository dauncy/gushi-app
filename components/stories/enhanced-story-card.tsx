import { StoryPreview } from "@/convex/stories/schema";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Modal, TouchableWithoutFeedback, View } from "react-native";
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
import { StoryCard } from "./story-card";
import { StoryContextMenu } from "./story-context-menu";

interface LongPressModalProps {
	visible: boolean;
	story: StoryPreview | null;
	onClose: () => void;
}

const LongPressModal: React.FC<LongPressModalProps> = ({ visible, story, onClose }) => {
	const onCloseCallbacks = useRef<Map<string, () => void>>(new Map());

	const addCloseCallback = useCallback((name: string, callback: () => void) => {
		onCloseCallbacks.current.set(name, callback);
	}, []);

	const [mounted, setMounted] = useState(visible); // controls <Modal> mount
	const [contentShown, setContentShown] = useState(false); // controls <Animated.View> mount

	useEffect(() => {
		if (visible) {
			setMounted(true); // mount the <Modal>
			// delay 1 tick so children mount after modal is visible and can "enter"
			requestAnimationFrame(() => setContentShown(true));
		} else if (mounted) {
			// parent requested hide; start exit by unmounting content (Modal stays)
			setContentShown(false);
		}
	}, [visible, mounted]);

	const finishClose = useCallback(() => {
		// notify any children
		setTimeout(() => {
			onCloseCallbacks.current.forEach((cb) => cb());
			onCloseCallbacks.current.clear();
		}, 150);

		setMounted(false); // finally unmount the <Modal>
		onClose(); // tell parent we're done
	}, [onClose]);

	const requestClose = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		// do NOT call onClose() here. Start exit by removing the content.
		setContentShown(false);
	}, []);

	if (!story || !mounted) return null;

	return (
		<Modal animationType="none" transparent visible={mounted} statusBarTranslucent onRequestClose={requestClose}>
			<View className="flex-1 relative">
				<BlurView intensity={30} tint="light" className="absolute inset-0" />

				<TouchableWithoutFeedback onPress={requestClose}>
					{/* Always exactly ONE child for TouchableWithoutFeedback */}
					<View style={{ flex: 1 }}>
						{contentShown ? (
							<Animated.View
								key="sheet"
								entering={SlideInDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0)).duration(300)}
								exiting={SlideOutDown.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0))
									.duration(300)
									.withCallback((finished) => {
										if (finished) runOnJS(finishClose)();
									})}
								className="flex-1 items-center justify-center gap-y-2"
							>
								<View
									collapsable={false}
									style={{
										width: "51%",
										alignSelf: "stretch",
										marginHorizontal: "auto",
										shadowColor: "#000",
										shadowOffset: { width: 0.5, height: 0.85 },
										shadowOpacity: 0.5,
										shadowRadius: 8,
									}}
								>
									<View className="rounded-xl absolute inset-0 bg-background" />
									<StoryCard story={story} hasPlayButton={false} />
								</View>

								<View
									className="w-full max-w-[66%]"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0.5, height: 0.85 },
										shadowOpacity: 0.5,
										shadowRadius: 8,
									}}
									collapsable={false}
								>
									<StoryContextMenu story={story} addCloseCallback={addCloseCallback} triggerClose={requestClose} />
								</View>
							</Animated.View>
						) : null}
					</View>
				</TouchableWithoutFeedback>
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
					<StoryCard story={story} hasPlayButton={true} />
				</Animated.View>
			</GestureDetector>

			<LongPressModal
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
