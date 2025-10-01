import { Image } from "@/components/ui/image";
import { Text, View } from "react-native";
const Logo = require("@/assets/images/icon.png");

export const Header = () => {
	return (
		<View
			className="absolute top-0 left-0 right-0  flex flex-row items-center gap-x-0 px-2 py-1 items-center"
			style={{ opacity: 1 }}
		>
			<Image source={Logo} className="w-10 h-10" contentFit="contain" cachePolicy={"memory-disk"} />
			<View className="flex h-full items-end justify-end w-max mt-[9px]">
				<Text className="text-[#ff78e5] font-black" style={{ fontSize: 28, lineHeight: 28, letterSpacing: -1 }}>
					GUSHI
				</Text>
			</View>
		</View>
	);
};
