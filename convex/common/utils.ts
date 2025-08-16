import { MutationCtx, QueryCtx } from "@/convex/_generated/server";
import { getUser } from "@/convex/users";
import { ConvexError } from "convex/values";

export const verifyAccess = async (
	ctx: MutationCtx | QueryCtx,
	{ validateSubscription = false }: { validateSubscription?: boolean },
) => {
	const userIdentity = await ctx.auth.getUserIdentity();
	const revenueCatUserId: string | undefined = userIdentity?.revenuecat_user_id as string | undefined;
	if (!revenueCatUserId) {
		throw new ConvexError("Unauthorized");
	}
	const dbUser = await getUser(ctx as QueryCtx, { revenuecatUserId: revenueCatUserId });

	if (!dbUser) {
		throw new ConvexError("Unauthorized");
	}

	if (validateSubscription) {
		if (dbUser.subscriptionType === "monthly" || dbUser.subscriptionType === "lifetime") {
			return { dbUser, hasSubscription: true };
		}
		throw new ConvexError("No Subscription");
	}

	return { dbUser, hasSubscription: dbUser.subscriptionType !== null };
};
