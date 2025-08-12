import { v } from "convex/values";
import { internalQuery, query, QueryCtx } from "../_generated/server";
import { verifyAccess } from "../common/utils";

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

export const getUserPublic = query({
	args: {},
	handler: async (ctx, args) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			return dbUser;
		} catch (e) {
			console.warn("[convex/users/queries.ts]: getUserPublic() => error", e);
			return null;
		}
	},
});
