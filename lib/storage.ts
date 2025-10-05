import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeData = async ({
	key,
	value,
}: {
	key: string;
	value: string | number | boolean | Record<string, unknown>;
}) => {
	try {
		await AsyncStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error("[@/lib/storage.ts]: Error storing data: ", e);
	}
};

export const getData = async ({ key }: { key: string }) => {
	try {
		const value = await AsyncStorage.getItem(key);
		return value != null ? JSON.parse(value) : null;
	} catch (e) {
		console.error("[@/lib/storage.ts]: Error getting data: ", e);
		return null;
	}
};
