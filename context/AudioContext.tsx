import { Id } from "@/convex/_generated/dataModel";
import { Store, useStore } from "@tanstack/react-store";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from "react";
import TrackPlayer, {
	Capability,
	Event,
	IOSCategory,
	IOSCategoryMode,
	RepeatMode,
	State,
	Track,
} from "react-native-track-player";

interface AudioContextDTO {
	play: () => Promise<void>;
	pause: () => Promise<void>;
	stop: () => Promise<void>;
	loadAudio: (autoplay?: boolean) => Promise<void>;
	seek: (time: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextDTO>({
	play: async () => {},
	pause: async () => {},
	stop: async () => {},
	loadAudio: async () => {},
	seek: async () => {},
});

interface AudioStoreDTO {
	audioState: {
		duration: number;
		currentTime: number;
		isPlaying: boolean;
		isLoading: boolean;
		ended: boolean;
		buffering: boolean;
		paused: boolean;
		ready: boolean;
	};
	story: {
		id: Id<"stories"> | null;
		title: string | null;
		imageUrl: string | null;
	};
	audioUrl: string | null;
}

const defaultAudioStore: AudioStoreDTO = {
	audioState: {
		duration: 0,
		currentTime: 0,
		isPlaying: false,
		ended: false,
		isLoading: false,
		buffering: false,
		paused: false,
		ready: false,
	},
	story: {
		id: null,
		title: null,
		imageUrl: null,
	},
	audioUrl: null,
};

export const audioStore = new Store<AudioStoreDTO>(defaultAudioStore);

export const setAudioStoryData = ({
	id,
	title,
	imageUrl,
}: {
	id: Id<"stories"> | null;
	title: string | null;
	imageUrl: string | null;
}) => {
	audioStore.setState((prev) => ({
		...prev,
		story: {
			...prev.story,
			id,
			title,
			imageUrl,
		},
	}));
};

export const setAudioUrl = ({ url }: { url: string | null }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioUrl: url,
	}));
};

export const resetAudioStore = () => {
	audioStore.setState((prev) => {
		return defaultAudioStore;
	});
};

export const updateAudioCurrentTime = ({ time }: { time: number }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			currentTime: time,
		},
	}));
};

export const updateAudioDuration = ({ duration }: { duration: number }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			duration: duration,
		},
	}));
};

export const updateAudioIsPlaying = ({ isPlaying }: { isPlaying: boolean }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			isPlaying: isPlaying,
		},
	}));
};

export const updateAudioBuffering = ({ buffering }: { buffering: boolean }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			buffering: buffering,
		},
	}));
};

export const updateAudioIsLoading = ({ isLoading }: { isLoading: boolean }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			isLoading: isLoading,
		},
	}));
};

export const updateAudioIsReady = ({ ready }: { ready: boolean }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			ready: ready,
		},
	}));
};

export const updateAudioIsPaused = ({ paused }: { paused: boolean }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			paused: paused,
		},
	}));
};

export const updateAudioEnded = ({ ended }: { ended: boolean }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			ended: ended,
		},
	}));
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
	const initRef = useRef<boolean>(false);

	useEffect(() => {
		async function init() {
			if (initRef.current) {
				return;
			}
			initRef.current = true;

			await TrackPlayer.setupPlayer({
				waitForBuffer: true,
				iosCategory: IOSCategory.Playback,
				iosCategoryMode: IOSCategoryMode.Default,
			});

			await TrackPlayer.updateOptions({
				alwaysPauseOnInterruption: true,
				// Only Play/Pause/Stop/SeekTo
				capabilities: [Capability.Play, Capability.Pause, Capability.Stop, Capability.SeekTo],
				compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop, Capability.SeekTo],
				progressUpdateEventInterval: 0.25,
			});

			await TrackPlayer.setRepeatMode(RepeatMode.Off);
		}

		init();
	}, []);

	useEffect(() => {
		const subs = [
			TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play()),
			TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause()),
			TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => updateAudioEnded({ ended: true })),
			TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
				updateAudioCurrentTime({ time: event.position });
				updateAudioDuration({ duration: event.duration });

				updateAudioEnded({ ended: false });
			}),
			TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
				updateAudioCurrentTime({ time: event.position });
				TrackPlayer.seekTo(event.position);
			}),
			TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
				updateAudioIsPlaying({ isPlaying: event.state === State.Playing });
				updateAudioBuffering({ buffering: event.state === State.Buffering });
				updateAudioIsLoading({ isLoading: event.state === State.Loading });
				updateAudioIsPaused({ paused: event.state === State.Paused });
				updateAudioIsReady({
					ready:
						event.state === State.Ready ||
						(event.state !== State.None && event.state !== State.Loading && event.state !== State.Buffering),
				});
			}),
		];
		return () => subs.forEach((s) => s.remove());
	}, []);

	const play = useCallback(async () => {
		if (audioStore.state.audioState.ended) {
			await TrackPlayer.seekTo(0);
			updateAudioEnded({ ended: false });
		}
		await TrackPlayer.play();
	}, []);

	const pause = useCallback(async () => {
		await TrackPlayer.pause();
	}, []);

	const stop = useCallback(async () => {
		await TrackPlayer.stop();
		await TrackPlayer.reset();
		resetAudioStore();
	}, []);

	const seek = useCallback(async (time: number) => {
		await TrackPlayer.seekTo(time);
	}, []);

	const loadAudio = useCallback(async (autoplay = true) => {
		await TrackPlayer.reset();
		const story = audioStore.state.story;
		const storyUrl = audioStore.state.audioUrl;
		if (!story || !storyUrl) {
			return;
		}
		const track: Track = {
			id: String(story.id),
			url: storyUrl,
			title: story.title ?? "",
			artist: "Gushi",
			artwork: story.imageUrl ?? "", // shows on lock screen
			// We include duration to keep your UI’s durationSV accurate from the start.
			// (No seek capability is exposed, so users can’t scrub.)
		};

		await TrackPlayer.add([track]);

		if (autoplay) {
			await TrackPlayer.play();
		}
	}, []);
	return (
		<AudioContext.Provider
			value={{
				play,
				pause,
				stop,
				loadAudio,
				seek,
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

export const useAudioCurrentTime = () => {
	const currentTime = useStore(audioStore, (state) => state.audioState.currentTime);
	return currentTime;
};

export const useAudioDuration = () => {
	const duration = useStore(audioStore, (state) => state.audioState.duration);
	return duration;
};

export const useIsPlaying = () => {
	const isPlaying = useStore(audioStore, (state) => state.audioState.isPlaying);
	return isPlaying;
};

export const useIsBuffering = () => {
	const buffering = useStore(audioStore, (state) => state.audioState.buffering);
	return buffering;
};

export const useIsLoading = () => {
	const isLoading = useStore(audioStore, (state) => state.audioState.isLoading);
	return isLoading;
};

export const useIsPaused = () => {
	const paused = useStore(audioStore, (state) => state.audioState.paused);
	return paused;
};

export const useIsReady = () => {
	const isReady = useStore(audioStore, (state) => state.audioState.ready);
	return isReady;
};

export const useIsStoryActive = ({ storyId }: { storyId: Id<"stories"> }) => {
	const id = useStore(audioStore, (state) => state.story.id);
	return storyId === id;
};

export const useAudioEnded = () => {
	const ended = useStore(audioStore, (state) => state.audioState.ended);
	return ended;
};
