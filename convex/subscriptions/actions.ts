import { components, internal } from "@/convex/_generated/api";
import { ActionCtx, internalAction } from "@/convex/_generated/server";
import { RevenueCatCustomer } from "@/lib/types";
import { ActionCache } from "@convex-dev/action-cache";
import { v } from "convex/values";
import { getCustomer } from "./utils";

export const getCustomerAction = internalAction({
	args: {
		revenuecatUserId: v.string(),
	},
	handler: async (ctx, args): Promise<RevenueCatCustomer> => {
		const { revenuecatUserId } = args;
		const customer = await getCustomer(revenuecatUserId);
		return customer;
	},
});

const customerCache = new ActionCache(components.actionCache, {
	name: "customerCache",
	ttl: 10 * 60 * 1000,
	action: internal.subscriptions.actions.getCustomerAction,
});

export const getCustomerCachedAction = internalAction({
	args: {
		revenuecatUserId: v.string(),
	},
	handler: async (ctx, args): Promise<RevenueCatCustomer> => {
		return await customerCache.fetch(ctx, { revenuecatUserId: args.revenuecatUserId });
	},
});

export const getCustomerCached = async (ctx: ActionCtx, { revenuecatUserId }: { revenuecatUserId: string }) => {
	console.log("[getCustomerCached]: revenuecatUserId", revenuecatUserId);
	const customer = await customerCache.fetch(ctx, { revenuecatUserId });
	return customer;
};

export const bustCustomerCache = internalAction({
	args: {
		revenuecatUserId: v.string(),
	},
	handler: async (ctx, args): Promise<null> => {
		await customerCache.remove(ctx, { revenuecatUserId: args.revenuecatUserId });
		return null;
	},
});
