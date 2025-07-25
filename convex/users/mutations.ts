import { Doc } from "@/convex/_generated/dataModel";
import { zodToConvex } from "convex-helpers/server/zod";
import { z } from "zod";
import { internalMutation } from "../_generated/server";
import { SubscriptionType } from "./schema";

export const upsertUser = internalMutation({
	args: zodToConvex(
		z.object({
			revenuecatUserId: z.string(),
			subscriptionType: SubscriptionType.optional().nullable(),
		}),
	),
	handler: async (ctx, args) => {
		const { revenuecatUserId } = args;
		const exists = await ctx.db
			.query("users")
			.withIndex("by_revenuecat_user_id", (q) => q.eq("revenuecatUserId", revenuecatUserId))
			.unique();
		if (exists) {
			await ctx.db.patch(exists._id, {
				updatedAt: new Date().toISOString(),
				subscriptionType: args.subscriptionType,
			});
			return ctx.db.get(exists._id) as unknown as Doc<"users">;
		}
		const user = await ctx.db.insert("users", {
			revenuecatUserId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			subscriptionType: args.subscriptionType,
		});
		return (await ctx.db.get(user)) as unknown as Doc<"users">;
	},
});
