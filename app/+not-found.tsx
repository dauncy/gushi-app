import { Link, usePathname, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function NotFound() {
	const router = useRouter();
	const path = usePathname();
	return (
		<View className="flex-1 bg-[#0a0a0a] justify-center items-center p-4">
			<Text className="text-center text-[#22C55E] text-5xl font-bold mb-4">Wrong Turn?</Text>
			<Text className="text-center text-[#A1A1AA] text-lg mb-8">This screen doesn&apos;t exist.</Text>
			<Text className="text-center text-[#A1A1AA] text-lg mb-8">Route: {path} </Text>
			<Link href="/_sitemap">
				<Text className="text-[#22C55E] text-lg font-bold">Sitemap</Text>
			</Link>
			<TouchableOpacity
				className="bg-[#22C55E] rounded-xl px-12 py-4"
				onPress={() => router.replace("/")}
				activeOpacity={0.8}
			>
				<Text className="text-[#0a0a0a] text-lg font-bold">Go Home</Text>
			</TouchableOpacity>
		</View>
	);
}
