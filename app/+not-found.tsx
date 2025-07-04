import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, TouchableOpacity, View } from "react-native";

export default function NotFound() {
	const router = useRouter();
	return (
		<View className="flex-1 bg-slate-800 justify-center items-center p-4">
			<StatusBar style="light" />
			<Text className="text-center text-slate-200 text-5xl font-bold mb-4">Wrong Turn?</Text>
			<Text className="text-center text-slate-400 text-lg mb-8">
				This screen doesn&apos;t exist. Or you don&apos;t have access to it.
			</Text>

			<TouchableOpacity
				className="bg-violet-500 rounded-xl px-12 py-4"
				onPress={() => router.replace("/")}
				activeOpacity={0.8}
			>
				<Text className="text-white text-lg font-bold">Go Home</Text>
			</TouchableOpacity>
		</View>
	);
}
