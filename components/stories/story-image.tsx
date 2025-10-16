import { AudioLines } from "@/components/ui/icons/audio-lines-icon";
import { FileX } from "@/components/ui/icons/image-fail-icon";
import { Image } from "@/components/ui/image";
import { BLUR_HASH } from "@/lib/constants";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { memo, useMemo, useState } from "react";
import { View } from "react-native";

const imageVariants = cva("flex items-center justify-center", {
	variants: {
		size: {
			default: "size-20 rounded-md ",
			sm: "size-10 rounded-md ",
			md: "size-24 rounded-md ",
			featured: "w-full h-full rounded-t-xl",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

const StoryImagePreviewComp = ({
	imageUrl,
	blurHash = BLUR_HASH,
	size = "default",
	active = false,
	className = "",
	transition = 100,
	recyclingKey,
	disablePlaceholder = false,
}: {
	imageUrl: string | null;
	size?: "default" | "sm" | "md" | "featured";
	active?: boolean;
	className?: string;
	blurHash?: string;
	transition?: number;
	recyclingKey?: string;
	disablePlaceholder?: boolean;
}) => {
	const [error, setError] = useState(false);
	const imageSource = useMemo(() => (imageUrl ? { uri: sanitizeStorageUrl(imageUrl) } : null), [imageUrl]);

	const classes = useMemo(() => {
		return cn(imageVariants({ size }), "relative bg-foreground/20", className);
	}, [size, className]);

	const placeholder = useMemo(
		() => (disablePlaceholder || !blurHash ? undefined : { blurhash: blurHash }),
		[disablePlaceholder, blurHash],
	);

	const showFallback = error || !imageUrl;
	if (showFallback) {
		return (
			<View className={cn(imageVariants({ size }), "bg-foreground/20", className)}>
				<FileX className="text-foreground/60" strokeWidth={1} size={36} />
			</View>
		);
	}
	return (
		<View className={cn(imageVariants({ size }), "relative bg-foreground/20", className)}>
			<Image
				recyclingKey={recyclingKey}
				cachePolicy={"memory-disk"}
				source={imageSource}
				className={classes}
				onError={() => setError(true)}
				placeholder={placeholder}
				transition={transition}
				contentFit="contain"
				placeholderContentFit="contain"
			/>
			{active && (
				<View
					className={cn(
						"absolute inset-0 bg-black/50 lex items-center justify-center",
						size !== "featured" && "rounded-md",
						size === "featured" && "rounded-t-xl",
					)}
				>
					<AudioLines
						className={cn("text-slate-300", size === "featured" && "text-white")}
						size={size === "default" ? 20 : size === "sm" ? 16 : 48}
					/>
				</View>
			)}
		</View>
	);
};

export const StoryImagePreview = memo(
	StoryImagePreviewComp,
	(a, b) =>
		a.imageUrl === b.imageUrl &&
		a.blurHash === b.blurHash &&
		a.size === b.size &&
		a.active === b.active &&
		a.transition === b.transition &&
		a.disablePlaceholder === b.disablePlaceholder,
);
StoryImagePreview.displayName = "StoryImagePreview";
