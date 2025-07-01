import { v } from "convex/values";
import { api } from "./_generated/api";
import { query } from "./_generated/server";
import { StoryExtended, StoryPreview } from "./schema/stories.schema";

export const getImageUrl = query({
	args: {
		imageId: v.id("images"),
	},
	handler: async (ctx, { imageId }) => {
		const image = await ctx.db.get(imageId);
		if (!image) {
			return null;
		}
		return await ctx.storage.getUrl(image.storageId);
	},
});

export const getAudioUrl = query({
	args: {
		audioId: v.id("audio"),
	},
	handler: async (ctx, { audioId }) => {
		const audio = await ctx.db.get(audioId);
		if (!audio) {
			return null;
		}
		return await ctx.storage.getUrl(audio.storageId);
	},
});

export const getFreeStories = query({
	handler: async (ctx): Promise<StoryPreview[]> => {
		const stories = await ctx.db
			.query("stories")
			.withIndex("by_subscription_required", (q) => q.eq("subscription_required", false))
			.filter((q) => q.eq(q.field("enabled"), true))
			.collect();

		return await Promise.all(
			stories.map(async (story) => {
				const [imageUrl, audioUrl] = await Promise.all([
					ctx.runQuery(api.stories.getImageUrl, { imageId: story.imageId }),
					ctx.runQuery(api.stories.getAudioUrl, { audioId: story.audioId }),
				]);
				const duration = story.transcript[story.transcript.length - 1].end_time;
				return {
					_id: story._id,
					title: story.title,
					imageUrl,
					audioUrl,
					duration,
					updatedAt: story.updatedAt,
				};
			}),
		);
	},
});

export const getStory = query({
	args: {
		storyId: v.id("stories"),
	},
	handler: async (ctx, { storyId }): Promise<StoryExtended | null> => {
		const maybeStory = await ctx.db.get(storyId);
		if (!maybeStory) {
			return null;
		}
		const [imageUrl, audioUrl] = await Promise.all([
			ctx.runQuery(api.stories.getImageUrl, { imageId: maybeStory.imageId }),
			ctx.runQuery(api.stories.getAudioUrl, { audioId: maybeStory.audioId }),
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
