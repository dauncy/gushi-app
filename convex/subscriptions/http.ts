import { httpAction } from "@/convex/_generated/server";
import { bustCustomerCache } from "./actions";

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
	const body: {
		app_user_id: string;
		aliases: string[];
		original_app_user_id: string;
	} = await req.json();
	console.log("subscriptionWebhooksHttpAction:() => body", body);
	try {
		await Promise.all(
			[...body.aliases, body.original_app_user_id, body.app_user_id].map(async (alias) => {
				console.log("subscriptionWebhooksHttpAction:() => busting cache for", alias);
				await bustCustomerCache(ctx, { revenuecatUserId: alias });
			}),
		);
	} catch (e) {
		console.warn("subscriptionWebhooksHttpAction:() => error busting cache", e);
	}

	return new Response("OK", { status: 200 });
});
