import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/icons/calendar-icon";
import { Headphones } from "@/components/ui/icons/headphones-icon";
import { LetterText } from "@/components/ui/icons/letters-text-icon";
import { Pause } from "@/components/ui/icons/pause-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Share } from "@/components/ui/icons/share-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { Image } from "@/components/ui/image";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SegmentTranscript, StoryExtended } from "@/convex/schema/stories.schema";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Share as RNShare, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, {
	interpolate,
	LinearTransition,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function StoryPage() {
	const { storyId } = useLocalSearchParams();
	const { data, isLoading } = useConvexQuery(api.stories.getStory, { storyId: storyId as Id<"stories"> });

	return (
		<SafeAreaView className="flex-1 bg-slate-900 flex">
			<View className="flex-1 flex-col py-12 px-8 flex relative">
				{isLoading || !data ? <StoryLoading /> : <StoryContent story={data} />}
			</View>
		</SafeAreaView>
	);
}

const StoryContent = ({ story }: { story: StoryExtended }) => {
	const [showClosedCaption, setShowClosedCaption] = useState(false);
	const { pause, play, isPlaying, currentTime, duration } = useAudio();
	return (
		<View className="flex flex-1 flex-col items-center relative">
			<StoryHeader story={story} isCollapsed={showClosedCaption} />
			{showClosedCaption && <ClosedCaption transcript={story.transcript} />}
			<View className="absolute bottom-0 left-0 right-0 w-full flex flex-col  bg-slate-900" style={{ zIndex: 1000 }}>
				<View className="flex w-full flex-col bg-slate-900">
					<Progress
						value={duration > 0 ? (currentTime / duration) * 100 : 0}
						className="h-2 bg-slate-800 w-full"
						indicatorClassName="bg-slate-500"
						style={{
							shadowColor: "#000",
							shadowOffset: { width: 1, height: 4 },
							shadowOpacity: 0.25,
							shadowRadius: 16,
						}}
					/>
					<View className="flex w-full flex-row justify-between mt-3">
						<Text className="text-slate-400 text-xs">{formatTime(currentTime)}</Text>
						<Text className="text-slate-400 text-xs">{formatTime(duration)}</Text>
					</View>
				</View>

				<View className="flex w-full flex-col items-center">
					<Pressable
						onPress={() => {
							if (isPlaying) {
								pause();
							} else {
								play();
							}
						}}
						className="size-20 active:bg-slate-800 rounded-full flex items-center justify-center"
					>
						{isPlaying ? (
							<Pause className="text-white fill-white" size={36} />
						) : (
							<Play className="text-white fill-white" size={36} />
						)}
					</Pressable>
				</View>
				<View className="flex w-full flex-col items-start">
					<Button
						className={cn("bg-slate-900 rounded-xl border border-slate-900", showClosedCaption && "bg-slate-500")}
						onPress={() => setShowClosedCaption(!showClosedCaption)}
					>
						<LetterText
							className={cn("text-slate-500 size-6", showClosedCaption && "text-slate-900")}
							strokeWidth={2}
							size={20}
						/>
					</Button>
				</View>
			</View>
		</View>
	);
};

const ClosedCaption = ({ transcript }: { transcript: SegmentTranscript[] }) => {
	const { currentTime } = useAudio();
	const scrollViewRef = useRef<ScrollView>(null);
	const segmentRefs = useRef<{ [key: number]: View | null }>({});
	const lastKnownSegmentRef = useRef<number>(-1);

	const currentSegmentIndex = useMemo(() => {
		const index = transcript.findIndex((segment) => {
			return segment.start_time <= currentTime && segment.end_time >= currentTime;
		});

		if (index >= 0) {
			lastKnownSegmentRef.current = index;
			return index;
		} else if (lastKnownSegmentRef.current >= 0) {
			// Check if we're past the last known segment (in a gap)
			const lastSegment = transcript[lastKnownSegmentRef.current];
			if (lastSegment && currentTime > lastSegment.end_time) {
				return lastKnownSegmentRef.current;
			}
		}

		return index;
	}, [transcript, currentTime]);

	// Auto-scroll to current segment
	useEffect(() => {
		if (currentSegmentIndex >= 0 && segmentRefs.current[currentSegmentIndex]) {
			const segmentView = segmentRefs.current[currentSegmentIndex];
			if (segmentView) {
				segmentView.measure((x, y, width, height) => {
					scrollViewRef.current?.scrollTo({
						y: y - 75, // Offset to center the segment
						animated: true,
					});
				});
			}
		}
	}, [currentSegmentIndex]);

	const getSegmentStatus = (segmentIndex: number) => {
		if (segmentIndex < currentSegmentIndex) return "completed";
		if (segmentIndex === currentSegmentIndex) return "current";
		return "upcoming";
	};

	const renderSegment = (segment: SegmentTranscript, segmentIndex: number) => {
		const status = getSegmentStatus(segmentIndex);
		const isInGap =
			currentSegmentIndex === segmentIndex && !(currentTime >= segment.start_time && currentTime <= segment.end_time);

		return (
			<View
				key={segment.start_time}
				ref={(ref) => {
					segmentRefs.current[segmentIndex] = ref;
				}}
				className={cn(
					"w-full px-6 my-2 rounded-2xl transition-all duration-300",
					status === "upcoming" && "bg-transparent",
				)}
			>
				<View className="flex flex-row flex-wrap">
					{segment.words.map((word, wordIndex) => {
						let textColor = "text-slate-600"; // Default for upcoming segments
						let fontWeight = "font-normal";
						let textShadow = false;

						if (status === "completed") {
							textColor = "text-slate-400";
						} else if (status === "current") {
							const isPreviousWord = currentTime > word.end_time;
							const isCurrentWord =
								currentTime >= word.start_time && currentTime <= word.end_time && word.text.trim() !== "";
							if (isCurrentWord) {
								textColor = "text-white text-xl";
								fontWeight = "font-bold";
								textShadow = true;
							} else if (isPreviousWord || isInGap) {
								textColor = "text-slate-200";
								fontWeight = "font-medium";
							} else {
								textColor = "text-slate-500";
							}
						}

						return (
							<Animated.Text
								key={`${segment.start_time}-${wordIndex}`}
								className={cn("text-lg text-left", textColor, fontWeight)}
								style={{
									textShadowColor: textShadow ? "rgba(255, 255, 255, 0.4)" : "transparent",
									textShadowOffset: { width: 0, height: 1 },
									textShadowRadius: 3,
								}}
							>
								{word.text}
							</Animated.Text>
						);
					})}
				</View>
			</View>
		);
	};

	return (
		<View className="flex-1 w-full pt-8 flex relative">
			<ScrollView
				ref={scrollViewRef}
				className="flex-1 w-full"
				contentContainerStyle={{
					paddingVertical: 40,
					paddingHorizontal: 8,
				}}
				showsVerticalScrollIndicator={false}
				scrollEventThrottle={16}
			>
				{transcript.map((segment, index) => renderSegment(segment, index))}

				{/* Bottom padding for better scrolling experience */}
				<View style={{ height: 306 }} />
			</ScrollView>

			<BlurView
				intensity={25}
				tint="dark"
				className="absolute top-0 left-0 right-0 "
				style={{ zIndex: 1000, height: 98 }}
			/>
			<BlurView
				intensity={12}
				tint="dark"
				className="absolute bottom-40 left-0 right-0 "
				style={{
					zIndex: 1000,
					height: 180,
				}}
			/>
			<BlurView
				intensity={12}
				tint="dark"
				className="absolute bottom-40 left-0 right-0 "
				style={{ zIndex: 1000, height: 180 }}
			/>
		</View>
	);
};

const StoryHeader = ({ story, isCollapsed }: { story: StoryExtended; isCollapsed: boolean }) => {
	const progress = useSharedValue(isCollapsed ? 1 : 0);

	useEffect(() => {
		progress.value = withTiming(isCollapsed ? 1 : 0, { duration: 250 });
	}, [isCollapsed, progress]);

	const { width: screenW } = useWindowDimensions();
	const imgStyle = useAnimatedStyle(() => {
		const size = interpolate(progress.value, [0, 1], [screenW - 48, 80]);
		return { width: size, height: size };
	});

	const titleStyle = useAnimatedStyle(() => {
		return {
			marginTop: interpolate(progress.value, [0, 1], [48, 0]),
			flex: isCollapsed ? interpolate(progress.value, [0, 1], [1, 1]) : undefined,
		};
	});

	const handleShare = async () => {
		try {
			await RNShare.share(
				{
					message: `Check out this story: ${story.title}`,
					url: `https://getdreamdrop.com/stories/${story._id}`,
					title: `Share ${story.title}`,
				},
				{ dialogTitle: `Share ${story.title}` },
			);
		} catch (e) {
			console.warn("[StoryHeader] Error sharing story", e);
		}
	};

	return (
		<Animated.View
			layout={LinearTransition.springify().duration(250).stiffness(150).damping(5)}
			style={[
				{
					flexDirection: isCollapsed ? "row" : "column",
					alignItems: "center",
					width: "100%",
					gap: isCollapsed ? 16 : 0,
				},
			]}
		>
			<Animated.View style={[imgStyle, { borderRadius: 16 }]}>
				<StoryImage imageUrl={story.imageUrl} disableAnimation={isCollapsed} />
			</Animated.View>

			<Animated.View style={[titleStyle, { width: "100%", flexDirection: "row" }]}>
				<View className="flex w-full overflow-hidden flex-1 mr-8 flex-col">
					<Marquee speed={0.5} spacing={48} style={{ maxWidth: 150 }}>
						<Text className="text-slate-200 text-2xl font-bold">{story.title}</Text>
					</Marquee>
					<View className="flex flex-row gap-x-2 items-center mt-2">
						<Calendar className="text-slate-400 size-4" strokeWidth={1} />
						<Text className="text-slate-400 text-sm font-medium">
							{formatDistanceToNow(story.updatedAt, { addSuffix: true })}
						</Text>
					</View>
				</View>
				<View className="flex flex-row gap-x-4 items-center">
					<Button size="icon" variant="ghost" className="bg-slate-800 rounded-full border border-slate-600">
						<Star className="text-slate-500 size-6" strokeWidth={1.5} size={20} />
					</Button>

					<Button
						onPress={handleShare}
						size="icon"
						variant="ghost"
						className="bg-slate-800 rounded-full border border-slate-600"
					>
						<Share className="text-slate-500 size-6" strokeWidth={1.5} size={20} />
					</Button>
				</View>
			</Animated.View>
		</Animated.View>
	);
};

const StoryImage = ({ imageUrl, disableAnimation }: { imageUrl: string | null; disableAnimation?: boolean }) => {
	const [error, setError] = useState(false);
	const showFallback = error || !imageUrl;
	const { isPlaying } = useAudio();

	const scale = useSharedValue(1);

	// Update scale based on playing state
	useEffect(() => {
		if (disableAnimation) {
			return;
		}
		scale.value = withSpring(isPlaying ? 1 : 0.75, {
			damping: 15,
			stiffness: 150,
		});
	}, [isPlaying, scale, disableAnimation]);

	// Animated style for the image container
	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scale.value }],
		};
	});

	if (showFallback) {
		return (
			<View className="aspect-square w-full rounded-xl bg-slate-800 rounded-md border border-zinc-700 flex items-center justify-center">
				<Headphones className="text-zinc-700" strokeWidth={0.5} />
			</View>
		);
	}
	return (
		<View className="flex w-full aspect-square rounded-xl flex items-center justify-center">
			<Animated.View
				className="flex w-full aspect-square rounded-xl flex items-center justify-center"
				style={[
					{
						shadowColor: "#f1f5f9",
						shadowOffset: { width: 1, height: 4 },
						shadowOpacity: 0.25,
						shadowRadius: 16,
					},
					!disableAnimation && animatedStyle,
				]}
			>
				<Image source={{ uri: imageUrl }} className="w-full rounded-xl aspect-square" onError={() => setError(true)} />
			</Animated.View>
		</View>
	);
};

const StoryLoading = () => {
	return (
		<View className="flex flex-1 flex-col items-center">
			<Skeleton className="aspect-square w-full rounded-xl bg-slate-800" />
			<View className="flex w-full mt-12 flex-row gap-x-8">
				<View className="flex flex-col flex-1">
					<Skeleton className="h-6 w-full rounded-xl bg-slate-800" />
					<Skeleton className="h-4 w-2/5 rounded-xl bg-slate-800 mt-2" />
				</View>
				<View className="flex gap-x-4 flex-row items-center">
					<Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
					<Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
				</View>
			</View>
			<View className="flex w-full mt-12 flex-col">
				<Skeleton className="h-3 w-full rounded-full bg-slate-800" />
				<View className="flex w-full flex-row justify-between mt-3">
					<Skeleton className="h-1 w-16 flex rounded-full bg-slate-800 flex" />
					<Skeleton className="h-1 w-16 flex rounded-full bg-slate-800 flex" />
				</View>
			</View>

			<View className="flex w-full mt-12 flex-col items-center">
				<Skeleton className="size-20 rounded-full bg-slate-800" />
			</View>

			<View className="flex w-full mt-12 flex-col ">
				<Skeleton className="w-20 h-9 rounded-full bg-slate-800" />
			</View>
		</View>
	);
};
