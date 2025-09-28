import { mutation } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { zid, zodToConvex } from "convex-helpers/server/zod";
import { z } from "zod";

export const toggleFavorite = mutation({
	args: zodToConvex(
		z.object({
			storyId: zid("stories"),
			favorite: z.boolean(),
		}),
	),
	handler: async (ctx, { storyId, favorite }) => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const maybeExists = await ctx.db
				.query("favorites")
				.withIndex("by_user_story", (q) => q.eq("userId", dbUser._id).eq("storyId", storyId))
				.first();

			// if user wants to favorite and already favorited
			if (favorite && maybeExists) {
				// already favorited
				return null;
			}

			// if user passes in un-favorite and already favorited, delete
			if (maybeExists && !favorite) {
				await ctx.db.delete(maybeExists._id);
				return null;
			}

			// if user passes in un-favorite and not favorited, do nothing
			if (!favorite) {
				return null;
			}

			// if user passes in favorite and not favorited, create
			await ctx.db.insert("favorites", {
				storyId,
				userId: dbUser._id,
				createdAt: new Date().toISOString(),
			});
			return null;
		} catch (e) {
			console.warn("[convex/favorites/mutations.ts]: toggleFavorite() => error", e);
			return null;
		}
	},
});
