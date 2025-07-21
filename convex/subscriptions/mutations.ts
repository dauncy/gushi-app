import { mutation } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { zodToConvex } from "convex-helpers/server/zod";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { internal } from "../_generated/api";

export const bustSubscriptionCache = mutation({
	args: zodToConvex(
		z.object({
			revenueCatId: z.string(),
		}),
	),
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
