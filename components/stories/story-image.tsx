import { AudioLines } from "@/components/ui/icons/audio-lines-icon";
import { FileX } from "@/components/ui/icons/image-fail-icon";
import { Image } from "@/components/ui/image";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { memo, useState } from "react";
import { View } from "react-native";

const imageVariants = cva("flex items-center justify-center", {
	variants: {
		size: {
			default: "size-20 rounded-md ",
			sm: "size-10 rounded-md ",
			featured: "w-full h-full rounded-t-xl",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

const StoryImagePreviewComp = ({
	imageUrl,
	size = "default",
	active = false,
	className = "",
}: {
	imageUrl: string | null;
	size?: "default" | "sm" | "featured";
	active?: boolean;
	className?: string;
}) => {
	const [error, setError] = useState(false);

	const showFallback = error || !imageUrl;
	if (showFallback) {
		return (
			<View className={cn(imageVariants({ size }), "bg-slate-800 border border-zinc-700", className)}>
				<FileX className="text-zinc-700" strokeWidth={1} size={36} />
			</View>
		);
	}
	return (
		<View className={cn(imageVariants({ size }), "relative", className)}>
			<Image
				cachePolicy={"memory-disk"}
				source={{ uri: sanitizeStorageUrl(imageUrl) }}
				className={cn(imageVariants({ size }))}
				onError={() => setError(true)}
			/>
			{active && (
				<View
					className={cn(
						"absolute inset-0 bg-black/50 lex items-center justify-center",
						size !== "featured" && "rounded-md",
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
