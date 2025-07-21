import { mutation } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { zid, zodToConvex } from "convex-helpers/server/zod";
import { z } from "zod";

export const toggleFavorite = mutation({
	args: zodToConvex(
		z.object({
			storyId: zid("stories"),
		}),
	),
	handler: async (ctx, { storyId }) => {
		const { dbUser } = await verifyAccess(ctx, { validateSubscription: true });
		const maybeExists = await ctx.db
			.query("favorites")
			.withIndex("by_user_story", (q) => q.eq("userId", dbUser._id).eq("storyId", storyId))
			.first();

		if (maybeExists) {
			await ctx.db.delete(maybeExists._id);
		} else {
			await ctx.db.insert("favorites", {
				storyId,
				userId: dbUser._id,
				createdAt: new Date().toISOString(),
			});
		}
	},
});
