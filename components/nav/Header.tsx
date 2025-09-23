import { Image } from "@/components/ui/image";
import { View } from "react-native";
const Logo = require("@/assets/images/icon.png");

export const Header = () => {
	return (
		<View className="absolute top-0 left-0 right-0  flex flex-row items-center  px-2 py-1" style={{ opacity: 1 }}>
			<Image source={Logo} className="w-10 h-10" contentFit="contain" cachePolicy={"memory-disk"} />
		</View>
	);
};
