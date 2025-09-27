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
}

const AudioContext = createContext<AudioContextDTO>({
	play: async () => {},
	pause: async () => {},
	stop: async () => {},
	loadAudio: async () => {},
});

interface AudioStoreDTO {
	audioState: {
		duration: number;
		currentTime: number;
		isPlaying: boolean;
		ended: boolean;
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
		console.log("[@/context/AudioContext.tsx]: AudioProvider: rerender ");
	});

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
				// Only Play/Pause/Stop
				capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
				compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
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
			}),
			TrackPlayer.addEventListener(Event.PlaybackState, (event) =>
				updateAudioIsPlaying({ isPlaying: event.state === State.Playing || event.state === State.Buffering }),
			),
		];
		return () => subs.forEach((s) => s.remove());
	}, []);

	const play = useCallback(async () => {
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

	const loadAudio = useCallback(async (autoplay = true) => {
		await TrackPlayer.reset();
		const story = audioStore.state.story;
		const storyUrl = audioStore.state.audioUrl;
		if (!story || !storyUrl) {
			return;
		}
		console.log("[@/context/AudioContext.tsx]: loadAudio()=>  --- story --- ", {
			story,
			storyUrl,
		});
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

export const useIsStoryActive = ({ storyId }: { storyId: Id<"stories"> }) => {
	const id = useStore(audioStore, (state) => state.story.id);
	return storyId === id;
};

export const useAudioEnded = () => {
	const ended = useStore(audioStore, (state) => state.audioState.ended);
	return ended;
};
