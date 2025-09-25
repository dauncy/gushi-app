import { Button } from "@/components/ui/button";
import { Clock } from "@/components/ui/icons/clock-icon";
import { LockKeyhole } from "@/components/ui/icons/lock-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { StoryPreview } from "@/convex/stories/schema";
import { sanitizeStorageUrl, secondsToMinuteString } from "@/lib/utils";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { Stop } from "../ui/icons/stop-icon";
import { StoryImagePreview } from "./story-image";

export const StoryCardLoading = () => {
	const [cardDimensions, setCardDimensions] = useState<{ width: number; height: number }>({ width: 168, height: 140 });
	return (
		<View
			style={{
				width: "50%", // Takes exactly half the container
				paddingHorizontal: 6, // Padding instead of margin for consistent spacing
				paddingBottom: 12,
			}}
		>
			<View
				onLayout={(e) => {
					setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.width });
				}}
				className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff] relative"
			>
				<View className="w-full rounded-t-xl" style={{ height: cardDimensions.width }}>
					<Skeleton className="size-full rounded-t-xl bg-black/20" />
				</View>
				<View className="p-2 flex flex-col gap-y-3 pb-4">
					<View className="flex flex-col gap-y-1">
						<Skeleton className="w-3/5 h-4 rounded-xl bg-black/20" />
						<Skeleton className="w-1/3 h-4 rounded-xl bg-black/20" />
					</View>
					<View className="flex flex-row items-center gap-x-2">
						<Skeleton className="size-4 rounded-full bg-black/20" />
						<Skeleton className="w-1/3 h-4 rounded-xl bg-black/20" />
					</View>
				</View>
			</View>
		</View>
	);
};

export const StoryCard = ({
	story,
	onCardPress,
	margin,
}: {
	story: StoryPreview;
	onCardPress: () => void;
	margin?: "right" | "left";
}) => {
	const [cardDimensions, setCardDimensions] = useState<{ width: number; height: number }>({ width: 168, height: 140 });
	const pressableRef = useRef<boolean>(true);
	const { hasSubscription } = useSubscription();
	const router = useRouter();
	const { play, setStory, isPlaying, storyId, stop } = useAudio();

	const presentPaywall = useCallback(() => {
		if (pressableRef.current) {
			pressableRef.current = false;
			router.push("/upgrade");
			setTimeout(() => {
				pressableRef.current = true;
			}, 300);
		}
	}, [router, pressableRef]);

	const isCurrentStory = useMemo(() => {
		return storyId === story._id;
	}, [storyId, story._id]);

	const locked = useMemo(() => {
		if (!story.audioUrl) {
			return true;
		}
		if (!story.subscription_required) {
			return false;
		}
		return !hasSubscription;
	}, [hasSubscription, story.subscription_required, story.audioUrl]);

	if (locked) {
		return (
			<TouchableOpacity
				activeOpacity={1}
				onPress={presentPaywall}
				style={{
					marginRight: margin === "right" ? 6 : 0,
					marginBottom: 12,
					marginLeft: margin === "left" ? 6 : 0,
				}}
			>
				<View
					onLayout={(e) => {
						setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.width });
					}}
					className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff] w-full h-full relative"
				>
					<View className="w-full rounded-t-xl w-full relative" style={{ height: cardDimensions.width }}>
						{story.featured && (
							<View
								className="absolute top-2 right-2 bg-[#fffbf3] z-20 w-24 rounded-md p-1 border border-[#ff2d01]"
								style={{
									shadowColor: "#f8fafc",
									shadowOffset: {
										width: 0.5,
										height: 1.5,
									},
									shadowOpacity: 0.25,
									shadowRadius: 4,
								}}
							>
								<Text className="text-[#ff2d01] text-center text-xs font-bold">FEATURED</Text>
							</View>
						)}
						<StoryImagePreview imageUrl={story.imageUrl} blurHash={story.blurHash ?? undefined} size={"featured"} />
					</View>
					<View className="p-2 flex flex-col gap-y-1 pb-4">
						<Text className="text-[#0D3311] text-lg font-medium" style={{ fontSize: 16, lineHeight: 20 }}>
							{story.title}
						</Text>
						<View className="flex flex-row items-center gap-x-2">
							<Clock className="size-4 text-[#0D3311]/50" size={16} />
							<Text className="text-[#0D3311]/50 text-sm font-medium">{secondsToMinuteString(story.duration)}</Text>
						</View>
					</View>

					<View
						className="absolute inset-0 rounded-xl bg-black opacity-40 overflow-hidden"
						style={{ zIndex: 1 }}
					></View>
					<View
						className="absolute inset-0 items-center justify-center rounded-xl overflow-hidden"
						style={{ zIndex: 3 }}
					>
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
			</TouchableOpacity>
		);
	}

	return (
		<Pressable
			onPress={() => {
				if (!pressableRef.current) {
					return;
				}
				pressableRef.current = false;
				onCardPress();
				setTimeout(() => {
					pressableRef.current = true;
				}, 300);
			}}
			style={{
				marginRight: margin === "right" ? 6 : 0,
				marginBottom: 12,
				marginLeft: margin === "left" ? 6 : 0,
			}}
		>
			<View
				className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff] h-full"
				onLayout={(e) => {
					setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.width });
				}}
			>
				<View className="w-full rounded-t-xl w-full relative" style={{ height: cardDimensions.width }}>
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
								shadowOffset: {
									width: 0.5,
									height: 1.5,
								},
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
						{isPlaying && isCurrentStory ? (
							<Button
								onPress={() => {
									stop();
								}}
								size="icon"
								className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full"
							>
								<Stop className="text-white fill-white" size={20} />
							</Button>
						) : isCurrentStory ? (
							<Button
								onPress={() => {
									play();
								}}
								size="icon"
								className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full"
							>
								<Play className="text-white fill-white" size={20} />
							</Button>
						) : (
							<Button
								size="icon"
								className="bg-[#ff78e5] active:bg-[#ff78e5]/80 border-white border rounded-full p-1"
								onPress={(e) => {
									e.stopPropagation();
									if (!story.audioUrl) {
										return;
									}
									if (!pressableRef.current) {
										return;
									}
									pressableRef.current = false;
									setStory({
										storyUrl: sanitizeStorageUrl(story.audioUrl),
										storyId: story._id,
										storyImage: sanitizeStorageUrl(story.imageUrl ?? ""),
										storyTitle: story.title,
										autoPlay: true,
									});
									setTimeout(() => {
										pressableRef.current = true;
									}, 300);
								}}
							>
								<Play className="text-white fill-white" size={20} />
							</Button>
						)}
					</View>
				</View>
			</View>
		</Pressable>
	);
};
