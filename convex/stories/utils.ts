import { Doc, Id } from "@/convex/_generated/dataModel";
import { QueryCtx } from "@/convex/_generated/server";
import { verifyAccess } from "@/convex/common/utils";
import { StoryPreview, StorySubDataPromise } from "./schema";

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

export const storyDocToStoryPreview = async (ctx: QueryCtx, story: Doc<"stories">): Promise<StoryPreview> => {
	const { hasSubscription } = await verifyAccess(ctx, { validateSubscription: false });
	const subscriptionRequired = story.subscription_required;
	const storyPromises: Promise<StorySubDataPromise>[] = [
		getImageUrl(ctx, story.imageId).then((data) => ({ type: "image", data })),
		getStoryCategories(ctx, story._id).then((data) => ({ type: "categories", data })),
	];
	if (subscriptionRequired) {
		if (hasSubscription) {
			storyPromises.push(getAudioUrl(ctx, story.audioId).then((data) => ({ type: "audio", data })));
		}
	} else {
		storyPromises.push(getAudioUrl(ctx, story.audioId).then((data) => ({ type: "audio", data })));
	}

	const resolvedPromises = await Promise.all(storyPromises);
	const categories = resolvedPromises.find((promise) => promise.type === "categories")?.data ?? [];
	const imageData = resolvedPromises.find((promise) => promise.type === "image")?.data ?? {
		url: null,
		blurHash: null,
	};
	const audioData = resolvedPromises.find((promise) => promise.type === "audio")?.data ?? { url: null };
	const duration = Math.ceil(story.transcript[story.transcript.length - 1]?.end_time ?? 0);
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
		tags: story.tags ?? [],
		age_range: story.age_range,
		learning_themes: story.learning_themes ?? [],
	};
};
