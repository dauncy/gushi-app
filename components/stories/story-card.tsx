import { LockKeyhole } from "@/components/ui/icons/lock-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsStoryActive } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { StoryPreview } from "@/convex/stories/schema";
import { useIsIpad } from "@/hooks/use-is-ipad";
import { BlurView } from "expo-blur";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { AgeRangeBadge } from "./age-range-bade";
import { CategoryBadge } from "./category-badge";
import { FeaturedBadge } from "./featured-badge";
import { StoryCardHeader } from "./story-card-header";
import { StoryImagePreview } from "./story-image";

export const StoryCardLoading = () => {
	const isIpad = useIsIpad();
	const [cardDimensions, setCardDimensions] = useState<{ width: number; height: number }>({ width: 168, height: 140 });
	return (
		<View
			style={{
				width: isIpad ? "25%" : "48.75%", // Takes exactly half the container
				paddingHorizontal: isIpad ? 8 : 0, // Padding instead of margin for consistent spacing
				paddingBottom: isIpad ? 12 : 0,
			}}
		>
			<View
				onLayout={(e) => {
					setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.width });
				}}
				className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff] relative"
			>
				<View className="w-full rounded-t-xl" style={{ height: cardDimensions.width }}>
					<Skeleton className="size-full rounded-t-xl rounded-b-none bg-foreground/20" />
				</View>
				<View className="w-full flex flex-row gap-x-2 items-start flex-wrap p-1">
					<Skeleton className="size-[26px] rounded bg-foreground/20" />
					<Skeleton className="size-[26px] rounded bg-foreground/20" />
				</View>
				<View className="p-2 flex flex-col gap-y-3 pb-4">
					<View className="flex flex-col gap-y-2">
						<Skeleton className="w-full h-[18px] rounded bg-foreground/20" />
						<Skeleton className="w-2/5 h-[18px] rounded bg-foreground/20" />
					</View>
					<View className="flex flex-col gap-[1.5px] flex-wrap">
						<Skeleton className="h-[16px] w-24 rounded bg-foreground/20" />
						<Skeleton className="h-[16px] w-12 rounded bg-foreground/20" />
					</View>
					<View className="flex flex-row gap-x-2 items-center">
						<View className="flex flex-row items-center gap-x-2 flex-1">
							<Skeleton className="size-4 rounded-full bg-foreground/20" />
							<Skeleton className="w-1/3 h-4 rounded-xl bg-foreground/20" />
						</View>
						<View className="flex size-10"></View>
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
				setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
			}}
			className="flex flex-col rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff] grow w-full stretch relative"
		>
			<View className="w-full rounded-t-xl w-full relative" style={{ height: cardDimensions.width }}>
				{story.featured && <FeaturedBadge />}
				{story.age_range && <AgeRangeBadge ageRange={story.age_range} />}
				<StoryImagePreview imageUrl={story.imageUrl} blurHash={story.blurHash ?? undefined} size={"featured"} />
			</View>
			<View className="w-full flex flex-row gap-x-1 items-start flex-wrap p-1">
				{story.categories.map((c) => (
					<CategoryBadge key={c._id} categoryName={c.name} />
				))}
			</View>
			<View className="w-full flex flex-row gap-x-2 p-2 pb-4 items-stretch grow">
				<StoryCardHeader story={story} hasPlayButton={false} />
			</View>

			<View className="absolute inset-0 rounded-xl bg-black opacity-40 overflow-hidden z-20" />
			<View className="absolute inset-0 items-center justify-center rounded-xl overflow-hidden z-30">
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
				intensity={4}
				tint="dark"
				className="absolute inset-0 rounded-xl bg-black overflow-hidden z-30"
				style={{ zIndex: 2, borderRadius: 12 }}
			/>
		</View>
	);
};

export const UnlockedStoryCard = ({
	story,
	cardDimensions,
	setCardDimensions,
	hasPlayButton = true,
}: {
	story: StoryPreview;
	cardDimensions: { width: number; height: number };
	setCardDimensions: (dimensions: { width: number; height: number }) => void;
	hasPlayButton?: boolean;
}) => {
	const currentPlaying = useIsStoryActive({ storyId: story._id });
	const active = useMemo(() => {
		if (!hasPlayButton) {
			return false;
		}
		return currentPlaying;
	}, [hasPlayButton, currentPlaying]);
	return (
		<View
			className="flex flex-col grow stretch rounded-xl w-full bg-[#fffbf3]/60 border-2 border-[#0395ff]"
			onLayout={(e) => {
				setCardDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
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
				{story.age_range && <AgeRangeBadge ageRange={story.age_range} />}
			</View>
			<View className="w-full flex flex-row gap-x-1 items-start flex-wrap p-1">
				{story.categories.map((c) => (
					<CategoryBadge key={c._id} categoryName={c.name} />
				))}
			</View>
			<View className="w-full flex flex-row gap-x-2 p-2 pb-4 items-stretch grow stretch">
				<StoryCardHeader story={story} hasPlayButton={hasPlayButton} />
			</View>
		</View>
	);
};

export const StoryCard = ({ story, hasPlayButton = true }: { story: StoryPreview; hasPlayButton?: boolean }) => {
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
			hasPlayButton={hasPlayButton}
		/>
	);
};
