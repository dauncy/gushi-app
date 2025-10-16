import { internalMutation, mutation } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
	ensurePlaylistBelongsToUser,
	ensurePlaylistTitleIsUnique,
	getLastPlaylistOrder,
	getLastPlaylistStoryOrder,
} from "./utils";

export const createPlaylist = mutation({
	args: {
		title: v.string(),
		imageId: v.optional(v.id("files")),
	},
	handler: async (ctx, args) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const uniqueTitle = await ensurePlaylistTitleIsUnique(ctx, { title: args.title, userId: dbUser._id });
			if (!uniqueTitle) {
				return { data: null, error: "Playlist with this title already exists" };
			}
			const order = await getLastPlaylistOrder(ctx, dbUser._id);
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

export const reorderPlaylists = mutation({
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

export const addStoriesToPlaylist = mutation({
	args: {
		playlistId: v.id("playlists"),
		storyIds: v.array(v.id("stories")),
	},
	handler: async (ctx, args) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await ensurePlaylistBelongsToUser(ctx, { playlistId: args.playlistId, userId: dbUser._id });
			let order = await getLastPlaylistStoryOrder(ctx, args.playlistId);
			const storyOrders: { order: number; storyId: Id<"stories"> }[] = [];
			for (const storyId of args.storyIds) {
				storyOrders.push({ order: order + 1, storyId });
				order++;
			}
			return await Promise.all(
				storyOrders.map((storyOrder) => {
					return ctx.db.insert("playlistStories", {
						playlistId: args.playlistId,
						storyId: storyOrder.storyId,
						order: storyOrder.order,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
				}),
			);
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return null;
				}
			}
			console.warn("[@/convex/playlists/mutations.ts]: addStoriesToPlaylist() => error", e);
			return null;
		}
	},
});

export const reorderPlaylistStories = mutation({
	args: {
		playlistId: v.id("playlists"),
		storyOrders: v.array(
			v.object({
				playlistStoryId: v.id("playlistStories"),
				order: v.number(),
			}),
		),
	},
	handler: async (ctx, { playlistId, storyOrders }) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await ensurePlaylistBelongsToUser(ctx, { playlistId, userId: dbUser._id });
			await Promise.all(
				storyOrders.map(async (storyOrder) => {
					await ctx.db.patch(storyOrder.playlistStoryId, { order: storyOrder.order });
				}),
			);
			return { success: true };
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return null;
				}
			}
			console.warn("[@/convex/playlists/mutations.ts]: reorderPlaylistStories() => error", e);
			return null;
		}
	},
});

export const updatePlaylist = mutation({
	args: {
		playlistId: v.id("playlists"),
		title: v.string(),
		imageId: v.optional(v.id("files")),
	},
	handler: async (ctx, { playlistId, title, imageId }) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await ensurePlaylistBelongsToUser(ctx, { playlistId, userId: dbUser._id });
			const uniqueTitle = await ensurePlaylistTitleIsUnique(ctx, { title, userId: dbUser._id, playlistId });
			if (!uniqueTitle) {
				return { data: null, error: "Playlist with this title already exists" };
			}
			await ctx.db.patch(playlistId, { name: title, imageId });
			return { data: playlistId, error: null };
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return { data: null, error: null };
				}
			}
			console.warn("[@/convex/playlists/mutations.ts]: updatePlaylist() => error", e);
			return { data: null, error: "Internal server error" };
		}
	},
});

export const deletePlaylistStories = internalMutation({
	args: {
		playlistId: v.id("playlists"),
	},
	handler: async (ctx, { playlistId }) => {
		const playlistStories = await ctx.db
			.query("playlistStories")
			.withIndex("by_playlist_id", (q) => q.eq("playlistId", playlistId))
			.collect();
		await Promise.all(playlistStories.map((playlistStory) => ctx.db.delete(playlistStory._id)));
		return null;
	},
});

export const reorderPlaylistOrders = internalMutation({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, { userId }) => {
		// Fetch in sorted order by (userId, order)
		const items = await ctx.db
			.query("playlists")
			.withIndex("by_user_order", (q) => q.eq("userId", userId))
			.collect();

		// Reassign contiguous orders [0..n-1], preserving relative order
		const updates: Promise<void>[] = [];
		for (let i = 0; i < items.length; i++) {
			const p = items[i];
			if (!p) continue;
			if (p.order !== i) {
				updates.push(
					ctx.db.patch(p._id, {
						order: i,
						// optional: bump updatedAt if you track reorders as updates
						updatedAt: new Date().toISOString(),
					}),
				);
			}
		}

		if (updates.length) {
			await Promise.all(updates);
		}

		return { total: items.length, changed: updates.length };
	},
});

export const deletePlaylist = mutation({
	args: {
		playlistId: v.id("playlists"),
	},
	handler: async (ctx, { playlistId }) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await ensurePlaylistBelongsToUser(ctx, { playlistId, userId: dbUser._id });
			await ctx.db.delete(playlistId);
			await Promise.all([
				ctx.scheduler.runAfter(0, internal.playlists.mutations.reorderPlaylistOrders, { userId: dbUser._id }),
				ctx.scheduler.runAfter(0, internal.playlists.mutations.deletePlaylistStories, { playlistId }),
			]);
			return null;
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return null;
				}
				if (e.data.toLowerCase().includes("playlist not found")) {
					return null;
				}
				if (e.data.toLowerCase().includes("playlist does not belong to user")) {
					return null;
				}
			}
			console.warn("[@/convex/playlists/mutations.ts]: deletePlaylist() => error", e);
			return null;
		}
	},
});

export const reorderPlaylistStoriesOrders = internalMutation({
	args: {
		playlistId: v.id("playlists"),
	},
	handler: async (ctx, { playlistId }) => {
		const playlistStories = await ctx.db
			.query("playlistStories")
			.withIndex("by_playlist_id_order", (q) => q.eq("playlistId", playlistId))
			.order("asc")
			.collect();

		const updates: Promise<void>[] = [];
		for (let i = 0; i < playlistStories.length; i++) {
			const playlistStory = playlistStories[i];
			if (!playlistStory) continue;
			if (playlistStory.order !== i) {
				updates.push(ctx.db.patch(playlistStory._id, { order: i }));
			}
		}
		if (updates.length) {
			await Promise.all(updates);
		}
		return null;
	},
});

export const removePlaylistStoryFromPlaylist = mutation({
	args: {
		playlistId: v.id("playlists"),
		playlistStoryId: v.id("playlistStories"),
	},
	handler: async (ctx, { playlistId, playlistStoryId }) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			await ensurePlaylistBelongsToUser(ctx, { playlistId, userId: dbUser._id });
			await ctx.db.delete(playlistStoryId);
			await ctx.scheduler.runAfter(0, internal.playlists.mutations.reorderPlaylistStoriesOrders, { playlistId });
			return null;
		} catch (e) {
			if (e instanceof ConvexError) {
				if (e.data.toLowerCase().includes("unauthorized")) {
					return null;
				}
				if (e.data.toLowerCase().includes("playlist not found")) {
					return null;
				}
				if (e.data.toLowerCase().includes("playlist does not belong to user")) {
					return null;
				}
			}
			console.warn("[@/convex/playlists/mutations.ts]: removePlaylistStoryFromPlaylist() => error", e);
			return null;
		}
	},
});
