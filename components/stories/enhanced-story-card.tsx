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
	const [shouldRender, setShouldRender] = useState(visible);
	const onCloseCallbacks = useRef<Map<string, () => void>>(new Map());

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

	const addCloseCallback = useCallback((name: string, callback: () => void) => {
		onCloseCallbacks.current.set(name, callback);
	}, []);

	const requestClose = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		onClose();
		setTimeout(() => {
			onCloseCallbacks.current.forEach((callback) => callback());
			onCloseCallbacks.current = new Map();
		}, 150);
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
									<StoryCard story={story} hasPlayButton={false} />
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
									<StoryContextMenu story={story} addCloseCallback={addCloseCallback} triggerClose={requestClose} />
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
