import { Id } from "@/convex/_generated/dataModel";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import TrackPlayer, {
	Capability,
	Event,
	IOSCategory,
	IOSCategoryMode,
	RepeatMode,
	State,
	Track,
	usePlaybackState,
	useProgress,
} from "react-native-track-player";

interface AudioState {
	duration: number;
	isPlaying: boolean;
	storyId: Id<"stories"> | null;
	ended: boolean;
}

interface AudioContextDTO {
	setStory: ({
		storyUrl,
		storyId,
		storyImage,
		storyTitle,
		autoPlay,
	}: {
		storyUrl: string;
		storyId: Id<"stories">;
		storyImage: string;
		storyTitle: string;
		autoPlay?: boolean;
	}) => void;
	play: () => Promise<void>;
	pause: () => Promise<void>;
	stop: () => Promise<void>;
	duration: number;
	currentTime: SharedValue<number>;
	isPlaying: boolean;
	storyId: Id<"stories"> | null;
	ended: boolean;
}

const AudioContext = createContext<AudioContextDTO>({
	setStory: () => {},
	play: async () => {},
	pause: async () => {},
	stop: async () => {},
	duration: 0,
	currentTime: { value: 0 } as SharedValue<number>,
	isPlaying: false,
	storyId: null,
	ended: false,
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
	const initRef = useRef<boolean>(false);
	// SharedValues for animation-friendly UI
	const currentTime = useSharedValue(0);
	const durationSV = useSharedValue(0);

	const [audioState, setAudioState] = useState<AudioState>({
		duration: 0,
		isPlaying: false,
		storyId: null,
		ended: false,
	});

	// TrackPlayer hooks
	const playbackState = usePlaybackState();
	const progress = useProgress(250); // update every 250ms

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

	// Sync SharedValues
	useEffect(() => {
		if (typeof progress.position === "number") currentTime.value = progress.position;
		if (typeof progress.duration === "number") {
			if (durationSV.value !== progress.duration) {
				durationSV.value = progress.duration;
				setAudioState((prev) => ({ ...prev, duration: progress.duration }));
			}
		}
	}, [progress.position, progress.duration, currentTime, durationSV]);

	// Sync isPlaying
	useEffect(() => {
		const playing = playbackState.state === State.Playing || playbackState.state === State.Buffering;
		if (playing !== audioState.isPlaying) {
			setAudioState((prev) => ({ ...prev, isPlaying: playing }));
		}
	}, [playbackState, audioState.isPlaying]);

	// Remote controls: only play/pause
	useEffect(() => {
		const subs = [
			TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play()),
			TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause()),
			TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => setAudioState((prev) => ({ ...prev, ended: true }))),
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
		currentTime.value = 0;
		durationSV.value = 0;
		setAudioState((p) => ({ ...p, isPlaying: false, storyId: null, duration: 0, ended: false }));
	}, [currentTime, durationSV]);

	const setStory = useCallback(
		async ({
			storyUrl,
			storyId,
			storyImage,
			storyTitle = "Gushi Bedtime Story",
			autoPlay = false,
		}: {
			storyUrl: string;
			storyId: Id<"stories">;
			storyImage: string;
			storyTitle: string;
			autoPlay?: boolean;
		}) => {
			await TrackPlayer.reset();

			const track: Track = {
				id: String(storyId),
				url: storyUrl,
				title: storyTitle,
				artist: "Gushi",
				artwork: storyImage, // shows on lock screen
				// We include duration to keep your UI’s durationSV accurate from the start.
				// (No seek capability is exposed, so users can’t scrub.)
			};

			await TrackPlayer.add([track]);

			setAudioState((prev) => ({
				...prev,
				storyId,
				duration: typeof durationSV.value === "number" ? durationSV.value : 0,
				ended: false,
				...(autoPlay ? { isPlaying: true } : {}),
			}));

			if (autoPlay) {
				await TrackPlayer.play();
			}
		},
		[durationSV],
	);

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
