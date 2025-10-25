import { Id } from "@/convex/_generated/dataModel";
import { Store, useStore } from "@tanstack/react-store";
import { usePathname, useRouter } from "expo-router";
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

/** In-queue playlist item (one story with an audio URL) */
interface PlaylistItem {
	id: Id<"stories">;
	playlistId?: Id<"playlists">;
	playlistStoryId?: Id<"playlistStories">;
	title: string;
	url: string;
	imageUrl?: string | null;
}

interface AudioContextDTO {
	play: () => Promise<void>;
	pause: () => Promise<void>;
	stop: () => Promise<void>;
	seek: (time: number) => Promise<void>;
	// playlist/queue stuff:
	setQueue: (items: PlaylistItem[], startIndex?: number, autoplay?: boolean) => Promise<void>;
	gotoNext: (onNext: (item: PlaylistItem) => void) => Promise<PlaylistItem | null>;
	gotoPrev: (onPrev: (item: PlaylistItem) => void) => Promise<PlaylistItem | null>;
	skipToIndex: (index: number, autoplay?: boolean) => Promise<void>;
	clearQueue: () => Promise<void>;
	restartTrack: () => Promise<void>;
	addTracks: (tracks: PlaylistItem[]) => Promise<void>;
}

const AudioContext = createContext<AudioContextDTO>({
	play: async () => {},
	pause: async () => {},
	stop: async () => {},
	seek: async () => {},
	setQueue: async () => {},
	gotoNext: async () => null,
	gotoPrev: async () => null,
	skipToIndex: async () => {},
	clearQueue: async () => {},
	restartTrack: async () => {},
	addTracks: async () => {},
});

interface AudioStoreDTO {
	audioState: {
		duration: number;
		currentTime: number;
		ended: boolean;
		playState: State;
	};
	queue: PlaylistItem[];
	currentQueueIndex: number; // -1 when nothing loaded
}

const defaultAudioStore: AudioStoreDTO = {
	audioState: {
		duration: 0,
		currentTime: 0,
		playState: State.None,
		ended: false,
	},
	queue: [],
	currentQueueIndex: -1,
};

export const audioStore = new Store<AudioStoreDTO>(defaultAudioStore);

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

export const updateAudioPlayState = ({ playState }: { playState: State }) => {
	audioStore.setState((prev) => ({
		...prev,
		audioState: {
			...prev.audioState,
			playState: playState,
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

const mapToTrack = (item: PlaylistItem): Track => ({
	id: String(item.id),
	url: item.url,
	title: item.title ?? "",
	artist: "Gushi",
	artwork: item.imageUrl ?? undefined,
});

const syncStoreToIndex = (index: number) => {
	const q = audioStore.state.queue;
	if (index < 0 || index >= q.length) return;
	const currentItem = q[index];
	if (!currentItem) return;
	audioStore.setState((prev) => ({
		...prev,
		currentQueueIndex: index,
		audioState: { ...prev.audioState, ended: false },
	}));
	return currentItem;
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
	const initRef = useRef<boolean>(false);
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		async function init() {
			if (initRef.current) {
				return;
			}
			initRef.current = true;

			await TrackPlayer.setupPlayer({
				waitForBuffer: true,
				iosCategory: IOSCategory.Playback,
				iosCategoryMode: IOSCategoryMode.SpokenAudio,
			});

			await TrackPlayer.updateOptions({
				alwaysPauseOnInterruption: true,
				capabilities: [
					Capability.Play,
					Capability.Pause,
					// Capability.Stop,
					Capability.SeekTo,
					Capability.SkipToNext,
					Capability.SkipToPrevious,
				],
				compactCapabilities: [
					Capability.Play,
					Capability.Pause,
					// Capability.Stop,
					Capability.SeekTo,
					Capability.SkipToNext,
					Capability.SkipToPrevious,
				],
				progressUpdateEventInterval: 0.25,
			});

			await TrackPlayer.setRepeatMode(RepeatMode.Off);
		}

		init();
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

	const stop = useCallback(async (reset = true) => {
		await TrackPlayer.stop();
		if (reset) {
			await TrackPlayer.reset();
		}
		resetAudioStore();
	}, []);

	const seek = useCallback(async (time: number) => {
		await TrackPlayer.seekTo(time);
	}, []);

	const setQueue = useCallback(async (items: PlaylistItem[], startIndex = 0, autoplay = true) => {
		// Prepare player
		await TrackPlayer.reset();
		if (!items.length) {
			resetAudioStore();
			return;
		}

		// Add tracks
		const tracks = items.map(mapToTrack);
		await TrackPlayer.add(tracks);

		// Set store queue and sync to the chosen index
		audioStore.setState((prev) => ({
			...prev,
			queue: items,
			currentQueueIndex: -1, // will sync below
			audioState: { ...prev.audioState, ended: false },
		}));

		if (startIndex > 0) {
			await TrackPlayer.skip(startIndex);
		}

		syncStoreToIndex(startIndex);

		if (autoplay) {
			await TrackPlayer.play();
		}
	}, []);

	const skipToIndex = useCallback(async (index: number, autoplay = true) => {
		const q = audioStore.state.queue;
		if (!q.length || index < 0 || index >= q.length) return;
		const activeIndex = await TrackPlayer.getActiveTrackIndex();
		if (activeIndex === index) {
			await TrackPlayer.seekTo(0);
			updateAudioEnded({ ended: false });
			return;
		}

		await TrackPlayer.skip(index);
		syncStoreToIndex(index);
		if (autoplay) {
			await TrackPlayer.play();
		}
	}, []);

	const gotoNext = useCallback(async (onNext: (item: PlaylistItem) => void) => {
		try {
			const queue = audioStore.state.queue;

			if (queue.length === 0) return null;
			if (queue.length === 1) {
				const maxDuration = (await TrackPlayer.getProgress()).duration;
				const item = queue[0];
				if (item) {
					if (maxDuration && maxDuration > 0) {
						await TrackPlayer.seekTo(maxDuration);
					}
					onNext(item);
					return item;
				}
				return null;
			}
			await TrackPlayer.skipToNext();
			const idx = await TrackPlayer.getActiveTrackIndex();
			if (typeof idx !== "number") return null;
			if (typeof idx === "number" && idx >= 0) {
				syncStoreToIndex(idx);
			}
			updateAudioEnded({ ended: false });
			const item = queue[idx] ?? null;
			if (!item) {
				throw new Error("No item found");
			}
			onNext(item);
			await TrackPlayer.play();
			return item;
		} catch {
			// end of queue
			updateAudioEnded({ ended: true });
			return null;
		}
	}, []);

	const gotoPrev = useCallback(async (onPrev: (item: PlaylistItem) => void) => {
		try {
			const queue = audioStore.state.queue;
			const position: number = (await TrackPlayer.getProgress()).position ?? 0;
			const idx = await TrackPlayer.getActiveTrackIndex();
			if (typeof idx !== "number") return null;
			const item = queue[idx - 1] ?? null;
			if (position < 3) {
				const restartItem = queue[idx] ?? null;
				restartItem && onPrev(restartItem);
				await TrackPlayer.seekTo(0);
				updateAudioEnded({ ended: false });
				return item;
			}
			item && onPrev(item);
			await TrackPlayer.skipToPrevious();
			if (typeof idx !== "number") return null;
			if (typeof idx === "number" && idx >= 0) {
				syncStoreToIndex(idx);
			}
			updateAudioEnded({ ended: false });
			await TrackPlayer.play();
			return item;
		} catch {
			// at the head; just restart the current track
			await TrackPlayer.seekTo(0);
			return null;
		}
	}, []);

	const clearQueue = useCallback(async () => {
		await TrackPlayer.stop();
		await TrackPlayer.reset();
		resetAudioStore();
	}, []);

	const restartTrack = useCallback(async () => {
		await TrackPlayer.seekTo(0);
		updateAudioEnded({ ended: false });
		await TrackPlayer.play();
	}, []);

	const addTracks = useCallback(async (tracks: PlaylistItem[]) => {
		const tracksToAdd = tracks.map(mapToTrack);
		await TrackPlayer.add(tracksToAdd);
		audioStore.setState((prev) => ({
			...prev,
			queue: [...prev.queue, ...tracks],
		}));
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
				updateAudioPlayState({ playState: event.state });
			}),
			TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async () => {
				const idx = await TrackPlayer.getActiveTrackIndex();
				if (typeof idx === "number" && idx >= 0) {
					syncStoreToIndex(idx);
				}
			}),

			TrackPlayer.addEventListener(Event.RemoteNext, () => {
				gotoNext((item) => {
					if (pathname.startsWith(`/stories/`)) {
						router.setParams({ storyId: item.id });
					}
				});
			}),
			TrackPlayer.addEventListener(Event.RemotePrevious, () => {
				gotoPrev((item) => {
					if (pathname.startsWith(`/stories/`)) {
						router.setParams({ storyId: item.id });
					}
				});
			}),
		];
		return () => subs.forEach((s) => s.remove());
	}, [gotoNext, gotoPrev, pathname, router]);

	return (
		<AudioContext.Provider
			value={{
				addTracks,
				play,
				pause,
				stop,
				seek,
				setQueue,
				gotoNext,
				gotoPrev,
				skipToIndex,
				clearQueue,
				restartTrack,
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

export const useAudioPlayState = () => {
	const playState = useStore(audioStore, (state) => state.audioState.playState);
	return { currentPlayState: playState };
};

export const useIsAudioInState = ({ state }: { state: State }) => {
	const playState = useStore(audioStore, (state) => state.audioState.playState);
	return playState === state;
};

export const useIsStoryActive = ({
	storyId,
	playlistStoryId,
}: {
	storyId: Id<"stories">;
	playlistStoryId?: Id<"playlistStories">;
}) => {
	const { currentIndex, queue } = useStore(audioStore, (state) => {
		return {
			currentIndex: state.currentQueueIndex,
			queue: state.queue,
		};
	});
	if (currentIndex < 0) return false;
	const currentItem = queue[currentIndex];
	if (!currentItem) return false;
	if (playlistStoryId) {
		return currentItem.playlistStoryId === playlistStoryId;
	}
	return currentItem.id === storyId;
};

export const useHasActiveQueue = () => {
	const { currentIndex, queue } = useStore(audioStore, (state) => {
		return {
			currentIndex: state.currentQueueIndex,
			queue: state.queue,
		};
	});
	if (currentIndex < 0) return false;
	const currentItem = queue[currentIndex];
	return !!currentItem;
};

export const useAudioEnded = () => {
	const ended = useStore(audioStore, (state) => state.audioState.ended);
	return ended;
};

export const useHasPrev = () => {
	const { currentQueueIndex } = useStore(audioStore, (s) => ({
		queue: s.queue,
		currentQueueIndex: s.currentQueueIndex,
	}));
	return currentQueueIndex > 0;
};

export const useHasNext = () => {
	const { queue, currentQueueIndex } = useStore(audioStore, (s) => ({
		queue: s.queue,
		currentQueueIndex: s.currentQueueIndex,
	}));
	return currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1;
};

export const useActiveQueueItem = () => {
	const { currentIndex, queue } = useStore(audioStore, (state) => {
		return {
			currentIndex: state.currentQueueIndex,
			queue: state.queue,
		};
	});
	if (currentIndex < 0) return null;
	const currentItem = queue[currentIndex];
	return currentItem ?? null;
};

export const useIsPlaylistActive = ({ playlistId }: { playlistId: Id<"playlists"> }) => {
	const { currentIndex, queue } = useStore(audioStore, (state) => {
		return {
			currentIndex: state.currentQueueIndex,
			queue: state.queue,
		};
	});
	if (currentIndex < 0) return false;
	const currentItem = queue[currentIndex];
	return currentItem?.playlistId === playlistId;
};

export const useGetIndexOfItem = ({ playlistStoryId }: { playlistStoryId: Id<"playlistStories"> }) => {
	const { queue } = useStore(audioStore, (state) => ({
		queue: state.queue,
	}));
	return queue.findIndex((item) => item.playlistStoryId === playlistStoryId);
};
