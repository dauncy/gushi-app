import { zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";

export const stories = defineTable(
	zodToConvex(
		z.object({
			title: z.string(),
			body: z.string(),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
		}),
	),
);
