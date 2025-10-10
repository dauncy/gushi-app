import { mutation } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { ConvexError, v } from "convex/values";
import { ensurePlaylistBelongsToUser } from "./utils";

export const createPlaylist = mutation({
	args: {
		title: v.string(),
		imageId: v.optional(v.id("files")),
	},
	handler: async (ctx, args) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const maybeExistsByTitle = await ctx.db
				.query("playlists")
				.withIndex("by_user_title", (q) => q.eq("userId", dbUser._id).eq("name", args.title))
				.unique();
			if (maybeExistsByTitle) {
				return {
					data: null,
					error: "Playlist with this title already exists",
				};
			}

			const lastByOrder = await ctx.db
				.query("playlists")
				.withIndex("by_user_order", (q) => q.eq("userId", dbUser._id))
				.order("desc")
				.take(1);

			const order = lastByOrder[0]?.order ?? 0;
			const playlist = await ctx.db.insert("playlists", {
				userId: dbUser._id,
				name: args.title,
				imageId: args.imageId,
				order: order + 1,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { data: playlist, error: null };
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return { data: null, error: null };
				}
			}
			console.warn("[@/convex/playlists/mutations.ts]: createPlaylist() => error", e);
			return { data: null, error: "Internal server error" };
		}
	},
});

export const reorderPlaylist = mutation({
	args: {
		playlistOrders: v.array(
			v.object({
				playlistId: v.id("playlists"),
				order: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await Promise.all(
				args.playlistOrders.map(async (playlistOrder) => {
					try {
						await ensurePlaylistBelongsToUser(ctx, { playlistId: playlistOrder.playlistId, userId: dbUser._id });
						await ctx.db.patch(playlistOrder.playlistId, { order: playlistOrder.order });
					} catch (e) {
						console.warn("[@/convex/playlists/mutations.ts]: reorderPlaylist() => error", e);
					}
				}),
			);
			return { success: true };
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return null;
				}
			}
			console.warn("[@/convex/playlists/mutations.ts]: reorderPlaylist() => error", e);
			return { success: false };
		}
	},
});
