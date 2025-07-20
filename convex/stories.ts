import { zid, zodToConvex } from "convex-helpers/server/zod";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { Id } from "./_generated/dataModel";
import { query, QueryCtx } from "./_generated/server";
import { verifyAccess } from "./common";
import { StoryExtended, StoryPreview } from "./schema/stories.schema";

const HAS_SUBSCRIPTION = false;

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
		const { dbUser, customer } = await verifyAccess(ctx, { validateSubscription: false });
		const storiesPage = await ctx.db
			.query("stories")
			.withIndex("by_enabled", (q) => q.eq("enabled", true))
			.paginate(paginationOpts);

		const stories = await Promise.all(
			storiesPage.page.map(async (story) => {
				const promises: Promise<string | null>[] = [getImageUrl(ctx, story.imageId)];
				if (story.subscription_required) {
					if (HAS_SUBSCRIPTION) {
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
		if (!storyId) {
			return null;
		}
		const maybeStory = await ctx.db.get(storyId);
		if (!maybeStory) {
			return null;
		}

		if (maybeStory.subscription_required && !HAS_SUBSCRIPTION) {
			return null;
		}

		const [imageUrl, audioUrl] = await Promise.all([
			getImageUrl(ctx, maybeStory.imageId),
			getAudioUrl(ctx, maybeStory.audioId),
		]);
		if (!imageUrl || !audioUrl) {
			return null;
		}
		return {
			_id: maybeStory._id,
			title: maybeStory.title,
			imageUrl,
			audioUrl,
			transcript: maybeStory.transcript,
			body: maybeStory.body,
			updatedAt: maybeStory.updatedAt,
		};
	},
});
