import { internalQuery, query } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { StoryPreview } from "@/convex/stories";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { getAudioUrl, getImageUrl } from "../stories/queries";

export const getUserFavorites = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, { paginationOpts }): Promise<PaginationResult<StoryPreview>> => {
		try {
			const { dbUser } = await verifyAccess(ctx, { validateSubscription: true });
			const userFavorites = await ctx.db
				.query("favorites")
				.withIndex("by_user", (q) => q.eq("userId", dbUser._id))
				.paginate(paginationOpts);
			const stories = await Promise.all(
				userFavorites.page.map(async (fav) => {
					const story = await ctx.db.get(fav.storyId);
					if (!story) {
						return null;
					}

					const [imageData, audioData] = await Promise.all([
						getImageUrl(ctx, story.imageId),
						getAudioUrl(ctx, story.audioId),
					]);

					if (!imageData.url || !audioData.url) {
						return null;
					}

					return {
						_id: story._id,
						title: story.title,
						subscription_required: story.subscription_required,
						imageUrl: imageData.url,
						audioUrl: audioData.url,
						blurHash: imageData.blurHash,
						updatedAt: story.updatedAt,
						duration: story.transcript[story.transcript.length - 1].end_time,
						favorite: {
							_id: fav._id,
							_createdAt: fav.createdAt,
						},
					};
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
