import { Id } from "@/convex/_generated/dataModel";
import { QueryCtx } from "@/convex/_generated/server";
import { ConvexError } from "convex/values";

export const ensurePlaylistBelongsToUser = async (
	ctx: QueryCtx,
	{ playlistId, userId }: { playlistId: Id<"playlists">; userId: Id<"users"> },
) => {
	const playlist = await ctx.db.get(playlistId);
	if (!playlist) {
		throw new ConvexError("Playlist not found");
	}
	if (playlist.userId !== userId) {
		throw new ConvexError("Playlist does not belong to user");
	}
	return playlist;
};

export const getLastPlaylistOrder = async (ctx: QueryCtx, userId: Id<"users">) => {
	const lastByOrder = await ctx.db
		.query("playlists")
		.withIndex("by_user_order", (q) => q.eq("userId", userId))
		.order("desc")
		.take(1);
	return lastByOrder[0]?.order ?? 0;
};

export const getLastPlaylistStoryOrder = async (ctx: QueryCtx, playlistId: Id<"playlists">) => {
	const lastByOrder = await ctx.db
		.query("playlistStories")
		.withIndex("by_playlist_id_order", (q) => q.eq("playlistId", playlistId))
		.order("desc")
		.take(1);
	return lastByOrder[0]?.order ?? 0;
};
