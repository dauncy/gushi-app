import { AudioLines } from "@/components/ui/icons/audio-lines-icon";
import { FileX } from "@/components/ui/icons/image-fail-icon";
import { Image } from "@/components/ui/image";
import { BLUR_HASH } from "@/lib/constants";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { memo, useState } from "react";
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
}: {
	imageUrl: string | null;
	size?: "default" | "sm" | "md" | "featured";
	active?: boolean;
	className?: string;
	blurHash?: string;
	transition?: number;
}) => {
	console.log("imageUrl", imageUrl);
	const [error, setError] = useState(false);

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
				cachePolicy={"disk"}
				source={{ uri: sanitizeStorageUrl(imageUrl) }}
				className={cn(imageVariants({ size }))}
				onError={() => setError(true)}
				placeholder={{ blurhash: blurHash }}
				transition={transition}
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

export const StoryImagePreview = memo(StoryImagePreviewComp);
StoryImagePreview.displayName = "StoryImagePreview";
