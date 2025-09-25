import { Id } from "@/convex/_generated/dataModel";
import { internalQuery, query, QueryCtx } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common";
import { StoryExtended, StoryPreview, StorySubDataPromise } from "@/convex/stories/schema";
import { zid, zodToConvex } from "convex-helpers/server/zod";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";

export const getImageUrl = async (ctx: QueryCtx, imageId: Id<"images">) => {
	const image = await ctx.db.get(imageId);
	if (!image) {
		return { url: null, blurHash: null };
	}
	const url = await ctx.storage.getUrl(image.storageId);
	return {
		url,
		blurHash: image.blurHash ?? null,
	};
};

export const getAudioUrl = async (ctx: QueryCtx, audioId: Id<"audio">) => {
	const audio = await ctx.db.get(audioId);
	if (!audio) {
		return { url: null };
	}
	const url = await ctx.storage.getUrl(audio.storageId);
	return {
		url,
	};
};

export const getStoryCategories = async (ctx: QueryCtx, storyId: Id<"stories">) => {
	const storyCategories = await ctx.db
		.query("storyCategories")
		.withIndex("by_story", (q) => q.eq("storyId", storyId))
		.collect();
	const categories = await Promise.all(
		storyCategories.map(async (storyCategory) => {
			return await ctx.db.get(storyCategory.categoryId);
		}),
	);
	return categories.filter((category): category is NonNullable<typeof category> => Boolean(category));
};

export const getStories = query({
	args: {
		paginationOpts: paginationOptsValidator,
		categoryId: v.optional(v.id("categories")),
	},
	handler: async (ctx, { paginationOpts, categoryId }): Promise<PaginationResult<StoryPreview>> => {
		try {
			const { hasSubscription } = await verifyAccess(ctx, { validateSubscription: false });
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
						const duration = Math.ceil(story.transcript[story.transcript.length - 1].end_time);
						const categories = resolvedPromises.find((promise) => promise.type === "categories")?.data ?? [];
						const imageData = resolvedPromises.find((promise) => promise.type === "image")?.data ?? {
							url: null,
							blurHash: null,
						};
						const audioData = resolvedPromises.find((promise) => promise.type === "audio")?.data ?? { url: null };
						return {
							_id: story._id,
							title: story.title,
							imageUrl: imageData.url,
							audioUrl: audioData.url,
							blurHash: imageData.blurHash,
							duration,
							updatedAt: story.updatedAt,
							subscription_required: !!story.subscription_required,
							featured: !!story.featured,
							description: story.description,
							categories: categories.map((category) => ({ _id: category._id, name: category.name })),
						};
					}),
				);

				return {
					...storyCategories,
					page: stories,
				};
			}

			const storiesPage = await ctx.db
				.query("stories")
				.withIndex("by_featured_enabled", (q) => q.eq("featured", false).eq("enabled", true))
				.paginate(paginationOpts);

			const stories = await Promise.all(
				storiesPage.page.map(async (story) => {
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
					const duration = Math.ceil(story.transcript[story.transcript.length - 1].end_time);
					return {
						_id: story._id,
						title: story.title,
						imageUrl: imageData.url,
						audioUrl: audioData.url,
						blurHash: imageData.blurHash,
						duration,
						updatedAt: story.updatedAt,
						subscription_required: !!story.subscription_required,
						featured: !!story.featured,
						description: story.description,
						categories: categories.map((category) => ({ _id: category._id, name: category.name })),
					};
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
			const { hasSubscription, dbUser } = await verifyAccess(ctx, { validateSubscription: true });
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

			const favorite = await ctx.db
				.query("favorites")
				.withIndex("by_user_story", (q) => q.eq("userId", dbUser._id).eq("storyId", maybeStory._id))
				.first();

			return {
				_id: maybeStory._id,
				title: maybeStory.title,
				imageUrl: imageData.url,
				audioUrl: audioData.url,
				transcript: maybeStory.transcript,
				body: maybeStory.body,
				blurHash: imageData.blurHash,
				updatedAt: maybeStory.updatedAt,
				favorite: favorite
					? {
							_id: favorite._id,
							_createdAt: favorite.createdAt,
						}
					: null,
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
	): Promise<{ title: string; imageUrl: string; duration: number; updatedAt: string } | null> => {
		const story = await ctx.db.get(storyId);
		if (!story) {
			return null;
		}
		const imageData = await getImageUrl(ctx, story.imageId);
		if (!imageData.url) {
			return null;
		}
		const duration = story.transcript[story.transcript.length - 1].end_time;
		return {
			title: story.title,
			imageUrl: imageData.url,
			duration,
			updatedAt: story.updatedAt,
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
		const { hasSubscription } = await verifyAccess(ctx, { validateSubscription: false });
		const story = await ctx.db
			.query("stories")
			.withIndex("by_featured_enabled", (q) => q.eq("featured", true).eq("enabled", true))
			.first();

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
		const imageData = resolvedPromises.find((promise) => promise.type === "image")?.data ?? {
			url: null,
			blurHash: null,
		};
		const audioData = resolvedPromises.find((promise) => promise.type === "audio")?.data ?? { url: null };
		const categories = resolvedPromises.find((promise) => promise.type === "categories")?.data ?? [];
		const duration = Math.ceil(story.transcript[story.transcript.length - 1].end_time);
		return {
			_id: story._id,
			title: story.title,
			imageUrl: imageData.url,
			audioUrl: audioData.url,
			blurHash: imageData.blurHash,
			duration,
			updatedAt: story.updatedAt,
			subscription_required: !!story.subscription_required,
			featured: !!story.featured,
			categories: categories.map((category) => ({ _id: category._id, name: category.name })),
		};
	},
});

export const getFeaturedCategories = query({
	args: {
		take: v.optional(v.number()),
	},
	handler: async (ctx, { take = 3 }) => {
		await verifyAccess(ctx, { validateSubscription: false });
		const categories = await ctx.db
			.query("categories")
			.withIndex("by_featured", (q) => q.eq("featured", true))
			.take(take);
		return categories;
	},
});
