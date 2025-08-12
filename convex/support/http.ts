import { internal } from "@/convex/_generated/api";
import { httpAction } from "@/convex/_generated/server";
import { z } from "zod";

const bodySchema = z.object({
	email: z.string().email(),
	body: z.string(),
	title: z.string(),
});

export const createSupportRequestHttp = httpAction(async (ctx, req) => {
	const headers = req.headers;
	const xApiKey = headers.get("x-api-key");
	if (xApiKey !== process.env.LANDING_PAGE_API_KEY) {
		return new Response("Unauthorized", { status: 401 });
	}
	const postBody = await req.json();
	const safeBody = bodySchema.safeParse(postBody);
	if (!safeBody.success) {
		return Response.json({ error: "Invalid request body", data: safeBody.error }, { status: 400 });
	}
	const { email, body, title } = safeBody.data;
	try {
		const supportRequest = await ctx.runMutation(internal.support.mutations.createSupportRequest, {
			email,
			body,
			title,
		});
		return Response.json({ success: true, data: supportRequest }, { status: 200 });
	} catch (e) {
		console.error("[convex/support/http.ts] Error creating support request", e);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
});
