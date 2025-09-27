import { LockKeyhole } from "@/components/ui/icons/lock-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { StoryPreview } from "@/convex/stories/schema";
import { BlurView } from "expo-blur";
import { RefObject, useMemo, useState } from "react";
import { View } from "react-native";
import { GestureType } from "react-native-gesture-handler";
import { FeaturedBadge } from "./featured-badge";
import { StoryCardHeader } from "./story-card-header";
import { StoryCardPlayButton } from "./story-card-play-button";
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

export const LockedStoryCard = ({
	story,
	cardDimensions,
	setCardDimensions,
}: {
	story: StoryPreview;
	cardDimensions: { width: number; height: number };
	setCardDimensions: (dimensions: { width: number; height: number }) => void;
}) => {
	return (
		<View
			onLayout={(e) => {
				setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.width });
			}}
			className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff] w-full h-full relative"
		>
			<View className="w-full rounded-t-xl w-full relative" style={{ height: cardDimensions.width }}>
				{story.featured && <FeaturedBadge />}
				<StoryImagePreview imageUrl={story.imageUrl} blurHash={story.blurHash ?? undefined} size={"featured"} />
			</View>
			<View className="w-full flex flex-row gap-x-2 p-2 pb-4 items-start">
				<StoryCardHeader title={story.title} duration={story.duration} />
			</View>

			<View className="absolute inset-0 rounded-xl bg-black opacity-40 overflow-hidden" style={{ zIndex: 1 }} />
			<View className="absolute inset-0 items-center justify-center rounded-xl overflow-hidden" style={{ zIndex: 3 }}>
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
	);
};

export const UnlockedStoryCard = ({
	story,
	cardDimensions,
	setCardDimensions,
	active = false,
	hasPlayButton = true,
	playTapRef,
}: {
	story: StoryPreview;
	cardDimensions: { width: number; height: number };
	setCardDimensions: (dimensions: { width: number; height: number }) => void;
	active?: boolean;
	hasPlayButton?: boolean;
	playTapRef?: RefObject<GestureType | null>;
}) => {
	return (
		<View
			className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff]"
			onLayout={(e) => {
				setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.width });
			}}
		>
			<View className="w-full rounded-t-xl w-full relative" style={{ height: cardDimensions.width }}>
				<StoryImagePreview
					imageUrl={story.imageUrl}
					blurHash={story.blurHash ?? undefined}
					size={"featured"}
					active={active}
				/>
				{story.featured && <FeaturedBadge />}
			</View>
			<View className="w-full flex flex-row gap-x-2 p-2 pb-4 items-start">
				<StoryCardHeader title={story.title} duration={story.duration} />
				{hasPlayButton && (
					<View className="flex items-center justify-center mt-0.5">
						<StoryCardPlayButton story={story} externalTapRef={playTapRef} />
					</View>
				)}
			</View>
		</View>
	);
};

export const StoryCard = ({
	story,
	margin,
	active = false,
	hasPlayButton = true,
	playTapRef,
}: {
	story: StoryPreview;
	margin?: "right" | "left";
	active?: boolean;
	hasPlayButton?: boolean;
	playTapRef?: RefObject<GestureType | null>;
}) => {
	const [cardDimensions, setCardDimensions] = useState<{ width: number; height: number }>({ width: 168, height: 140 });
	const { hasSubscription } = useSubscription();

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
		return <LockedStoryCard story={story} cardDimensions={cardDimensions} setCardDimensions={setCardDimensions} />;
	}

	return (
		<UnlockedStoryCard
			story={story}
			cardDimensions={cardDimensions}
			setCardDimensions={setCardDimensions}
			active={active}
			hasPlayButton={hasPlayButton}
			playTapRef={playTapRef}
		/>
	);
};
