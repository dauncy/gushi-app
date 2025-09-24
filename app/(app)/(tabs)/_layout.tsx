import { Header } from "@/components/nav/Header";
import { Home } from "@/components/ui/icons/home-icon";
import { Settings } from "@/components/ui/icons/settings-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#fffbf3", padding: 0 }} edges={["top", "bottom"]}>
			<StatusBar style={"dark"} />
			<Tabs
				screenOptions={() => ({
					header: () => <Header />,
					tabBarShowLabel: false,
					tabBarStyle: {
						backgroundColor: "transparent",
						height: 60,
						borderWidth: 0,
						borderColor: "transparent",
						paddingTop: 10,
						paddingBottom: 10,
						borderTopWidth: 1,
					},
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
							<Home size={size} className={focused ? "text-[#0395ff]" : "text-black/30"} />
						),
					}}
				/>
				<Tabs.Screen
					name="favorites"
					options={{
						title: "Favorites",
						tabBarAccessibilityLabel: "Favorites",
						tabBarIcon: ({ color, size, focused }) => (
							<Star size={size} className={focused ? "text-[#0395ff] fill-[#0395ff]" : "text-black/30"} />
						),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						title: "Settings",
						tabBarAccessibilityLabel: "Settings",
						tabBarIcon: ({ color, size, focused }) => (
							<Settings size={size} className={focused ? "text-[#ff2d01]" : "text-black/30"} />
						),
					}}
				/>
			</Tabs>
		</SafeAreaView>
	);
}
