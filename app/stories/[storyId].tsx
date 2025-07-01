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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StoryExtended } from "@/convex/schema/stories.schema";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { AudioStatus, setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
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
		<SafeAreaView className="flex-1 bg-slate-900">
			<View className="flex-1 flex-col py-12 px-8">
				{isLoading || !data ? <StoryLoading /> : <StoryContent story={data} />}
			</View>
		</SafeAreaView>
	);
}

const StoryContent = ({ story }: { story: StoryExtended }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const audio = useAudioPlayer(story.audioUrl);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const [showClosedCaption, setShowClosedCaption] = useState(false);

	const play = useCallback(() => {
		audio.play();
		setIsPlaying(true);
	}, [audio, setIsPlaying]);

	const pause = useCallback(() => {
		audio.pause();
		setIsPlaying(false);
	}, [audio, setIsPlaying]);

	const statusCallback = useCallback(
		(status: AudioStatus) => {
			if (status.playing) {
				setIsPlaying(true);
			} else {
				setIsPlaying(false);
			}
		},
		[setIsPlaying],
	);

	useEffect(() => {
		const listener = (event: AudioStatus) => {
			statusCallback(event);
		};
		audio.addListener("playbackStatusUpdate", listener);
		return () => {
			audio.removeListener("playbackStatusUpdate", listener);
		};
	}, [statusCallback, audio]);

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: true,
		});
		audio.play();

		setIsPlaying(true);
	}, [audio]);

	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}
		intervalRef.current = setInterval(() => {
			if (duration === 0) {
				setDuration(audio.duration);
			}

			if (!isPlaying) {
				return;
			}
			setCurrentTime(audio.currentTime);
		}, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [audio, duration, setCurrentTime, setDuration, isPlaying]);

	return (
		<View className="flex flex-1 flex-col items-center">
			<StoryImage imageUrl={story.imageUrl} isPlaying={isPlaying} />
			<View className="flex w-full mt-12 flex-row gap-x-8">
				<View className="flex flex-col flex-1">
					<View className="flex w-full overflow-hidden">
						<Marquee speed={0.5} spacing={48} style={{ maxWidth: 150 }}>
							<Text className="text-slate-200 text-2xl font-bold">{story.title}</Text>
						</Marquee>
					</View>
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

					<Button size="icon" variant="ghost" className="bg-slate-800 rounded-full border border-slate-600">
						<Share className="text-slate-500 size-6" strokeWidth={1.5} size={20} />
					</Button>
				</View>
			</View>

			<View className="flex w-full mt-12 flex-col">
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
					<Text className="text-slate-400 text-xs">{formatTime(audio.duration ?? 0)}</Text>
				</View>
			</View>

			<View className="flex w-full mt-12 flex-col items-center">
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
			<View className="flex w-full mt-12 flex-col items-start">
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
	);
};

const StoryImage = ({ imageUrl, isPlaying }: { imageUrl: string | null; isPlaying: boolean }) => {
	const [error, setError] = useState(false);
	const showFallback = error || !imageUrl;

	const scale = useSharedValue(1);

	// Update scale based on playing state
	useEffect(() => {
		scale.value = withSpring(isPlaying ? 1 : 0.75, {
			damping: 15,
			stiffness: 150,
		});
	}, [isPlaying, scale]);

	// Animated style for the image container
	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scale.value }],
		};
	});

	if (showFallback) {
		return (
			<View className="aspect-square w-full rounded-xl bg-slate-800 rounded-md border border-zinc-700 flex items-center justify-center">
				<Headphones className="text-zinc-700 size-12" strokeWidth={0.5} size={96} />
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
					animatedStyle,
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
