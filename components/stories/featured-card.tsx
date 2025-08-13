import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { secondsToMinuteString } from "@/lib/utils";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Clock } from "../ui/icons/clock-icon";
import { LockKeyhole } from "../ui/icons/lock-icon";
import { Play } from "../ui/icons/play-icon";
import { StoryImagePreview } from "./story-image";

export const FeaturedStoryCard = () => {
	const { hasSubscription } = useSubscription();
	const { isLoading, data: story } = useConvexQuery(api.stories.queries.getFeaturedStory, {});
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

	return (
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
				<TouchableOpacity className="absolute z-20 inset-x-1/2 inset-y-1/2">
					<Play className="size-6 text-white fill-white" />
				</TouchableOpacity>
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
		</View>
	);
};
