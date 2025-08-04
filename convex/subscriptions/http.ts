import { httpAction } from "@/convex/_generated/server";

export const subscriptionWebhooksHttpAction = httpAction(async (ctx, req) => {
	const headers = req.headers;
	const authHeader = headers.get("Authorization");
	if (!authHeader) {
		return new Response("Unauthorized", { status: 401 });
	}
	const token = authHeader.split("Bearer ")[1];
	const verified = token === process.env.REVENUE_CAT_WEBHOOK_API_KEY;
	if (!verified) {
		return new Response("Unauthorized", { status: 401 });
	}
	const body = await req.json();
	console.log("subscriptionWebhooksHttpAction:() => body", body);
	return new Response("OK", { status: 200 });
});
