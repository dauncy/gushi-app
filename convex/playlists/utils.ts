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
