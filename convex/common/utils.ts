import { QueryCtx } from "@/convex/_generated/server";
import { getCustomerCached } from "@/convex/subscriptions";
import { getUser } from "@/convex/users";
import { CacheCtx, GenericCtx } from "@/lib/types";
import { ConvexError } from "convex/values";

export const verifyAccess = async (
	ctx: GenericCtx,
	{ validateSubscription = false }: { validateSubscription?: boolean },
) => {
	const userIdentity = await ctx.auth.getUserIdentity();
	const revenueCatUserId: string | undefined = userIdentity?.revenuecat_user_id as string | undefined;
	let hasSubscription = false;

	if (!revenueCatUserId) {
		throw new ConvexError("Unauthorized");
	}

	const [customer, dbUser] = await Promise.all([
		getCustomerCached(ctx as CacheCtx, { revenuecatUserId: revenueCatUserId }),
		getUser(ctx as QueryCtx, { revenuecatUserId: revenueCatUserId }),
	]);

	if (!customer || !dbUser) {
		throw new ConvexError("Unauthorized");
	}

	const maybeEntitlement = customer.active_entitlements.items.pop();
	if (
		(maybeEntitlement && maybeEntitlement.expires_at === null) ||
		(maybeEntitlement?.expires_at && new Date(maybeEntitlement?.expires_at).toISOString() >= new Date().toISOString())
	) {
		hasSubscription = true;
	}

	if (validateSubscription) {
		if (!hasSubscription) {
			throw new ConvexError("No Subscription");
		}
	}

	return { customer, dbUser, hasSubscription };
};
