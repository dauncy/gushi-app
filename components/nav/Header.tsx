import { Image } from "@/components/ui/image";
import { View } from "react-native";
const Logo = require("@/assets/images/icon.png");

export const Header = () => {
	return (
		<View className="absolute top-0 left-0 right-0  bg-slate-900 flex flex-row items-center border-b border-slate-800 px-2 py-1">
			<Image
				source={Logo}
				className="w-10 h-10"
				style={{
					resizeMode: "contain",
				}}
			/>
		</View>
	);
};
