import { VerifyAccess } from "@/components/control-flows/VerifyAccess";
import { Header } from "@/components/nav/Header";
import { Home } from "@/components/ui/icons/home-icon";
import { Settings } from "@/components/ui/icons/settings-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";

export default function ProtectedLayout() {
	return (
		<VerifyAccess redirect="/upgrade">
			<SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", padding: 0 }}>
				<StatusBar style={"light"} />
				<Tabs
					screenOptions={() => ({
						header: () => <Header />,
						// headerShown: false,
						tabBarShowLabel: false,
						tabBarStyle: {
							backgroundColor: "#0f172a",
							height: 60,
							// height: 65,
							// position: "absolute",
							// overflow: "hidden",
							borderWidth: 0,
							borderColor: "transparent",
							paddingTop: 10,
							paddingBottom: 10,
							borderTopColor: "#334155",
							borderTopWidth: 1,
						},
						sceneStyle: {
							backgroundColor: "red",
						},
						tabBarActiveTintColor: "#e2e8f0",
						tabBarInactiveTintColor: "#475569",
						tabBarIconStyle: {
							width: 24,
							height: 24,
						},

						tabBarLabelStyle: {
							// marginTop: 3,
							fontSize: 10,
							fontWeight: "500",
							letterSpacing: -0.24,
						},
					})}
				>
					<Tabs.Screen
						name="stories"
						options={{
							// href: "/(app)/(protected)/(home)",
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
		</VerifyAccess>
	);
}
