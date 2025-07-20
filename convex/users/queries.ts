import { v } from "convex/values";
import { internalQuery, QueryCtx } from "../_generated/server";

export const getUserById = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

export const getUser = async (ctx: QueryCtx, { revenuecatUserId }: { revenuecatUserId: string }) => {
	const user = await ctx.db
		.query("users")
		.withIndex("by_revenuecat_user_id", (q) => q.eq("revenuecatUserId", revenuecatUserId))
		.unique();
	return user;
};

export const getUserByRevenuecatUserId = internalQuery({
	args: {
		revenuecatUserId: v.string(),
	},
	handler: async (ctx, args) => {
		return await getUser(ctx, args);
	},
});
