import { zid, zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";

export const favorites = defineTable(
	zodToConvex(
		z.object({
			storyId: zid("stories"),
			userId: zid("users"),
			createdAt: z.string().datetime(),
		}),
	),
)
	.index("by_user", ["userId"])
	.index("by_story", ["storyId"])
	.index("by_user_story", ["userId", "storyId"]);
