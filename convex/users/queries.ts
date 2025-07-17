import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getUserById = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

export const getUserByRevenuecatUserId = internalQuery({
	args: {
		revenuecatUserId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_revenuecat_user_id", (q) => q.eq("revenuecatUserId", args.revenuecatUserId))
			.unique();
	},
});
