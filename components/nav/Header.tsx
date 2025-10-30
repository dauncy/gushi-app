import { Image } from "@/components/ui/image";
import { updateCategoryId } from "@/stores/category-store";
import * as Haptics from "expo-haptics";
import { useCallback, useRef } from "react";
import { Pressable, Text, View } from "react-native";

const Logo = require("@/assets/images/icon.png");

export const Header = ({ onLogoPress }: { onLogoPress: () => void }) => {
	const pressRef = useRef(false);
	const handleLogoPress = useCallback(async () => {
		if (pressRef.current) return;
		pressRef.current = true;
		updateCategoryId(null);
		onLogoPress();
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		setTimeout(() => {
			pressRef.current = false;
		}, 500);
	}, [onLogoPress]);
	return (
		<View className="flex flex-row items-center gap-x-0 px-2 py-1 items-center" style={{ opacity: 1 }}>
			<Pressable className="flex-row items-center gap-x-0" onPress={handleLogoPress}>
				<Image source={Logo} className="size-[48px] mb-1" contentFit="contain" cachePolicy={"memory-disk"} />
				<View className="flex items-center justify-end w-max mt-auto -mb-[1px] -ml-1">
					<Text
						className="text-[#ff78e5] font-black"
						allowFontScaling={false}
						style={{ fontSize: 24, lineHeight: 24, letterSpacing: -1 }}
					>
						GUSHI stories
					</Text>
				</View>
			</Pressable>
		</View>
	);
};
