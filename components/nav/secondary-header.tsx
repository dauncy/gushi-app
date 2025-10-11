import { ArrowLeft } from "@/components/ui/icons/arrow-left-icon";
import { cn } from "@/lib/utils";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { Pressable, Text, View } from "react-native";

export const SecondaryHeader = ({ title, className }: { title: string; className?: string }) => {
	const pressRef = useRef(false);
	const router = useRouter();

	const handleBack = useCallback(() => {
		if (pressRef.current) {
			return;
		}
		pressRef.current = true;
		if (router.canGoBack()) {
			router.back();
		} else {
			router.dismissTo("/");
		}
		setTimeout(() => {
			pressRef.current = false;
		}, 500);
	}, [router]);

	return (
		<View className={cn("flex gap-x-2 flex-row w-full border-b border-black/20 py-4 px-2", className)}>
			<Pressable
				onPress={handleBack}
				className="size-[34px] -mt-2 rounded-full active:bg-black/10 flex items-center justify-center"
			>
				<ArrowLeft className="size-[24px] text-foreground" />
			</Pressable>
			<Text
				style={{ fontFamily: "Baloo", lineHeight: 32, fontSize: 24 }}
				className="text-foreground"
				allowFontScaling={false}
			>
				{title}
			</Text>
		</View>
	);
};
