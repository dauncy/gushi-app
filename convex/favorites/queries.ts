import { internalQuery, query } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { StoryPreview, StorySubDataPromise } from "@/convex/stories";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { getAudioUrl, getImageUrl, getStoryCategories } from "../stories/queries";

export const getUserFavorites = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, { paginationOpts }): Promise<PaginationResult<StoryPreview>> => {
		try {
			const { dbUser, hasSubscription } = await verifyAccess(ctx, { validateSubscription: false });
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
					const promises: Promise<StorySubDataPromise>[] = [
						getImageUrl(ctx, story.imageId).then((data) => ({ type: "image", data })),
						getStoryCategories(ctx, story._id).then((data) => ({ type: "categories", data })),
					];

					if (story.subscription_required) {
						if (hasSubscription) {
							promises.push(getAudioUrl(ctx, story.audioId).then((data) => ({ type: "audio", data })));
						} else {
							promises.push(Promise.resolve({ type: "audio", data: { url: null } }));
						}
					} else {
						promises.push(getAudioUrl(ctx, story.audioId).then((data) => ({ type: "audio", data })));
					}

					const resolvedPromises = await Promise.all(promises);
					const categories = resolvedPromises.find((promise) => promise.type === "categories")?.data ?? [];
					const imageData = resolvedPromises.find((promise) => promise.type === "image")?.data ?? {
						url: null,
						blurHash: null,
					};
					const audioData = resolvedPromises.find((promise) => promise.type === "audio")?.data ?? { url: null };

					return {
						_id: story._id,
						title: story.title,
						subscription_required: story.subscription_required,
						imageUrl: imageData.url,
						audioUrl: audioData.url,
						blurHash: imageData.blurHash,
						updatedAt: story.updatedAt,
						duration: story.transcript[story.transcript.length - 1]?.end_time ?? 0,
						favorite: {
							_id: fav._id,
							_createdAt: fav.createdAt,
						},
						featured: !!story.featured,
						categories: categories.map((category) => ({ _id: category._id, name: category.name })),
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
