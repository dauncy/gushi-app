import { mutation } from "./_generated/server";
import { StoryPublic } from "./schema/stories.schema";

export const getFreeStories = mutation({
	handler: async (ctx): Promise<StoryPublic[]> => {
		const stories = await ctx.db
			.query("stories")
			.withIndex("by_subscription_required", (q) => q.eq("subscription_required", false))
			.filter((q) => q.eq(q.field("enabled"), true))
			.collect();
		return stories.map((story) => {
			return {
				_id: story._id,
				title: story.title,
				imageId: story.imageId,
				audioId: story.audioId,
				createdAt: story.createdAt,
				updatedAt: story.updatedAt,
			};
		});
	},
});
