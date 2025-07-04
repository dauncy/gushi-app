import { clsx, type ClassValue } from "clsx";
import { Platform } from "react-native";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getConvexSiteURL = () => {
	if (Platform.OS === "android" && process.env.NODE_ENV === "development") {
		return process.env.EXPO_PUBLIC_CONVEX_SITE_URL?.replace("127.0.0.1", "10.0.2.2") ?? "http://127.0.0.1:3211";
	}
	return process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
};

export const getConvexURL = () => {
	if (Platform.OS === "android" && process.env.NODE_ENV === "development") {
		return process.env.EXPO_PUBLIC_CONVEX_URL?.replace("127.0.0.1", "10.0.2.2") ?? "http://127.0.0.1:3210";
	}
	return process.env.EXPO_PUBLIC_CONVEX_URL ?? "";
};

export const secondsToMinuteString = (seconds: number) => {
	const d = Math.round(seconds);
	const minutes = Math.floor(d / 60);
	const remainingSeconds = d % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
