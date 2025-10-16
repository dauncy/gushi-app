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
	return lastByOrder[0]?.order ?? -1;
};

export const getLastPlaylistStoryOrder = async (ctx: QueryCtx, playlistId: Id<"playlists">) => {
	const lastByOrder = await ctx.db
		.query("playlistStories")
		.withIndex("by_playlist_id_order", (q) => q.eq("playlistId", playlistId))
		.order("desc")
		.take(1);
	return lastByOrder[0]?.order ?? -1;
};

export const ensurePlaylistTitleIsUnique = async (
	ctx: QueryCtx,
	{ title, userId, playlistId }: { title: string; userId: Id<"users">; playlistId?: Id<"playlists"> },
) => {
	const maybeExistsByTitle = await ctx.db
		.query("playlists")
		.withIndex("by_user_title", (q) => q.eq("userId", userId).eq("name", title))
		.unique();
	if (maybeExistsByTitle) {
		if (maybeExistsByTitle._id === playlistId) {
			return true;
		}
		return false;
	}
	return true;
};
