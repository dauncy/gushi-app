import { Id } from "@/convex/_generated/dataModel";
import { AudioStatus, setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

interface AudioState {
	duration: number;
	isPlaying: boolean;
	storyId: Id<"stories"> | null;
}

interface AudioContextDTO {
	setStory: ({ storyUrl, storyId }: { storyUrl: string; storyId: Id<"stories"> }) => void;
	play: () => void;
	pause: () => void;
	stop: () => void;
	duration: number;
	currentTime: SharedValue<number>;
	isPlaying: boolean;
	storyId: Id<"stories"> | null;
}

const AudioContext = createContext<AudioContextDTO>({
	setStory: () => {},
	play: () => {},
	pause: () => {},
	stop: () => {},
	duration: 0,
	currentTime: { value: 0 } as SharedValue<number>,
	isPlaying: false,
	storyId: null,
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
	const initRef = useRef<boolean>(false);
	const currentTime = useSharedValue(0);
	const audio = useAudioPlayer();

	const [audioState, setAudioState] = useState<AudioState>({
		duration: 0,
		isPlaying: false,
		storyId: null,
	});

	const statusCallback = useCallback(
		(status: AudioStatus) => {
			const time = status.currentTime;
			currentTime.value = time;
			if (status.playing && !audioState.isPlaying) {
				const currDuration = audioState.duration;
				setAudioState((prev) => ({
					...prev,
					isPlaying: true,
					...(currDuration === 0 ? { duration: status.duration } : {}),
				}));
			} else if (!status.playing && audioState.isPlaying) {
				setAudioState((prev) => ({
					...prev,
					isPlaying: false,
				}));
			}
		},
		[currentTime, audioState.isPlaying, audioState.duration],
	);
	// Initialize the audio config
	useEffect(() => {
		const init = async () => {
			if (initRef.current) {
				return;
			}
			initRef.current = true;

			await setAudioModeAsync({
				playsInSilentMode: true,
				shouldPlayInBackground: true,
				interruptionMode: "doNotMix",
			});
		};
		init();
	}, []);

	// Sync audio state from audio status
	useEffect(() => {
		const listener = (event: AudioStatus) => {
			statusCallback(event);
		};
		audio.addListener("playbackStatusUpdate", listener);
		return () => {
			audio.removeListener("playbackStatusUpdate", listener);
		};
	}, [statusCallback, audio]);

	const play = useCallback(() => {
		if (audio.currentTime === audio.duration) {
			audio.seekTo(0);
		}
		audio.play();

		setAudioState((prev) => ({
			...prev,
			isPlaying: true,
			duration: audio.duration,
		}));
	}, [audio]);

	const pause = useCallback(() => {
		audio.pause();
		setAudioState((prev) => ({
			...prev,
			isPlaying: false,
		}));
	}, [audio]);

	const setStory = useCallback(
		({ storyUrl, storyId }: { storyUrl: string; storyId: Id<"stories"> }) => {
			audio.replace(storyUrl);
			setAudioState((prev) => ({
				...prev,
				storyId,
			}));
		},
		[audio, setAudioState],
	);

	const stop = useCallback(() => {
		audio.pause();
		audio.remove();
		setAudioState((prev) => ({
			...prev,
			isPlaying: false,
			storyId: null,
		}));
	}, [audio]);

	return (
		<AudioContext.Provider
			value={{
				setStory,
				play,
				pause,
				stop,
				...audioState,
				currentTime,
			}}
		>
			{children}
		</AudioContext.Provider>
	);
};

export const useAudio = () => {
	const context = useContext(AudioContext);
	return context;
};
