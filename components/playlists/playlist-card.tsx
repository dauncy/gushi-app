import { PlaylistPreview } from "@/convex/playlists/schema";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { ChevronRight } from "../ui/icons/chevron-right-icon";
import { CircleDashed } from "../ui/icons/circle-dashed";
import { Playlist } from "../ui/icons/playlist-icon";
import { Scroll } from "../ui/icons/scroll-icon";
import { Skeleton } from "../ui/skeleton";

const areImagePropsEqual = (oldProps: { imageUrl: string | null }, newProps: { imageUrl: string | null }) => {
	return oldProps.imageUrl === newProps.imageUrl;
};

const PlaylistImage = memo(({ imageUrl }: { imageUrl: string | null }) => {
	const [imageError, setImageError] = useState(false);

	return (
		<View className="size-[64px] rounded-lg bg-foreground/20 flex items-center justify-center">
			{imageUrl && !imageError ? (
				<Image
					source={{ uri: sanitizeStorageUrl(imageUrl) }}
					className="size-full rounded-lg"
					resizeMode="cover"
					onError={() => setImageError(true)}
				/>
			) : (
				<Playlist className="text-foreground/60 fill-foreground/60" strokeWidth={0.5} size={28} />
			)}
		</View>
	);
}, areImagePropsEqual);

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
				"flex flex-row items-center gap-x-1 px-1.5 py-0.5 rounded-md bg-transparent border border-transparent",
				numStories === 0 && "bg-foreground/10 border-foreground/10",
			)}
		>
			<Icon className={cn("text-foreground/80", numStories === 0 && "text-destructive")} size={12} strokeWidth={2.5} />
			<Text
				className={cn("text-foreground/80 font-semibold text-sm", numStories === 0 && "text-destructive")}
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

export const PlaylistCard = ({ playlist, drag }: { playlist: PlaylistPreview; drag: () => void }) => {
	const navigatePressRef = useRef(false);
	const router = useRouter();
	const handleLongPress = useCallback(async () => {
		drag();
	}, [drag]);

	const handleNavigate = useCallback(() => {
		if (navigatePressRef.current) {
			return;
		}
		navigatePressRef.current = true;
		router.push(`/playlists/${playlist._id}`);
		setTimeout(() => {
			navigatePressRef.current = false;
		}, 500);
	}, [playlist._id, router]);

	return (
		<Pressable
			onLongPress={handleLongPress}
			onPress={handleNavigate}
			className={cn("w-full p-4  flex flex-row gap-x-4")}
		>
			<PlaylistImage imageUrl={playlist.image} />
			<View className="flex-1 flex flex-col gap-y-0.5">
				<Text className="text-foreground font-semibold text-xl" maxFontSizeMultiplier={1.2}>
					{playlist.name}
				</Text>
				<View className="flex items-start mt-0 flex-1">
					<PlaylistStoryCount numStories={playlist.numStories} />
				</View>
			</View>
			<View className="flex items-center justify-center">
				<ChevronRight className="size-4 text-foreground" size={24} />
			</View>
		</Pressable>
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
