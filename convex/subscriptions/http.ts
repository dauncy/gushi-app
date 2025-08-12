import { httpAction } from "@/convex/_generated/server";
import { internal } from "../_generated/api";
import { bustCustomerCache, getCustomerCached } from "./actions";
import { getaSubscriptionType } from "./utils";

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
		event: {
			app_user_id: string;
			aliases: string[];
			original_app_user_id: string;
		};
	} = await req.json();
	try {
		await Promise.all(
			[...body.event.aliases, body.event.original_app_user_id, body.event.app_user_id].map(async (alias) => {
				console.log("subscriptionWebhooksHttpAction:() => busting cache for", alias);
				await bustCustomerCache(ctx, { revenuecatUserId: alias });
				const customer = await getCustomerCached(ctx, { revenuecatUserId: alias });
				const subscriptionType = getaSubscriptionType(customer);
				await ctx.runMutation(internal.users.mutations.upsertIfExists, {
					revenuecatUserId: alias,
					subscriptionType: subscriptionType,
				});
				console.log("subscriptionWebhooksHttpAction:() => upserted user", alias, subscriptionType);
			}),
		);
	} catch (e) {
		console.warn("subscriptionWebhooksHttpAction:() => error busting cache", e);
	}

	return new Response("OK", { status: 200 });
});
