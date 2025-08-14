import { Clock } from "@/components/ui/icons/clock-icon";
import { LockKeyhole } from "@/components/ui/icons/lock-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/stories";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { sanitizeStorageUrl, secondsToMinuteString } from "@/lib/utils";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Button } from "../ui/button";
import { Stop } from "../ui/icons/stop-icon";
import { Skeleton } from "../ui/skeleton";
import { StoryImagePreview } from "./story-image";

const FeaturedStoryCardCom = ({ onCardPress }: { onCardPress: (story: StoryPreview) => void }) => {
	const { setStory, isPlaying, storyId, play, stop } = useAudio();
	const { hasSubscription } = useSubscription();
	const { data: story, isLoading } = useConvexQuery(
		api.stories.queries.getFeaturedStory,
		{},
		{
			refetchOnMount: true,
		},
	);
	const pressableRef = useRef<boolean>(true);
	const router = useRouter();

	const presentPaywall = useCallback(() => {
		if (pressableRef.current) {
			pressableRef.current = false;
			router.push("/upgrade");
			setTimeout(() => {
				pressableRef.current = true;
			}, 300);
		}
	}, [router, pressableRef]);

	const locked = useMemo(() => {
		if (!story?.audioUrl) {
			return true;
		}
		if (!story?.subscription_required) {
			return false;
		}
		return !hasSubscription;
	}, [hasSubscription, story?.subscription_required, story?.audioUrl]);

	const isCurrentStory = useMemo(() => {
		return storyId === story?._id;
	}, [storyId, story?._id]);

	const imageUrl = useMemo(() => {
		return sanitizeStorageUrl(story?.imageUrl ?? "");
	}, [story?.imageUrl]);

	if (isLoading) {
		return (
			<View className="flex flex-col w-full rounded-xl bg-slate-900  border border-slate-800 mb-4">
				<Skeleton className="w-full h-36 bg-slate-800 rounded-t-xl" />
				<View className="flex flex-col p-4">
					<Skeleton className="w-1/2 h-4 bg-slate-800" />
					<Skeleton className="w-1/3 h-4 bg-slate-800 mt-2" />
				</View>
			</View>
		);
	}

	if (!story) {
		return null;
	}

	if (locked) {
		return (
			<TouchableOpacity activeOpacity={0.8} onPress={presentPaywall}>
				<View className="flex flex-col w-full rounded-xl bg-slate-900  border border-slate-800 mb-4">
					<View className="flex flex-row items-center justify-between w-full h-36 bg-black relative">
						<View
							className="absolute top-2 right-2 bg-amber-500 z-20 w-24 rounded-full p-1 border border-white"
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
							<Text className="text-white text-center text-xs font-bold">FEATURED</Text>
						</View>

						<StoryImagePreview
							imageUrl={story.imageUrl}
							className="w-full h-full rounded-t-xl opacity-30"
							size="featured"
						/>
					</View>
					<View className="flex flex-col  p-4">
						<Text className="text-slate-200 text-lg font-semibold">{story.title}</Text>
						<View className="flex flex-row items-center gap-x-2">
							<Clock className="size-4 text-slate-400" size={16} />
							<Text className="text-slate-400 text-sm font-medium">{secondsToMinuteString(story.duration)}</Text>
						</View>
					</View>

					<View className="flex items-center justify-center"></View>
					<View className="absolute inset-0 rounded-xl bg-black opacity-40" style={{ zIndex: 1 }}></View>
					<View className="absolute inset-0 items-center justify-center" style={{ zIndex: 50 }}>
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
					<BlurView
						intensity={5}
						tint="dark"
						className="absolute inset-0 rounded-xl bg-black "
						style={{ zIndex: 40 }}
					/>
				</View>
			</TouchableOpacity>
		);
	}
	console.log("story.imageUrl: ", imageUrl);
	return (
		<TouchableOpacity onPress={() => onCardPress(story)}>
			<View className="flex flex-col w-full rounded-xl bg-slate-900  border border-slate-800 mb-4">
				<View className="flex flex-row items-center justify-between w-full h-36 relative">
					<View
						className="absolute top-2 right-2 bg-amber-500 z-20 w-24 rounded-full p-1 border border-white"
						style={{
							shadowColor: "#000000",
							shadowOffset: {
								width: 0.5,
								height: 1.5,
							},
							shadowOpacity: 0.25,
							shadowRadius: 4,
						}}
					>
						<Text className="text-white text-center text-xs font-bold">FEATURED</Text>
					</View>

					<StoryImagePreview
						imageUrl={imageUrl}
						className="w-full h-full rounded-t-xl opacity-70"
						size="featured"
						active={isCurrentStory}
					/>
				</View>
				<View className="flex flex-row gap-x-4 p-4 items-center">
					<View className="flex flex-col flex-1">
						<Text className="text-slate-200 text-lg font-semibold">{story.title}</Text>
						<View className="flex flex-row items-center gap-x-2">
							<Clock className="size-4 text-slate-400" size={16} />
							<Text className="text-slate-400 text-sm font-medium">{secondsToMinuteString(story.duration)}</Text>
						</View>
					</View>
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
			</View>
		</TouchableOpacity>
	);
};

export const FeaturedStoryCard = memo(FeaturedStoryCardCom);
FeaturedStoryCard.displayName = "FeaturedStoryCard";
