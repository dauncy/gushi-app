import { internalMutation } from "@/convex/_generated/server";
import { zodToConvex } from "convex-helpers/server/zod";
import { z } from "zod";

export const createSupportRequest = internalMutation({
	args: zodToConvex(
		z.object({
			body: z.string(),
			title: z.string(),
			email: z.string().email().optional().nullable(),
		}),
	),
	handler: async (ctx, args) => {
		const { email, body, title } = args;
		const supportRequest = await ctx.db.insert("support", {
			email,
			body,
			title,
			createdAt: new Date().toISOString(),
		});
		return supportRequest;
	},
});
