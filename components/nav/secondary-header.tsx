import { ArrowLeft } from "@/components/ui/icons/arrow-left-icon";
import { cn } from "@/lib/utils";
import { Href, useRouter } from "expo-router";
import { ReactNode, useCallback, useRef } from "react";
import { Pressable, Text, View } from "react-native";

export const SecondaryHeader = ({
	title,
	className,
	dismissTo = "/",
	rightNode,
}: {
	title?: string;
	className?: string;
	dismissTo?: Href;
	rightNode?: ReactNode;
}) => {
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
			router.dismissTo(dismissTo);
		}
		setTimeout(() => {
			pressRef.current = false;
		}, 500);
	}, [router, dismissTo]);

	return (
		<View
			className={cn(
				"flex gap-x-2 flex-row w-full border-b-[0.5px] border-foreground/20 py-4 px-2 bg-background",
				className,
			)}
		>
			<Pressable
				onPress={handleBack}
				className="size-[34px] -mt-2 rounded-full active:bg-foreground/10 flex items-center justify-center"
			>
				<ArrowLeft className="size-[24px] text-foreground" />
			</Pressable>
			{title && (
				<Text
					style={{ fontFamily: "Baloo", lineHeight: 32, fontSize: 24 }}
					className="text-foreground"
					allowFontScaling={false}
				>
					{title}
				</Text>
			)}
			{rightNode && <View className="ml-auto -mt-2">{rightNode}</View>}
		</View>
	);
};
