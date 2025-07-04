import { AudioLines } from "@/components/ui/icons/audio-lines-icon";
import { FileX } from "@/components/ui/icons/image-fail-icon";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { useState } from "react";
import { View } from "react-native";

const imageVariants = cva("rounded-md flex items-center justify-center", {
	variants: {
		size: {
			default: "size-20",
			sm: "size-10",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

export const StoryImagePreview = ({
	imageUrl,
	size = "default",
	active = false,
}: {
	imageUrl: string | null;
	size?: "default" | "sm";
	active?: boolean;
}) => {
	const [error, setError] = useState(false);

	const showFallback = error || !imageUrl;
	if (showFallback) {
		return (
			<View className={cn(imageVariants({ size }), "bg-slate-800 border border-zinc-700")}>
				<FileX className="text-zinc-700" strokeWidth={1} size={36} />
			</View>
		);
	}
	return (
		<View className={cn(imageVariants({ size }), "relative")}>
			<Image source={{ uri: imageUrl }} className={cn(imageVariants({ size }))} onError={() => setError(true)} />
			{active && (
				<View className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
					<AudioLines className="text-slate-300" size={size === "default" ? 20 : 16} />
				</View>
			)}
		</View>
	);
};
