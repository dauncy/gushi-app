import { Doc } from "@/convex/_generated/dataModel";
import { internalMutation, mutation } from "@/convex/_generated/server";
import { zodToConvex } from "convex-helpers/server/zod";
import { z } from "zod";
import { verifyAccess } from "../common";
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

export const upsertIfExists = internalMutation({
	args: zodToConvex(
		z.object({
			revenuecatUserId: z.string(),
			subscriptionType: SubscriptionType.optional().nullable(),
		}),
	),
	handler: async (ctx, args) => {
		const exists = await ctx.db
			.query("users")
			.withIndex("by_revenuecat_user_id", (q) => q.eq("revenuecatUserId", args.revenuecatUserId))
			.unique();
		if (exists) {
			await ctx.db.patch(exists._id, {
				updatedAt: new Date().toISOString(),
				subscriptionType: args.subscriptionType,
			});
		}
		return null;
	},
});

export const resetAppData = mutation({
	args: {},
	handler: async (ctx) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const [favs, feedback] = await Promise.all([
				ctx.db
					.query("favorites")
					.withIndex("by_user", (q) => q.eq("userId", dbUser._id))
					.collect(),
				ctx.db
					.query("feedback")
					.withIndex("by_user", (q) => q.eq("userId", dbUser._id))
					.collect(),
			]);
			const allIds = [...favs.map((f) => f._id), ...feedback.map((f) => f._id)];
			await Promise.all(allIds.map((id) => ctx.db.delete(id)));
			return null;
		} catch (e) {
			console.warn("resetAppData:() => error", e);
			return null;
		}
	},
});
