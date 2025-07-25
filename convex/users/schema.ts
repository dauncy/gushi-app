import { zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";

export const SubscriptionType = z.enum(["monthly", "lifetime"]);

export const users = defineTable(
	zodToConvex(
		z.object({
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			revenuecatUserId: z.string(),
			subscriptionType: z.enum(["monthly", "lifetime"]).optional().nullable(),
		}),
	),
).index("by_revenuecat_user_id", ["revenuecatUserId"]);
