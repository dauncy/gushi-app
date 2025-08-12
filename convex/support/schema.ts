import { zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";

export const support = defineTable(
	zodToConvex(
		z.object({
			body: z.string(),
			title: z.string(),
			email: z.string().email().optional().nullable(),
			createdAt: z.string().datetime(),
		}),
	),
)
	.index("by_em", ["email"])
	.index("by_createdAt", ["createdAt"]);
