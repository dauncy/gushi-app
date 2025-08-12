import { Button } from "@/components/ui/button";
import { Clock } from "@/components/ui/icons/clock-icon";
import { LockKeyhole } from "@/components/ui/icons/lock-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { StoryPreview } from "@/convex/stories/schema";
import { presentPaywall } from "@/lib/revenue-cat";
import { sanitizeStorageUrl, secondsToMinuteString } from "@/lib/utils";
import { BlurView } from "expo-blur";
import { useMemo, useRef } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { Stop } from "../ui/icons/stop-icon";
import { StoryImagePreview } from "./story-image";

export const StoryCardLoading = () => {
	return (
		<View className="flex w-full p-3 rounded-xl bg-slate-900 p-3 px-4 flex-row  w-full gap-3">
			<Skeleton className="size-20 rounded-md bg-slate-800" />
			<View className="flex flex-col gap-y-2 flex-1 mt-1">
				<Skeleton className="w-3/5 h-4 rounded-xl bg-slate-800" />
				<Skeleton className="w-1/3 h-4 rounded-xl bg-slate-800" />
			</View>
			<View className="flex items-center justify-center">
				<Skeleton className="size-12 rounded-full bg-slate-800" />
			</View>
		</View>
	);
};

export const StoryCard = ({ story, onCardPress }: { story: StoryPreview; onCardPress: () => void }) => {
	const pressableRef = useRef<boolean>(true);
	const { hasSubscription } = useSubscription();
	const { play, setStory, isPlaying, storyId, stop } = useAudio();

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
			<TouchableOpacity activeOpacity={0.8} onPress={presentPaywall}>
				<View className="flex w-full p-3 rounded-xl bg-slate-900 p-4 flex-row  w-full gap-4 border border-slate-800 relative">
					<StoryImagePreview imageUrl={story.imageUrl} />
					<View className="flex flex-col gap-y-1 flex-1 mt-0.5">
						<Text className="text-slate-300 text-lg font-semibold">{story.title}</Text>
						<View className="flex flex-row items-center gap-x-2">
							<Clock className="size-4 text-slate-400" size={16} />
							<Text className="text-slate-400 text-sm font-medium">{secondsToMinuteString(story.duration)}</Text>
						</View>
					</View>

					<View className="flex items-center justify-center"></View>
					<View className="absolute inset-0 rounded-xl bg-black opacity-40" style={{ zIndex: 1 }}></View>
					<View className="absolute inset-0 items-center justify-center" style={{ zIndex: 3 }}>
						<View
							style={{
								shadowColor: "#f8fafc",
								shadowOffset: {
									width: 0.5,
									height: 1.5,
								},
								shadowOpacity: 0.25,
								shadowRadius: 4,
							}}
							className="flex flex-row items-center justify-center size-12 rounded-full bg-slate-800 p-1"
						>
							<LockKeyhole className="text-slate-200" size={24} />
						</View>
					</View>
					<BlurView intensity={5} tint="dark" className="absolute inset-0 rounded-xl bg-black " style={{ zIndex: 2 }} />
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
			className="flex w-full p-3 rounded-xl bg-slate-900 p-4 flex-row  w-full gap-4 border border-slate-800"
		>
			<StoryImagePreview imageUrl={story.imageUrl} active={isCurrentStory} />
			<View className="flex flex-col gap-y-1 flex-1 mt-0.5">
				<Text className="text-slate-300 text-lg font-semibold">{story.title}</Text>
				<View className="flex flex-row items-center gap-x-2">
					<Clock className="size-4 text-slate-400" size={16} />
					<Text className="text-slate-400 text-sm font-medium">{secondsToMinuteString(story.duration)}</Text>
				</View>
			</View>

			<View className="flex items-center justify-center">
				{isPlaying && isCurrentStory ? (
					<Button
						onPress={() => {
							stop();
						}}
						size="icon"
						className="bg-transparent border-transparent active:bg-slate-800 rounded-full"
					>
						<Stop className="text-slate-400 fill-slate-400" size={20} />
					</Button>
				) : isCurrentStory ? (
					<Button
						onPress={() => {
							play();
						}}
						size="icon"
						className="bg-transparent border-transparent active:bg-slate-800 rounded-full"
					>
						<Play className="text-slate-400 fill-slate-400" size={20} />
					</Button>
				) : (
					<Button
						size="icon"
						className="bg-teal-500 border-teal-100 border rounded-full p-1"
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
		</Pressable>
	);
};
