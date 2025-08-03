import { Header } from "@/components/nav/Header";
import { Home } from "@/components/ui/icons/home-icon";
import { Settings } from "@/components/ui/icons/settings-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { useSubscription } from "@/context/SubscriptionContext";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
	const { hasSubscription } = useSubscription();
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", padding: 0 }} edges={["top", "bottom"]}>
			<StatusBar style={"light"} />
			<Tabs
				screenOptions={() => ({
					header: () => <Header />,
					tabBarShowLabel: false,
					tabBarStyle: {
						...(hasSubscription === false ? { display: "none" } : {}),
						backgroundColor: "#0f172a",
						height: 60,
						borderWidth: 0,
						borderColor: "transparent",
						paddingTop: 10,
						paddingBottom: 10,
						borderTopColor: "#334155",
						borderTopWidth: 1,
					},
					tabBarActiveTintColor: "#e2e8f0",
					tabBarInactiveTintColor: "#475569",
					tabBarIconStyle: {
						width: 24,
						height: 24,
					},
					tabBarLabelStyle: {
						fontSize: 10,
						fontWeight: "500",
						letterSpacing: -0.24,
					},
				})}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Home",
						tabBarAccessibilityLabel: "Home",
						tabBarIcon: ({ color, size, focused }) => (
							<Home size={size} className={focused ? " text-slate-200" : "text-slate-600"} />
						),
					}}
				/>
				<Tabs.Screen
					name="favorites"
					options={{
						title: "Favorites",
						tabBarAccessibilityLabel: "Favorites",
						tabBarIcon: ({ color, size, focused }) => (
							<Star size={size} className={focused ? " text-slate-200 fill-slate-200" : "text-slate-600"} />
						),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						title: "Settings",
						tabBarAccessibilityLabel: "Settings",
						tabBarIcon: ({ color, size, focused }) => (
							<Settings size={size} className={focused ? " text-slate-200" : "text-slate-600"} />
						),
					}}
				/>
			</Tabs>
		</SafeAreaView>
	);
}
