import { Image } from "@/components/ui/image";
import { Text, View } from "react-native";
const Logo = require("@/assets/images/icon.png");

export const Header = () => {
	return (
		<View className="flex flex-row items-center gap-x-0 px-2 py-1 items-center" style={{ opacity: 1 }}>
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
		</View>
	);
};
