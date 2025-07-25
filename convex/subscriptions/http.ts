import { internal } from "@/convex/_generated/api";
import { httpAction } from "@/convex/_generated/server";
import { getaSubscriptionType } from "./utils";

export const revalidateCustomerHttpAction = httpAction(async (ctx, req) => {
	const { revenuecat_customer_id } = await req.json();
	const userIdentity = await ctx.auth.getUserIdentity();
	console.log("revalidateCustomerHttpAction:() => userIdentity", userIdentity);
	console.log("revalidateCustomerHttpAction:() => revenuecat_customer_id", revenuecat_customer_id);

	if (!revenuecat_customer_id) {
		return new Response("Missing revenuecat_customer_id", { status: 400 });
	}

	await ctx.runAction(internal.subscriptions.actions.bustCustomerCache, {
		revenuecatUserId: revenuecat_customer_id,
	});

	const customerNoCache = await ctx.runAction(internal.subscriptions.actions.getCustomerAction, {
		revenuecatUserId: revenuecat_customer_id,
	});
	const subscriptionType = getaSubscriptionType(customerNoCache);

	await ctx.runMutation(internal.users.mutations.upsertUser, {
		revenuecatUserId: revenuecat_customer_id,
		subscriptionType,
	});

	return Response.json({ customer: customerNoCache }, { status: 200 });
});

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
