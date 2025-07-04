import { Button } from "@/components/ui/button";
import { ChevronUp } from "@/components/ui/icons/chevron-up-icon";
import { Clock } from "@/components/ui/icons/clock-icon";
import { FileX } from "@/components/ui/icons/image-fail-icon";
import { LockKeyhole } from "@/components/ui/icons/lock-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/schema/stories.schema";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { FlashList } from "@shopify/flash-list";
import { BlurView } from "expo-blur";
import { Link, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const secondsToMinuteString = (seconds: number) => {
	const d = Math.round(seconds);
	const minutes = Math.floor(d / 60);
	const remainingSeconds = d % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const Logo = require("@/assets/images/icon.png");

export default function Home() {
	return (
		<SafeAreaView className="bg-slate-900 flex-1" edges={["top"]} mode="padding">
			<StatusBar barStyle={"light-content"} />
			<View style={{ flex: 1 }} className="relative bg-neutral-950 px-2">
				<Header />
				<StoryList />
				<UpgradeSection />
			</View>
		</SafeAreaView>
	);
}

const Header = () => {
	return (
		<View className="absolute top-0 left-0 right-0  bg-slate-900 flex flex-row items-center border-b border-slate-800 px-2 py-1">
			<Image
				source={Logo}
				className="w-10 h-10"
				style={{
					resizeMode: "contain",
				}}
			/>
		</View>
	);
};

const StoryList = () => {
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.stories.getStories,
		{},
		{
			initialNumItems: 10,
		},
	);

	const onEndReached = useCallback(() => {
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [loadMore, status]);

	return (
		<View className="flex-1" style={{ marginTop: 44 }}>
			<FlashList
				refreshControl={<RefreshControl tintColor="#8b5cf6" refreshing={refreshing} onRefresh={refresh} />}
				onEndReached={onEndReached}
				extraData={{ isLoading, refreshing, status }}
				data={results}
				keyExtractor={(item) => item._id}
				renderItem={({ item }) => <StoryCard story={item} />}
				estimatedItemSize={100}
				ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
				contentContainerStyle={{
					paddingBottom: 80,
					paddingTop: 12,
				}}
				ListEmptyComponent={
					<>
						{isLoading ? (
							<View className="flex flex-col gap-y-3 mt-16">
								{Array.from({ length: 10 }).map((_, index) => (
									<StoryCardLoading key={`loading-${index}`} />
								))}
							</View>
						) : (
							<View className="flex flex-col gap-y-3 mt-16">
								<Text>No stories found</Text>
							</View>
						)}
					</>
				}
				ListFooterComponent={
					<>
						{status === "LoadingMore" ? (
							<View className="flex flex-row items-center justify-center">
								<ActivityIndicator size="small" color="#8b5cf6" />
							</View>
						) : null}
					</>
				}
			/>
		</View>
	);
};

const StoryCard = ({ story }: { story: StoryPreview }) => {
	const { hasSubscription } = useSubscription();
	const { play, setStory } = useAudio();
	const linkPressable = useRef<boolean>(true);
	const router = useRouter();

	const locked = useMemo(() => {
		if (!story.subscription_required) {
			return false;
		}
		return !hasSubscription;
	}, [hasSubscription, story.subscription_required]);

	if (locked) {
		return (
			<Link href="/upgrade">
				<View className="flex w-full p-3 rounded-xl bg-slate-900 p-4 flex-row  w-full gap-4 border border-slate-800 relative">
					<StoryImage imageUrl={story.imageUrl} />
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
			</Link>
		);
	}

	return (
		<Pressable
			onPress={() => {
				if (!linkPressable.current) {
					return;
				}
				linkPressable.current = false;
				if (story.audioUrl) {
					setStory({ storyUrl: story.audioUrl, storyId: story._id });
					play();
					if (hasSubscription) {
						router.push(`/stories/${story._id}`);
					}
				}
				setTimeout(() => {
					linkPressable.current = true;
				}, 300);
			}}
			className="flex w-full p-3 rounded-xl bg-slate-900 p-4 flex-row  w-full gap-4 border border-slate-800"
		>
			<StoryImage imageUrl={story.imageUrl} />
			<View className="flex flex-col gap-y-1 flex-1 mt-0.5">
				<Text className="text-slate-300 text-lg font-semibold">{story.title}</Text>
				<View className="flex flex-row items-center gap-x-2">
					<Clock className="size-4 text-slate-400" size={16} />
					<Text className="text-slate-400 text-sm font-medium">{secondsToMinuteString(story.duration)}</Text>
				</View>
			</View>

			<View className="flex items-center justify-center">
				<Button
					size="icon"
					className="bg-teal-500 border-teal-100 border rounded-full p-1"
					onPress={(e) => {
						e.stopPropagation();
					}}
				>
					<Play className="text-white fill-white" size={20} />
				</Button>
			</View>
		</Pressable>
	);
};

const StoryImage = ({ imageUrl }: { imageUrl: string | null }) => {
	const [error, setError] = useState(false);

	const showFallback = error || !imageUrl;
	if (showFallback) {
		return (
			<View className="size-20 rounded-md bg-slate-800 rounded-md border border-zinc-700 flex items-center justify-center">
				<FileX className="text-zinc-700" strokeWidth={1} size={36} />
			</View>
		);
	}
	return <Image source={{ uri: imageUrl }} className="size-20 rounded-md" onError={() => setError(true)} />;
};

const StoryCardLoading = () => {
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

const UpgradeSection = () => {
	const router = useRouter();
	return (
		<Pressable
			onPress={() => router.push("/upgrade")}
			className="flex absolute bottom-0 right-0 left-0 border-t border-slate-800 bg-slate-900 p-4 h-20 flex-row items-start justify-between"
		>
			<View className="flex flex-col gap-y-2 flex-1">
				<Text className="text-slate-200 font-semibold">Want to listen to more stories?</Text>
			</View>
			<ChevronUp className="text-slate-200" size={24} />
		</Pressable>
	);
};

// const AudioPreviewPlayer = ({
// 	story,
// 	setCurrentStory,
// }: {
// 	story: StoryPreview;
// 	setCurrentStory: (story: StoryPreview | null) => void;
// }) => {
// 	const { isPlaying, play, pause, stop } = useAudio();

// 	return (
// 		<Animated.View
// 			entering={FadeInDown.delay(50).duration(50).springify()}
// 			exiting={FadeOutDown.delay(50).duration(150).springify()}
// 			style={{
// 				shadowColor: "#f8fafc",
// 				shadowOffset: {
// 					width: 0.5,
// 					height: 1.5,
// 				},
// 				shadowOpacity: 0.25,
// 				shadowRadius: 4,
// 			}}
// 			className="flex w-full p-3 rounded-xl bg-slate-900 p-4 flex-row  w-full gap-4 border border-slate-800 absolute bottom-24 left-0 right-0 ml-2"
// 		>
// 			<StoryImage imageUrl={story.imageUrl} />
// 			<View className="flex flex-col gap-y-1 flex-1 mt-0.5">
// 				<Text className="text-slate-300 text-lg font-semibold" numberOfLines={1} ellipsizeMode="tail">
// 					{story.title}
// 				</Text>
// 			</View>
// 			<View className="flex items-center justify-center flex-row gap-2">
// 				<Pressable
// 					className="size-10 rounded-full flex items-center justify-center p-2 active:bg-slate-800"
// 					onPress={() => {}}
// 				>
// 					{isPlaying ? (
// 						<Pause className="text-slate-200 fill-slate-200" size={20} />
// 					) : (
// 						<Play className="text-slate-200 fill-slate-200" size={20} />
// 					)}
// 				</Pressable>

// 				<Pressable
// 					className="size-10 rounded-full flex items-center justify-center p-2 active:bg-slate-800"
// 					onPress={() => {
// 						setCurrentStory(null);
// 					}}
// 				>
// 					<Stop className="text-slate-200 fill-slate-200" size={20} />
// 				</Pressable>
// 			</View>
// 		</Animated.View>
// 	);
// };
