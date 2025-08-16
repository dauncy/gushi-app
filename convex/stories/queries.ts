import { Id } from "@/convex/_generated/dataModel";
import { internalQuery, query, QueryCtx } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common";
import { StoryExtended, StoryPreview } from "@/convex/stories/schema";
import { zid, zodToConvex } from "convex-helpers/server/zod";
import { paginationOptsValidator, PaginationResult } from "convex/server";

export const getImageUrl = async (ctx: QueryCtx, imageId: Id<"images">) => {
	const image = await ctx.db.get(imageId);
	if (!image) {
		return null;
	}
	return await ctx.storage.getUrl(image.storageId);
};

export const getAudioUrl = async (ctx: QueryCtx, audioId: Id<"audio">) => {
	const audio = await ctx.db.get(audioId);
	if (!audio) {
		return null;
	}
	return await ctx.storage.getUrl(audio.storageId);
};

export const getStories = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, { paginationOpts }): Promise<PaginationResult<StoryPreview>> => {
		try {
			const { hasSubscription } = await verifyAccess(ctx, { validateSubscription: false });
			const storiesPage = await ctx.db
				.query("stories")
				.withIndex("by_featured_enabled", (q) => q.eq("featured", false).eq("enabled", true))
				.paginate(paginationOpts);

			const stories = await Promise.all(
				storiesPage.page.map(async (story) => {
					const promises: Promise<string | null>[] = [getImageUrl(ctx, story.imageId)];
					if (story.subscription_required) {
						if (hasSubscription) {
							promises.push(getAudioUrl(ctx, story.audioId));
						} else {
							promises.push(Promise.resolve(null));
						}
					} else {
						promises.push(getAudioUrl(ctx, story.audioId));
					}
					const [imageUrl, audioUrl] = await Promise.all(promises);
					const duration = Math.ceil(story.transcript[story.transcript.length - 1].end_time);
					return {
						_id: story._id,
						title: story.title,
						imageUrl,
						audioUrl,
						duration,
						updatedAt: story.updatedAt,
						subscription_required: !!story.subscription_required,
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

			const [imageUrl, audioUrl] = await Promise.all([
				getImageUrl(ctx, maybeStory.imageId),
				getAudioUrl(ctx, maybeStory.audioId),
			]);
			if (!imageUrl || !audioUrl) {
				return null;
			}

			const favorite = await ctx.db
				.query("favorites")
				.withIndex("by_user_story", (q) => q.eq("userId", dbUser._id).eq("storyId", maybeStory._id))
				.first();

			return {
				_id: maybeStory._id,
				title: maybeStory.title,
				imageUrl,
				audioUrl,
				transcript: maybeStory.transcript,
				body: maybeStory.body,
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
		const imageUrl = await getImageUrl(ctx, story.imageId);
		if (!imageUrl) {
			return null;
		}
		const duration = story.transcript[story.transcript.length - 1].end_time;
		return {
			title: story.title,
			imageUrl,
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
		const promises: Promise<string | null>[] = [getImageUrl(ctx, story.imageId)];
		if (story.subscription_required) {
			if (hasSubscription) {
				promises.push(getAudioUrl(ctx, story.audioId));
			} else {
				promises.push(Promise.resolve(null));
			}
		} else {
			promises.push(getAudioUrl(ctx, story.audioId));
		}
		const [imageUrl, audioUrl] = await Promise.all(promises);
		const duration = Math.ceil(story.transcript[story.transcript.length - 1].end_time);
		return {
			_id: story._id,
			title: story.title,
			imageUrl,
			audioUrl,
			duration,
			updatedAt: story.updatedAt,
			subscription_required: !!story.subscription_required,
		};
	},
});
