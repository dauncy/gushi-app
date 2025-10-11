import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function PlaylistIdPage() {
	const params = useLocalSearchParams();
	console.log("playlistId", params);
	return (
		<View>
			<Text>Playlist</Text>
		</View>
	);
}
