import { Text, View } from "react-native";

export const AgeRangeBadge = ({ ageRange }: { ageRange: string }) => {
	return (
		<View className="absolute bottom-2 right-2 p-1 px-2 bg-[#fab161] rounded-md z-10">
			<Text className="text-xs text-[#0d3050] font-medium" allowFontScaling={false}>{`${ageRange} yrs`}</Text>
		</View>
	);
};
