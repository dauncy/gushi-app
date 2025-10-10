import { Id } from "@/convex/_generated/dataModel";
import { query, QueryCtx } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { ConvexError, v } from "convex/values";
import { PlaylistPreview } from "./schema";

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
		lastSeenOrder: v.optional(v.number()),
		take: v.optional(v.number()),
	},
	handler: async (
		ctx,
		{ lastSeenOrder = 0, take = 10 },
	): Promise<{
		page: PlaylistPreview[];
		lastSeenOrder: Id<"playlists"> | null;
		done: boolean;
	}> => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const playlists = await ctx.db
				.query("playlists")
				.withIndex("by_user_order", (q) => q.eq("userId", dbUser._id).gt("order", lastSeenOrder))
				.take(take);
			const orderedPlaylists: PlaylistPreview[] = await Promise.all(
				playlists
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
			const lastId = orderedPlaylists[orderedPlaylists.length - 1]?._id;
			return {
				page: orderedPlaylists,
				lastSeenOrder: lastId ?? null,
				done: orderedPlaylists.length < take,
			};
		} catch (error) {
			if (error instanceof ConvexError) {
				if (error.data.toLowerCase().includes("unauthorized")) {
					return {
						page: [],
						lastSeenOrder: null,
						done: true,
					};
				}
			}
			console.warn("[@/convex/playlists/queries.ts] getUserPlaylists error", error);
			return {
				page: [],
				lastSeenOrder: null,
				done: true,
			};
		}
	},
});
