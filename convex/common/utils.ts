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

	if (validateSubscription) {
		// TODO
	}

	return { customer, dbUser };
};
