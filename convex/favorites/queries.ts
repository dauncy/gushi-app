import { internalQuery, query } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { StoryPreview } from "@/convex/stories";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { storyDocToStoryPreview } from "../stories/utils";

export const getUserFavorites = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, { paginationOpts }): Promise<PaginationResult<StoryPreview>> => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
			const userFavorites = await ctx.db
				.query("favorites")
				.withIndex("by_user", (q) => q.eq("userId", dbUser._id))
				.paginate(paginationOpts);
			const stories = await Promise.all(
				userFavorites.page.map(async (favorite) => {
					const story = await ctx.db.get(favorite.storyId);
					if (!story) {
						return null;
					}
					return await storyDocToStoryPreview(ctx, story);
				}),
			);

			return {
				...userFavorites,
				page: stories.filter(Boolean) as StoryPreview[],
			};
		} catch (e) {
			console.warn("[convex/favorites/queries.ts]: getUserFavorites() => error", e);
			return {
				page: [],
				isDone: true,
				continueCursor: "",
			};
		}
	},
});

export const getfavoritesForUserId = internalQuery({
	args: {
		dbUserId: v.id("users"),
	},
	handler: async (ctx, { dbUserId }) => {
		const favorites = await ctx.db
			.query("favorites")
			.withIndex("by_user", (q) => q.eq("userId", dbUserId))
			.collect();
		return favorites;
	},
});

export const getFavoriteStatusByStoryId = query({
	args: {
		storyId: v.id("stories"),
	},
	handler: async (ctx, { storyId }) => {
		const { dbUser } = await verifyAccess(ctx, { validateSubscription: false });
		const favorite = await ctx.db
			.query("favorites")
			.withIndex("by_user_story", (q) => q.eq("userId", dbUser._id).eq("storyId", storyId))
			.first();
		return favorite;
	},
});
