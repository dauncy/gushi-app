import { Header } from "@/components/nav/Header";
import { Home } from "@/components/ui/icons/home-icon";
import { Search } from "@/components/ui/icons/search-icon";
import { Settings } from "@/components/ui/icons/settings-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { updateCategoryId, useSelectedCategory } from "@/stores/category-store";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { RefObject } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
	const currentCategory = useSelectedCategory();
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#fffbf3", padding: 0 }} edges={["top", "bottom"]}>
			<StatusBar style={"dark"} />
			<Tabs
				screenOptions={() => ({
					header: () => <Header />,
					tabBarShowLabel: true,
					tabBarStyle: {
						backgroundColor: "transparent",
						height: 60,
						borderWidth: 0,
						borderColor: "transparent",
						paddingTop: 10,
						paddingBottom: 10,
						borderTopWidth: 1,
					},
					tabBarAllowFontScaling: false,
					tabBarIconStyle: {
						width: 24,
						height: 24,
					},
					tabBarLabelStyle: {
						fontSize: 14,
						fontWeight: 600,
						letterSpacing: -0.24,
						fontFamily: "Baloo",
						marginTop: 1.5,
					},
					tabBarInactiveTintColor: "#00000050",
					tabBarActiveTintColor: "#0395ff",
				})}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Library",
						tabBarAccessibilityLabel: "Home",

						tabBarIcon: ({ color, size, focused }) => (
							<Home size={size} className={focused ? "text-[#0395ff]" : "text-black/30"} />
						),
						tabBarButton: ({ children, onPress, ...props }) => (
							<Pressable
								//@ts-ignore
								ref={props.ref ? (props.ref as RefObject<View>) : null}
								{...props}
								onPress={(e) => {
									if (currentCategory) {
										updateCategoryId(null);
									}
									onPress?.(e);
								}}
							>
								{children}
							</Pressable>
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
					name="search"
					options={{
						title: "Search",
						tabBarAccessibilityLabel: "Search",
						tabBarIcon: ({ color, size, focused }) => (
							<Search size={size} className={focused ? "text-[#0395ff]" : "text-black/30"} />
						),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						title: "Settings",
						tabBarAccessibilityLabel: "Settings",
						tabBarIcon: ({ color, size, focused }) => (
							<Settings size={size} className={focused ? "text-[#0395ff]" : "text-black/30"} />
						),
					}}
				/>
			</Tabs>
		</SafeAreaView>
	);
}
