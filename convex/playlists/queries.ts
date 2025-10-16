import { Id } from "@/convex/_generated/dataModel";
import { query, QueryCtx } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { ConvexError, v } from "convex/values";
import { StoryPreview } from "../stories";
import { storyDocToStoryPreview } from "../stories/utils";
import { PlaylistPreview } from "./schema";
import { ensurePlaylistBelongsToUser } from "./utils";

const getPlaylistStoryCount = async (ctx: QueryCtx, playlistId: Id<"playlists">) => {
	const playlistStories = await ctx.db
		.query("playlistStories")
		.withIndex("by_playlist_id", (q) => q.eq("playlistId", playlistId))
		.collect();
	return playlistStories.length;
};

const getPlaylistImageUrl = async (ctx: QueryCtx, fileId: Id<"files">) => {
	const file = await ctx.db.get(fileId);
	if (!file) {
		return null;
	}
	const url = await ctx.storage.getUrl(file.storageId);
	return url;
};

type PlaylistStoryCount = { type: "storyCount"; data: number };
type PlaylistImageUrl = { type: "imageUrl"; data: string | null };
type PlaylistPromiseData = PlaylistStoryCount | PlaylistImageUrl;

export const getUserPlaylists = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, { paginationOpts }): Promise<PaginationResult<PlaylistPreview>> => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const playlists = await ctx.db
				.query("playlists")
				.withIndex("by_user_order", (q) => q.eq("userId", dbUser._id))
				.order("asc")
				.paginate(paginationOpts);
			const orderedPlaylists: PlaylistPreview[] = await Promise.all(
				playlists.page
					.sort((a, b) => a.order - b.order)
					.map(async (playlist) => {
						const promises: Promise<PlaylistPromiseData>[] = [
							getPlaylistStoryCount(ctx, playlist._id).then((data) => ({ type: "storyCount", data })),
						];
						const imageId = playlist.imageId;
						if (imageId) {
							promises.push(getPlaylistImageUrl(ctx, imageId).then((data) => ({ type: "imageUrl", data })));
						}
						const resolved = await Promise.all(promises);
						const storyCount = resolved.find((promise) => promise.type === "storyCount")?.data ?? 0;
						const imageUrl = resolved.find((promise) => promise.type === "imageUrl")?.data ?? null;
						return {
							...playlist,
							image: imageUrl,
							numStories: storyCount,
						};
					}),
			);
			return {
				...playlists,
				page: orderedPlaylists,
			};
		} catch (error) {
			if (error instanceof ConvexError) {
				if (error.data.toLowerCase().includes("unauthorized")) {
					return {
						page: [],
						isDone: true,
						continueCursor: "",
					};
				}
			}
			console.warn("[@/convex/playlists/queries.ts] getUserPlaylists error", error);
			return {
				page: [],
				isDone: true,
				continueCursor: "",
			};
		}
	},
});

export const getPlaylist = query({
	args: {
		playlistId: v.id("playlists"),
	},
	handler: async (ctx, { playlistId }): Promise<PlaylistPreview | null> => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const playlist = await ensurePlaylistBelongsToUser(ctx, { playlistId, userId: dbUser._id });
			const promises: Promise<PlaylistPromiseData>[] = [
				getPlaylistStoryCount(ctx, playlist._id).then((data) => ({ type: "storyCount", data })),
			];
			const imageId = playlist.imageId;
			if (imageId) {
				promises.push(getPlaylistImageUrl(ctx, imageId).then((data) => ({ type: "imageUrl", data })));
			}
			const resolved = await Promise.all(promises);
			const storyCount = resolved.find((promise) => promise.type === "storyCount")?.data ?? 0;
			const imageUrl = resolved.find((promise) => promise.type === "imageUrl")?.data ?? null;
			return {
				...playlist,
				image: imageUrl,
				numStories: storyCount,
			};
		} catch (error) {
			if (error instanceof ConvexError) {
				if (error.data.toLowerCase().includes("unauthorized")) {
					return null;
				}
			}
			console.warn("[@/convex/playlists/queries.ts] getPlaylist error", error);
			return null;
		}
	},
});

export const getPlaylistStories = query({
	args: {
		playlistId: v.id("playlists"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (
		ctx,
		{ playlistId, paginationOpts },
	): Promise<PaginationResult<{ playlistStoryId: Id<"playlistStories">; story: StoryPreview }>> => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await ensurePlaylistBelongsToUser(ctx, { playlistId, userId: dbUser._id });
			const playlistStories = await ctx.db
				.query("playlistStories")
				.withIndex("by_playlist_id_order", (q) => q.eq("playlistId", playlistId))
				.order("asc")
				.paginate(paginationOpts);
			const stories = await Promise.all(
				playlistStories.page.map(async (playlistStory) => {
					const story = await ctx.db.get(playlistStory.storyId);
					if (!story) {
						return null;
					}
					const storyPreview = await storyDocToStoryPreview(ctx, story);
					return {
						playlistStoryId: playlistStory._id,
						story: storyPreview,
					};
				}),
			);
			return {
				...playlistStories,
				page: stories.filter(Boolean) as { playlistStoryId: Id<"playlistStories">; story: StoryPreview }[],
			};
		} catch (error) {
			if (error instanceof ConvexError) {
				if (error.data.toLowerCase().includes("unauthorized")) {
					return {
						page: [],
						isDone: true,
						continueCursor: "",
					};
				}
			}
			console.warn("[@/convex/playlists/queries.ts] getPlaylistStories error", error);
			return {
				page: [],
				isDone: true,
				continueCursor: "",
			};
		}
	},
});

export const checkStoryInPlaylist = query({
	args: {
		playlistId: v.id("playlists"),
		storyId: v.id("stories"),
	},
	handler: async (ctx, { playlistId, storyId }): Promise<boolean> => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await ensurePlaylistBelongsToUser(ctx, { playlistId, userId: dbUser._id });
			const playlistStory = await ctx.db
				.query("playlistStories")
				.withIndex("by_playlist_id_story_id", (q) => q.eq("playlistId", playlistId).eq("storyId", storyId))
				.first();
			return !!playlistStory;
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return false;
				}
				if (e.data.toLowerCase().includes("playlist not found")) {
					return false;
				}
				if (e.data.toLowerCase().includes("playlist does not belong to user")) {
					return false;
				}
			}
			console.warn("[@/convex/playlists/queries.ts] checkStoryInPlaylist error", e);
			return false;
		}
	},
});
