import { AudioLines } from "@/components/ui/icons/audio-lines-icon";
import { FileX } from "@/components/ui/icons/image-fail-icon";
import { Image } from "@/components/ui/image";
import { useState } from "react";
import { View } from "react-native";

export const StoryImagePreview = ({ imageUrl, active = false }: { imageUrl: string | null; active?: boolean }) => {
	const [error, setError] = useState(false);

	const showFallback = error || !imageUrl;
	if (showFallback) {
		return (
			<View className="size-20 rounded-md bg-slate-800 rounded-md border border-zinc-700 flex items-center justify-center">
				<FileX className="text-zinc-700" strokeWidth={1} size={36} />
			</View>
		);
	}
	return (
		<View className="size-20 rounded-md relative">
			<Image source={{ uri: imageUrl }} className="size-20 rounded-md" onError={() => setError(true)} />
			{active && (
				<View className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
					<AudioLines className="text-slate-300" size={20} />
				</View>
			)}
		</View>
	);
};
