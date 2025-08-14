import { VerifyAccess } from "@/components/control-flows/VerifyAccess";
import { useAudio } from "@/context/AudioContext";
import { Link, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function StoriesLayout() {
	const { ended, stop } = useAudio();
	return (
		<VerifyAccess
			fallback={
				<View className="flex-1 items-center flex-col justify-center">
					<Text className="text-2xl font-bold text-slate-200">{"You don't have access to this story."}</Text>
					<Text className="text-lg text-slate-400 mt-3">{"This story is part of the Gushi Pro library."}</Text>
					<Link asChild href="/(app)/(tabs)">
						<Pressable className="bg-slate-800 rounded-xl py-2 px-4 mt-4 border border-slate-700 disabled:opacity-50">
							{<Text className="text-lg text-slate-400 font-bold">{"Go Home"}</Text>}
						</Pressable>
					</Link>
				</View>
			}
		>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: {
						backgroundColor: "#0f172a",
						height: "100%",
					},
				}}
			>
				<Stack.Screen
					name="[storyId]"
					listeners={{
						beforeRemove: async (e) => {
							if (ended) {
								await stop();
							}
						},
					}}
				/>
			</Stack>
		</VerifyAccess>
	);
}
