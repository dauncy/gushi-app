import { mutation } from "@/convex/_generated/server";
import { zodToConvex } from "convex-helpers/server/zod";
import { z } from "zod";
import { verifyAccess } from "../common";

export const createFeedback = mutation({
	args: zodToConvex(
		z.object({
			type: z.enum(["feature", "issue"]),
			title: z.string(),
			body: z.string(),
			email: z.string().email().optional().nullable(),
		}),
	),
	handler: async (ctx, args) => {
		const { dbUser } = await verifyAccess(ctx, { validateSubscription: true });
		const { type, title, body, email } = args;

		const feedback = await ctx.db.insert("feedback", {
			type,
			title,
			body,
			email,
			createdAt: new Date().toISOString(),
			userId: dbUser._id,
		});

		return feedback;
	},
});
