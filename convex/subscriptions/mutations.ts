import { internal } from "@/convex/_generated/api";
import { action, internalMutation } from "@/convex/_generated/server";
import { RevenueCatCustomer } from "@/lib/types";
import { zodToConvex } from "convex-helpers/server/zod";
import { ConvexError, v } from "convex/values";
import { z } from "zod";
import { bustCustomerCache } from "./actions";
import { getaSubscriptionType } from "./utils";

export const bustSubscriptionCache = action({
	args: {
		revenueCatId: v.string(),
	},
	handler: async (ctx, args): Promise<{ success: boolean; customer: RevenueCatCustomer }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Unauthorized");
		}
		const customerFromJWT = await ctx.runAction(internal.subscriptions.actions.getCustomerAction, {
			revenuecatUserId: identity.subject,
		});
		const customerFromRevenueCat = await ctx.runAction(internal.subscriptions.actions.getCustomerAction, {
			revenuecatUserId: args.revenueCatId,
		});

		if (customerFromJWT.id !== customerFromRevenueCat.id) {
			throw new ConvexError("Customer IDs do not match");
		}

		const subscriptionType = getaSubscriptionType(customerFromRevenueCat);

		const customerAliases = await ctx.runAction(internal.subscriptions.actions.getCustomerAliasesAction, {
			customerId: customerFromJWT.id,
		});

		await ctx.runMutation(internal.subscriptions.mutations.syncAliases, {
			currentRevenueCatUserId: customerFromJWT.id,
			aliases: customerAliases,
			subscriptionType,
		});

		await Promise.all(
			customerAliases.map(async (alias) => {
				await bustCustomerCache(ctx, { revenuecatUserId: alias.id });
			}),
		);

		return {
			success: true,
			customer: customerFromRevenueCat,
		};
	},
});

export const syncAliases = internalMutation({
	args: zodToConvex(
		z.object({
			currentRevenueCatUserId: z.string(),
			aliases: z.array(
				z.object({
					created_at: z.number(),
					id: z.string(),
					object: z.literal("customer.alias"),
				}),
			),
			subscriptionType: z.enum(["lifetime", "monthly"]).nullable(),
		}),
	),
	handler: async (ctx, { currentRevenueCatUserId, aliases, subscriptionType }) => {
		const dbUserForCurrentRevenueCatUserId = await ctx.db
			.query("users")
			.withIndex("by_revenuecat_user_id", (q) => q.eq("revenuecatUserId", currentRevenueCatUserId))
			.unique();
		if (!dbUserForCurrentRevenueCatUserId) {
			throw new ConvexError("User not found");
		}

		await ctx.db.patch(dbUserForCurrentRevenueCatUserId._id, {
			subscriptionType: subscriptionType,
		});

		await Promise.all(
			aliases.map(async (alias) => {
				const dbUser = await ctx.db
					.query("users")
					.withIndex("by_revenuecat_user_id", (q) => q.eq("revenuecatUserId", alias.id))
					.unique();
				if (!dbUser) {
					return null;
				}
				const favorites = await ctx.db
					.query("favorites")
					.withIndex("by_user", (q) => q.eq("userId", dbUser._id))
					.collect();
				await Promise.all(
					favorites.map(async (favorite) => {
						const maybeFavorite = await ctx.db
							.query("favorites")
							.withIndex("by_user_story", (q) =>
								q.eq("userId", dbUserForCurrentRevenueCatUserId._id).eq("storyId", favorite.storyId),
							)
							.unique();
						if (maybeFavorite) {
							return;
						}
						await ctx.db.insert("favorites", {
							userId: dbUserForCurrentRevenueCatUserId._id,
							storyId: favorite.storyId,
							createdAt: new Date(favorite.createdAt).toISOString(),
						});

						await ctx.db.delete(favorite._id);
					}),
				);
				await ctx.db.delete(dbUser._id);
			}),
		);

		return dbUserForCurrentRevenueCatUserId;
	},
});
