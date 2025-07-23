import { internal } from "@/convex/_generated/api";
import { mutation } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { ConvexError, v } from "convex/values";

export const bustSubscriptionCache = mutation({
	args: {
		revenueCatId: v.string(),
	},
	handler: async (ctx, args) => {
		const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
		const { revenueCatId } = args;

		if (dbUser.revenuecatUserId !== revenueCatId) {
			throw new ConvexError("Unauthorized");
		}

		await ctx.scheduler.runAfter(0, internal.subscriptions.actions.bustCustomerCache, {
			revenuecatUserId: revenueCatId,
		});

		return {
			success: true,
		};
	},
});
