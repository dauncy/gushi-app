import { zid, zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";
import { Doc } from "../_generated/dataModel";

export const playlists = defineTable(
	zodToConvex(
		z.object({
			userId: zid("users"),
			order: z.number(),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			name: z.string(),
			imageId: zid("files").optional(),
		}),
	),
)
	.index("by_user_id", ["userId"])
	.index("by_user_order", ["userId", "order"])
	.index("by_user_title", ["userId", "name"]);

export const playlistStories = defineTable(
	zodToConvex(
		z.object({
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			order: z.number(),
			playlistId: zid("playlists"),
			storyId: zid("stories"),
		}),
	),
).index("by_playlist_id", ["playlistId"]);

export type PlaylistPreview = Doc<"playlists"> & {
	image: string | null;
	numStories: number;
};
