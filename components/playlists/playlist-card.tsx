import { PlaylistPreview } from "@/convex/playlists/schema";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ChevronRight } from "../ui/icons/chevron-right-icon";
import { CircleDashed } from "../ui/icons/circle-dashed";
import { Playlist } from "../ui/icons/playlist-icon";
import { Scroll } from "../ui/icons/scroll-icon";
import { Image } from "../ui/image";
import { Skeleton } from "../ui/skeleton";

const PlaylistImage = memo(({ imageUrl }: { imageUrl: string | null }) => {
	const [imageError, setImageError] = useState(false);

	return (
		<View className="size-[64px] rounded-lg bg-foreground/10 flex items-center justify-center">
			{imageUrl && !imageError ? (
				<Image
					source={{ uri: sanitizeStorageUrl(imageUrl) }}
					className="size-full rounded-lg"
					contentFit="cover"
					onError={() => setImageError(true)}
				/>
			) : (
				<Playlist className="text-border fill-border" strokeWidth={1.5} size={28} />
			)}
		</View>
	);
});
PlaylistImage.displayName = "PlaylistImage";

const PlaylistStoryCount = memo(({ numStories }: { numStories: number }) => {
	const text = useMemo(() => {
		if (numStories === 0) {
			return "no stories yet";
		}
		if (numStories === 1) {
			return "1 story";
		}
		return `${numStories} stories`;
	}, [numStories]);

	const Icon = useMemo(() => {
		if (numStories === 0) {
			return CircleDashed;
		}
		return Scroll;
	}, [numStories]);

	return (
		<View
			className={cn(
				"flex flex-row items-center gap-x-1 px-1.5 py-0.5 rounded-md bg-secondary border border-foreground/10",
				numStories === 0 && "bg-foreground/10",
			)}
		>
			<Icon className={cn("text-foreground/80", numStories === 0 && "text-destructive")} size={12} />
			<Text
				className={cn("text-foreground/80 font-semibol text-sm", numStories === 0 && "text-destructive")}
				maxFontSizeMultiplier={1.2}
				numberOfLines={1}
				ellipsizeMode="tail"
			>
				{text}
			</Text>
		</View>
	);
});
PlaylistStoryCount.displayName = "PlaylistStoryCount";

export const PlaylistCard = ({
	playlist,
	drag,
	isActive,
}: {
	playlist: PlaylistPreview;
	drag: () => void;
	isActive: boolean;
}) => {
	const scale = useSharedValue(1);
	const wasActive = useRef(false);

	useEffect(() => {
		scale.value = withSpring(isActive ? 1.05 : 1, {
			damping: 15,
			stiffness: 150,
		});

		// Detect drop (when isActive goes from true to false)
		if (wasActive.current && !isActive) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}

		wasActive.current = isActive;
	}, [isActive, scale]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scale.value }],
		};
	});

	const shadowStyle = isActive
		? {
				shadowColor: "#000000",
				shadowOffset: { width: 1.25, height: 2.75 },
				shadowOpacity: 0.25,
				shadowRadius: 5,
			}
		: {};

	const handleLongPress = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		drag();
	}, [drag]);

	return (
		<Animated.View style={animatedStyle}>
			<Pressable
				onLongPress={handleLongPress}
				style={shadowStyle}
				className={cn("w-full p-4  flex flex-row gap-x-4", isActive && "opacity-80 bg-background")}
			>
				<PlaylistImage imageUrl={playlist.image} />
				<View className="flex-1 flex flex-col gap-y-0.5">
					<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
						{playlist.name}
					</Text>
					<View className="flex items-start mt-1.5 flex-1">
						<PlaylistStoryCount numStories={playlist.numStories} />
					</View>
				</View>
				<View className="flex items-center justify-center">
					<ChevronRight className="size-4 text-foreground" size={24} />
				</View>
			</Pressable>
		</Animated.View>
	);
};

export const PlaylistCardLoading = () => {
	return (
		<View className="w-full p-4 flex flex-row gap-x-4">
			<Skeleton className="size-[56px] rounded-lg bg-foreground/10" />
			<View className="flex-1 flex flex-col gap-y-1 mt-1">
				<Skeleton className="h-4 w-32 bg-foreground/10" />
				<Skeleton className="h-3 w-16 bg-foreground/10" />
			</View>
			<View className="flex items-center justify-start">
				<Skeleton className="size-[24px] rounded-full bg-foreground/10 mt-1" />
			</View>
		</View>
	);
};
