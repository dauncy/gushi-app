import { Doc, Id } from "@/convex/_generated/dataModel";
import { Nullable } from "@/lib/types";
import { zid, zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";

export const images = defineTable(
	zodToConvex(
		z.object({
			name: z.string(),
			storageId: zid("_storage"),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			blurHash: z.string().optional(),
		}),
	),
);

export const audio = defineTable(
	zodToConvex(
		z.object({
			name: z.string(),
			storageId: zid("_storage"),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
		}),
	),
);

const wordTranscriptSchema = z.object({
	text: z.string(),
	start_time: z.number(),
	end_time: z.number(),
});

const segmentTranscriptSchema = z.object({
	text: z.string(),
	start_time: z.number(),
	end_time: z.number(),
	words: z.array(wordTranscriptSchema),
});

const storiesSchema = z.object({
	title: z.string(),
	body: z.string(),
	description: z.string().optional(),
	transcript: z.array(segmentTranscriptSchema),
	enabled: z.boolean().default(false),
	subscription_required: z.boolean().default(true),
	featured: z.boolean().default(false),
	imageId: zid("images"),
	audioId: zid("audio"),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type StoryPrivate = z.infer<typeof storiesSchema>;
export type StoryPublic = Omit<
	StoryPrivate,
	"body" | "enabled" | "subscription_required" | "transcript" | "imageId" | "audioId"
> & { imageUrl: Nullable<string>; audioUrl: Nullable<string>; duration: number; blurHash: Nullable<string> };

export type StoryPreview = Omit<
	StoryPrivate,
	"body" | "enabled" | "transcript" | "imageId" | "audioId" | "createdAt"
> & {
	imageUrl: Nullable<string>;
	audioUrl: Nullable<string>;
	duration: number;
	blurHash?: Nullable<string>;
	_id: Id<"stories">;
	categories: { _id: Id<"categories">; name: string }[];
};

export type StoryExtended = Omit<
	StoryPrivate,
	"enabled" | "subscription_required" | "imageId" | "audioId" | "createdAt" | "featured"
> & {
	imageUrl: Nullable<string>;
	audioUrl: Nullable<string>;
	blurHash: Nullable<string>;
	_id: Id<"stories">;
	favorite: null | {
		_id: Id<"favorites">;
		_createdAt: string;
	};
};

export type SegmentTranscript = z.infer<typeof segmentTranscriptSchema>;

export const stories = defineTable(zodToConvex(storiesSchema))
	.index("by_enabled", ["enabled"])
	.index("by_subscription_required", ["subscription_required"])
	.index("by_featured", ["featured"])
	.index("by_featured_enabled", ["featured", "enabled"]);

export const categories = defineTable(
	zodToConvex(
		z.object({
			name: z.string(),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			featured: z.boolean().default(false),
		}),
	),
).index("by_featured", ["featured"]);

export const storyCategories = defineTable(
	zodToConvex(
		z.object({
			storyId: zid("stories"),
			categoryId: zid("categories"),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
		}),
	),
)
	.index("by_story", ["storyId"])
	.index("by_category", ["categoryId"]);

type CategoryPromise = {
	type: "categories";
	data: Doc<"categories">[];
};

type AudioPromise = {
	type: "audio";
	data: { url: string | null };
};

type ImagePromise = {
	type: "image";
	data: { url: string | null; blurHash: string | null };
};

export type StorySubDataPromise = CategoryPromise | AudioPromise | ImagePromise;
