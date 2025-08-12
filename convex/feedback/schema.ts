import { zid, zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";

export const feedback = defineTable(
	zodToConvex(
		z.object({
			type: z.enum(["feature", "issue"]),
			body: z.string(),
			title: z.string(),
			email: z.string().email().optional().nullable(),
			createdAt: z.string().datetime(),
			userId: zid("users"),
		}),
	),
).index("by_user", ["userId"]);
