import { Nullable } from "@/lib/types";
import { zid, zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";
import { Id } from "../_generated/dataModel";

export const images = defineTable(
	zodToConvex(
		z.object({
			name: z.string(),
			storageId: zid("_storage"),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
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
	transcript: z.array(segmentTranscriptSchema),
	enabled: z.boolean().default(false),
	subscription_required: z.boolean().default(true),
	imageId: zid("images"),
	audioId: zid("audio"),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type StoryPrivate = z.infer<typeof storiesSchema>;
export type StoryPublic = Omit<
	StoryPrivate,
	"body" | "enabled" | "subscription_required" | "transcript" | "imageId" | "audioId"
> & { imageUrl: Nullable<string>; audioUrl: Nullable<string>; duration: number };

export type StoryPreview = Omit<
	StoryPrivate,
	"body" | "enabled" | "subscription_required" | "transcript" | "imageId" | "audioId" | "createdAt"
> & { imageUrl: Nullable<string>; audioUrl: Nullable<string>; duration: number; _id: Id<"stories"> };

export type StoryExtended = Omit<
	StoryPrivate,
	"enabled" | "subscription_required" | "imageId" | "audioId" | "createdAt"
> & { imageUrl: Nullable<string>; audioUrl: Nullable<string>; _id: Id<"stories"> };

export type SegmentTranscript = z.infer<typeof segmentTranscriptSchema>;

export const stories = defineTable(zodToConvex(storiesSchema))
	.index("by_enabled", ["enabled"])
	.index("by_subscription_required", ["subscription_required"]);
