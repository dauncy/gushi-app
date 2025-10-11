import { internalQuery, query } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common";
import { StoryExtended, StoryPreview } from "@/convex/stories/schema";
import { zid, zodToConvex } from "convex-helpers/server/zod";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { ConvexError, v } from "convex/values";
import { getAudioUrl, getImageUrl, storyDocToStoryPreview } from "./utils";

export const getStories = query({
	args: {
		paginationOpts: paginationOptsValidator,
		categoryId: v.optional(v.id("categories")),
		includeFeatured: v.optional(v.boolean()),
	},
	handler: async (
		ctx,
		{ paginationOpts, categoryId, includeFeatured = false },
	): Promise<PaginationResult<StoryPreview>> => {
		try {
			await verifyAccess(ctx, { validateSubscription: false });
			if (categoryId) {
				// first paginate join table
				const storyCategories = await ctx.db
					.query("storyCategories")
					.withIndex("by_category", (q) => q.eq("categoryId", categoryId))
					.paginate(paginationOpts);

				const storiesInit = await Promise.all(
					storyCategories.page.map(async (storyCategory) => {
						const story = await ctx.db.get(storyCategory.storyId);
						if (story?.enabled) {
							return story;
						}
						return null;
					}),
				);

				const storiesPage = storiesInit.filter((story): story is NonNullable<typeof story> => Boolean(story));
				const stories = await Promise.all(
					storiesPage.map(async (story) => {
						return await storyDocToStoryPreview(ctx, story);
					}),
				);

				return {
					...storyCategories,
					page: stories,
				};
			}
			let query = ctx.db
				.query("stories")
				.withIndex("by_featured_enabled", (q) => q.eq("featured", false).eq("enabled", true));

			if (includeFeatured) {
				query = ctx.db.query("stories").withIndex("by_enabled", (q) => q.eq("enabled", true));
			}

			const storiesPage = await query.order("desc").paginate(paginationOpts);

			const stories = await Promise.all(
				storiesPage.page.map(async (story) => {
					return await storyDocToStoryPreview(ctx, story);
				}),
			);

			return {
				...storiesPage,
				page: stories,
			};
		} catch (error) {
			console.warn("[convex/stories/queries.ts]: getStories() => --- ERROR --- ", error);
			return {
				page: [],
				isDone: true,
				continueCursor: "",
			};
		}
	},
});

export const getStory = query({
	args: {
		storyId: zodToConvex(zid("stories").nullable()),
	},
	handler: async (ctx, { storyId }): Promise<StoryExtended | null> => {
		if (!storyId) {
			return null;
		}
		try {
			const { hasSubscription } = await verifyAccess(ctx, { validateSubscription: false });
			const maybeStory = await ctx.db.get(storyId);
			if (!maybeStory) {
				return null;
			}

			if (maybeStory.subscription_required && !hasSubscription) {
				return null;
			}

			const [imageData, audioData] = await Promise.all([
				getImageUrl(ctx, maybeStory.imageId),
				getAudioUrl(ctx, maybeStory.audioId),
			]);
			if (!imageData.url || !audioData.url) {
				return null;
			}

			return {
				_id: maybeStory._id,
				title: maybeStory.title,
				imageUrl: imageData.url,
				audioUrl: audioData.url,
				transcript: maybeStory.transcript,
				body: maybeStory.body,
				blurHash: imageData.blurHash,
				updatedAt: maybeStory.updatedAt,
			};
		} catch (error) {
			console.warn("[convex/stories/queries.ts]: getStory() => --- ERROR --- ", error);
			return null;
		}
	},
});

export const getStoryMetadata = internalQuery({
	args: {
		storyId: zodToConvex(zid("stories")),
	},
	handler: async (
		ctx,
		{ storyId },
	): Promise<{ title: string; imageUrl: string; duration: number; updatedAt: string; description: string } | null> => {
		const story = await ctx.db.get(storyId);
		if (!story) {
			return null;
		}
		const imageData = await getImageUrl(ctx, story.imageId);
		if (!imageData.url) {
			return null;
		}
		const duration = story.transcript[story.transcript.length - 1]?.end_time ?? 0;
		return {
			title: story.title,
			imageUrl: imageData.url,
			duration,
			updatedAt: story.updatedAt,
			description: story.description ?? "",
		};
	},
});

export const getStoryTranscript = internalQuery({
	args: {
		storyId: zodToConvex(zid("stories")),
	},
	handler: async (ctx, { storyId }) => {
		const story = await ctx.db.get(storyId);
		if (!story) {
			return null;
		}
		return story.transcript;
	},
});

export const getStoryBody = internalQuery({
	args: {
		storyId: zodToConvex(zid("stories")),
	},
	handler: async (ctx, { storyId }) => {
		const story = await ctx.db.get(storyId);
		return story?.body;
	},
});

export const getFeaturedStory = query({
	args: {},
	handler: async (ctx): Promise<StoryPreview | null> => {
		try {
			await verifyAccess(ctx, { validateSubscription: false });
			const story = await ctx.db
				.query("stories")
				.withIndex("by_featured_enabled", (q) => q.eq("featured", true).eq("enabled", true))
				.first();

			if (!story) {
				return null;
			}
			return await storyDocToStoryPreview(ctx, story);
		} catch (error) {
			if (error instanceof ConvexError && error.data.toLowerCase().includes("unauthorized")) {
				return null;
			}
			console.warn("[convex/stories/queries.ts]: getFeaturedStory() => --- ERROR --- ", error);
			return null;
		}
	},
});

export const getFeaturedCategories = query({
	args: {
		take: v.optional(v.number()),
	},
	handler: async (ctx, { take = 3 }) => {
		try {
			await verifyAccess(ctx, { validateSubscription: false });
			const categories = await ctx.db
				.query("categories")
				.withIndex("by_featured", (q) => q.eq("featured", true))
				.take(take);
			return categories;
		} catch (error) {
			if (error instanceof ConvexError && error.data.toLowerCase().includes("unauthorized")) {
				return [];
			}
			console.warn("[convex/stories/queries.ts]: getFeaturedCategories() => --- ERROR --- ", error);
			return [];
		}
	},
});

export const searchStories = query({
	args: {
		search: v.string(),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, { search, paginationOpts }): Promise<PaginationResult<StoryPreview>> => {
		try {
			await verifyAccess(ctx, { validateSubscription: false });
			const stories = await ctx.db
				.query("stories")
				.withSearchIndex("story_search", (q) => q.search("body", search).eq("enabled", true))
				.paginate(paginationOpts);
			const storiesPage = await Promise.all(
				stories.page.map(async (story) => {
					return await storyDocToStoryPreview(ctx, story);
				}),
			);
			return {
				page: storiesPage,
				isDone: true,
				continueCursor: "",
			};
		} catch (error) {
			console.warn("[convex/stories/queries.ts]: searchStories() => --- ERROR --- ", error);
			return {
				page: [],
				isDone: true,
				continueCursor: "",
			};
		}
	},
});
