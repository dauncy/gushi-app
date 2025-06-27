import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { CheckCircle, Crown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, SafeAreaView, Text, TouchableOpacity, View } from "react-native";

const premiumFeatures = ["Access the full story library", "Daily story drop", "Full-screen player", "Immersive mode"];

type Plan = "monthly" | "lifetime";

const PlanCard = ({
	plan,
	price,
	subtitle,
	selected,
	setSelected,
}: {
	plan: Plan;
	price: string;
	subtitle: string;
	selected: Plan;
	setSelected: (plan: Plan) => void;
}) => {
	const active = selected === plan;
	return (
		<TouchableOpacity
			onPress={() => setSelected(plan)}
			activeOpacity={0.85}
			className={`flex-1 rounded-2xl p-4 border ${
				active ? "border-violet-400 bg-violet-600/10" : "border-slate-600 bg-transparent"
			}`}
		>
			<Text className={`font-semibold text-lg ${active ? "text-violet-300" : "text-white"}`}>{price}</Text>
			<Text className="text-slate-300 text-xs mt-1">{subtitle}</Text>
		</TouchableOpacity>
	);
};

export default function Upgrade() {
	const router = useRouter();
	const [selected, setSelected] = useState<Plan>("monthly");
	const onSubscribe = (plan: Plan) => {
		console.log("onSubscribe", plan);
	};
	return (
		<LinearGradient colors={["#0d1b2a", "#000"]} className="flex  mt-12 px-4" style={{ flex: 1, display: "flex" }}>
			<SafeAreaView className="flex-1 mt-8 px-6">
				{/* Header */}
				<View className="items-center mb-8">
					<Crown size={42} color="#fde047" />
					<Text className="text-white text-3xl font-bold mt-2">Upgrade to Premium</Text>
					<Text className="text-slate-300 text-center text-sm mt-1 leading-relaxed">
						Unlock every bedtime story{"\n"}and our advanced listening tools
					</Text>
				</View>

				{/* Feature list */}
				{premiumFeatures.map((feat) => (
					<View key={feat} className="flex-row items-center mb-3 w-full px-4">
						<CheckCircle size={18} color="#22c55e" />
						<Text className="text-slate-300 ml-3">{feat}</Text>
					</View>
				))}

				{/* Plan selector */}
				<View className="flex-row gap-x-2 mt-6 w-full px-4">
					<PlanCard
						plan="monthly"
						price="$1.99 / mo"
						subtitle="Cancel anytime"
						selected={selected}
						setSelected={setSelected}
					/>
					<PlanCard
						plan="lifetime"
						price="$20 one-time"
						subtitle="Lifetime access"
						selected={selected}
						setSelected={setSelected}
					/>
				</View>

				{/* CTA */}
				<View className="w-full px-4 mt-auto mb-12 flex flex-col gap-y-8 items-center">
					<TouchableOpacity onPress={() => onSubscribe(selected)} activeOpacity={0.9} className="w-full flex h-16">
						<LinearGradient
							colors={["#6d28d9", "#c026d3"]}
							style={{
								flex: 1,
								justifyContent: "center",
								alignItems: "center",
								borderRadius: 8,
							}}
						>
							<Text className="text-lg font-semibold text-white uppercase">
								{selected === "monthly" ? "Start Monthly Plan" : "Buy Lifetime Pass"}
							</Text>
						</LinearGradient>
					</TouchableOpacity>

					<Pressable className="flex" onPress={() => router.back()}>
						<Text className="text-violet-400 text-center text-base flex font-medium">{"Cancel"}</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		</LinearGradient>
	);
}
