import { Id } from "@/convex/_generated/dataModel";
import { query, QueryCtx } from "@/convex/_generated/server";
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
		const { hasSubscription } = await verifyAccess(ctx, { validateSubscription: false });
		const storiesPage = await ctx.db
			.query("stories")
			.withIndex("by_enabled", (q) => q.eq("enabled", true))
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
				const duration = story.transcript[story.transcript.length - 1].end_time;
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
	},
});

export const getStory = query({
	args: {
		storyId: zodToConvex(zid("stories").nullable()),
	},
	handler: async (ctx, { storyId }): Promise<StoryExtended | null> => {
		const { hasSubscription, dbUser } = await verifyAccess(ctx, { validateSubscription: true });
		if (!storyId) {
			return null;
		}
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
	},
});
