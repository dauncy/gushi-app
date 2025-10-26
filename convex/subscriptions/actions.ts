import { components, internal } from "@/convex/_generated/api";
import { ActionCtx, internalAction } from "@/convex/_generated/server";
import { ONE_MINUTE_MS } from "@/lib/time";
import { RevenueCatCustomer, RevenueCatCustomerAliases } from "@/lib/types";
import { ActionCache } from "@convex-dev/action-cache";
import { v } from "convex/values";
import { isDevelopment } from "../common/utils";
import { getCustomer, getCustomerAliases } from "./utils";

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
	ttl: isDevelopment() ? ONE_MINUTE_MS : 10 * ONE_MINUTE_MS,
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
	const customer = await customerCache.fetch(ctx, { revenuecatUserId });
	return customer;
};

export const bustCustomerCache = async (ctx: ActionCtx, { revenuecatUserId }: { revenuecatUserId: string }) => {
	await customerCache.remove(ctx, { revenuecatUserId });
	return null;
};

export const getCustomerAliasesAction = internalAction({
	args: {
		customerId: v.string(),
	},
	handler: async (ctx, args): Promise<RevenueCatCustomerAliases[]> => {
		const customerAliases = await getCustomerAliases(args.customerId);
		return customerAliases.items;
	},
});
