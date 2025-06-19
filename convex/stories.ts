import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { StoryPreview } from "./schema/stories.schema";

export const getFreeStories = query({
	handler: async (ctx): Promise<StoryPreview[]> => {
		const getImageUrl = async (imageId: Id<"images">) => {
			const image = await ctx.db.get(imageId);
			if (!image) {
				return null;
			}
			return await ctx.storage.getUrl(image.storageId);
		};

		const getAudioUrl = async (audioId: Id<"audio">) => {
			const audio = await ctx.db.get(audioId);
			if (!audio) {
				return null;
			}
			return await ctx.storage.getUrl(audio.storageId);
		};

		const stories = await ctx.db
			.query("stories")
			.withIndex("by_subscription_required", (q) => q.eq("subscription_required", false))
			.filter((q) => q.eq(q.field("enabled"), true))
			.collect();

		return await Promise.all(
			stories.map(async (story) => {
				const [imageUrl, audioUrl] = await Promise.all([getImageUrl(story.imageId), getAudioUrl(story.audioId)]);
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
