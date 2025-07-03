import { Id } from "@/convex/_generated/dataModel";
import { AudioStatus, setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

interface AudioState {
	currentTime: number;
	duration: number;
	isPlaying: boolean;
	storyId: Id<"stories"> | null;
}

interface AudioContextDTO {
	setStory: ({ storyUrl, storyId }: { storyUrl: string; storyId: Id<"stories"> }) => void;
	play: () => void;
	pause: () => void;
	stop: () => void;
	currentTime: number;
	duration: number;
	isPlaying: boolean;
	storyId: Id<"stories"> | null;
}

const AudioContext = createContext<AudioContextDTO>({
	setStory: () => {},
	play: () => {},
	pause: () => {},
	stop: () => {},
	currentTime: 0,
	duration: 0,
	isPlaying: false,
	storyId: null,
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
	const initRef = useRef<boolean>(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const audio = useAudioPlayer();

	const [audioState, setAudioState] = useState<AudioState>({
		currentTime: 0,
		duration: 0,
		isPlaying: false,
		storyId: null,
	});

	const statusCallback = useCallback(
		(status: AudioStatus) => {
			if (status.playing) {
				setAudioState((prev) => ({
					...prev,
					isPlaying: true,
				}));
			} else {
				setAudioState((prev) => ({
					...prev,
					isPlaying: false,
				}));
			}
		},
		[setAudioState],
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

	// Sync audio time state from audio
	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}
		intervalRef.current = setInterval(() => {
			const { duration, isPlaying } = audioState;
			if (duration === 0) {
				setAudioState((prev) => ({
					...prev,
					duration: audio.duration,
				}));
			}

			if (!isPlaying) {
				return;
			}
			setAudioState((prev) => ({
				...prev,
				currentTime: audio.currentTime,
			}));
			// 500 is a decent balance between performance and accuracy
		}, 250);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [audio, audioState.isPlaying, audioState.duration]);

	const play = useCallback(() => {
		if (audio.currentTime === audio.duration) {
			audio.seekTo(0);
		}
		audio.play();
		setAudioState((prev) => ({
			...prev,
			isPlaying: true,
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
