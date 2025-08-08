import { google } from "@/ai/google";
import { components, internal } from "@/convex/_generated/api";
import { ActionCtx, internalAction } from "@/convex/_generated/server";
import { storyPrompt } from "@/prompts/story.prompt";
import { voiceDescriptionPrompt } from "@/prompts/voice-descriptions.prompt";
import { ActionCache } from "@convex-dev/action-cache";
import { generateObject, generateText } from "ai";
import { zodToConvex } from "convex-helpers/server/zod";
import { v } from "convex/values";
import { z } from "zod";
import { Id } from "../_generated/dataModel";

export const generateStoryDescription = internalAction({
	args: {
		storyId: v.id("stories"),
	},
	handler: async (ctx, args): Promise<string> => {
		const body = await ctx.runQuery(internal.stories.queries.getStoryBody, { storyId: args.storyId });
		if (!body) {
			throw new Error("Story not found");
		}

		const { text } = await generateText({
			model: google("gemini-2.5-flash-lite"),
			system: `You are "MetaSummarizer." 
        You will be given a complete bedtime-story, and a prompt to generate a brief description. 
        Respond with ONE line that works as an HTML meta-description.

        Requirements
        • 120-160 characters, including spaces.  
        • Present tense, active voice, warm and inviting.  
        • Mention the main character + core adventure or lesson.  
        • No spoilers
        • No quotes 
        • No line breaks
        • No HTML tags
        • Output ONLY the description text — nothing else.

        ✅ Good Descriptions:
          "Listen along as Bob learns the value of friendship."
          "Join Bob on his journey as he discovers the power of kindness in this heartwarming bedtime story."
        ❌ Bad Description:
          "A story about Bob and his friends."
          "<meta name="description" content="A bedtime story about a boy who discovers the power of kindness."></meta>"
      `,
			prompt: `Generate a brief description for the following story: ${body}`,
		});
		return text;
	},
});

const storyDescriptionCache = new ActionCache(components.actionCache, {
	name: "story-description",
	action: internal.stories.actions.generateStoryDescription,
	ttl: 60 * 60 * 24 * 365,
});

export const getDescription = async (ctx: ActionCtx, { storyId }: { storyId: Id<"stories"> }) => {
	return await storyDescriptionCache.fetch(ctx, { storyId });
};

const storyStranscript = z.object({
	body: z.string(),
	speaker: z.string(),
	voiceInstructions: z.string(),
	gender: z.enum(["male", "female"]),
});

export const generateStory = internalAction({
	args: {
		prompt: v.string(),
	},
	handler: async (ctx, args) => {
		const response = await generateObject({
			model: google("gemini-2.5-flash"),
			schema: z.array(storyStranscript),
			system: storyPrompt,
			prompt: args.prompt,
			temperature: 0.6,
			providerOptions: {
				google: {
					thinkingBudget: -1,
				},
			},
		});
		return response.object;
	},
});

const voiceDescriptionSchema = z.object({
	voice: z.string(),
	description: z.string(),
});

export const generateVoiceDescriptions = internalAction({
	args: zodToConvex(
		z.object({
			transcript: z.array(storyStranscript),
		}),
	),
	handler: async (ctx, args) => {
		const response = await generateObject({
			model: google("gemini-2.5-flash"),
			schema: z.array(voiceDescriptionSchema),
			system: voiceDescriptionPrompt,
			prompt: `
			Generate a voice description for each speaker in the following transcript:
			${JSON.stringify(args.transcript, null, 2)}
			`,
			providerOptions: {
				google: {
					thinkingBudget: -1,
				},
			},
			temperature: 0.6,
		});

		return response.object;
	},
});
