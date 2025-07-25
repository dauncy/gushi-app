import { internal } from "@/convex/_generated/api";
import { action } from "@/convex/_generated/server";
import { ConvexError, v } from "convex/values";

export const bustSubscriptionCache = action({
	args: {
		revenueCatId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Unauthorized");
		}
		console.log("[bustSubscriptionCache:() => identity", identity);
		console.log("[bustSubscriptionCache:() => revenueCatId", args.revenueCatId);
		const customerFromJWT = await ctx.runAction(internal.subscriptions.actions.getCustomerAction, {
			revenuecatUserId: identity.subject,
		});
		const customerFromRevenueCat = await ctx.runAction(internal.subscriptions.actions.getCustomerAction, {
			revenuecatUserId: args.revenueCatId,
		});

		console.log("[bustSubscriptionCache:() => customerFromJWT", customerFromJWT);
		console.log("[bustSubscriptionCache:() => customerFromRevenueCat", customerFromRevenueCat);
		return {
			success: true,
		};
	},
});
