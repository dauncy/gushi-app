import { Platform } from "react-native";

export const useIsIpad = () => {
	return Platform.OS === "ios" && Platform.isPad;
};
