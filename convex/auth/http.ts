import { internal } from "@/convex/_generated/api";
import { httpAction } from "@/convex/_generated/server";
import { getaSubscriptionType } from "../subscriptions";
import { getCustomerCached } from "../subscriptions/actions";
import { signJWT, verifyJWT } from "./utils";

export const getWellKnownJWKsHttp = httpAction(async (ctx) => {
	const activeKey = await ctx.runQuery(internal.auth.queries.getActiveJWTKey);

	if (!activeKey) {
		// Create a new key pair if none exists
		const newKey = await ctx.runAction(internal.auth.actions.createJWTKeyPair, {});

		const jwk = {
			kty: "RSA",
			use: "sig",
			alg: "RS256",
			kid: newKey.keyId,
			n: newKey.modulus,
			e: newKey.exponent,
		};

		return Response.json({ keys: [jwk] }, { status: 200 });
	}
	const jwk = {
		kty: "RSA",
		use: "sig",
		alg: "RS256",
		kid: activeKey.keyId,
		n: activeKey.modulus,
		e: activeKey.exponent,
	};

	return Response.json({ keys: [jwk] }, { status: 200 });
});

export const loginHttp = httpAction(async (ctx, req) => {
	const { revenuecat_user_id } = await req.json();
	if (!revenuecat_user_id) {
		return new Response("Revenuecat user ID is required", { status: 401 });
	}
	const customer = await getCustomerCached(ctx, { revenuecatUserId: revenuecat_user_id });

	if (!customer) {
		return new Response("Customer not found", { status: 404 });
	}

	const activeKey = await ctx.runQuery(internal.auth.queries.getActiveJWTKey);
	console.log("[convex/auth/http.ts]: loginHttp() => --- activeJWTKey ---", { activeKey });
	if (!activeKey) {
		return new Response("Internal Server Error", { status: 500 });
	}

	const subscriptionType = getaSubscriptionType(customer);

	const dbUser = await ctx.runMutation(internal.users.mutations.upsertUser, {
		revenuecatUserId: revenuecat_user_id,
		subscriptionType,
	});

	if (!dbUser) {
		return new Response("failed to find user", { status: 404 });
	}

	const token = await signJWT(
		{
			revenuecat_user_id,
		},
		activeKey.privateKey,
		activeKey.keyId,
	);

	const verified = await verifyJWT(token, activeKey.publicKey);

	return Response.json({
		token,
		dbUser,
		claims: verified,
	});
});

export const refreshHttp = httpAction(async (ctx, req) => {
	try {
		const body = await req.json();
		const { revenuecat_user_id, force_refresh } = body;
		if (!revenuecat_user_id) {
			return new Response(JSON.stringify({ error: "RevenueCat User ID required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Get active JWT key
		const activeKey = await ctx.runQuery(internal.auth.queries.getActiveJWTKey);
		if (!activeKey) {
			return new Response(JSON.stringify({ error: "No active JWT key" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
		const customer = await getCustomerCached(ctx, { revenuecatUserId: revenuecat_user_id });
		if (!customer) {
			return new Response(JSON.stringify({ error: "Customer not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		const subscriptionType = getaSubscriptionType(customer);
		let dbUser = await ctx.runQuery(internal.users.queries.getUserByRevenuecatUserId, {
			revenuecatUserId: revenuecat_user_id,
		});
		if (force_refresh) {
			dbUser = await ctx.runMutation(internal.users.mutations.upsertUser, {
				revenuecatUserId: revenuecat_user_id,
				subscriptionType,
			});
			if (!dbUser) {
				return new Response(JSON.stringify({ error: "Failed to refresh user" }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		// Generate new JWT
		const token = await signJWT(
			{
				revenuecat_user_id: revenuecat_user_id,
			},
			activeKey.privateKey,
			activeKey.keyId,
		);

		const verified = await verifyJWT(token, activeKey.publicKey);

		return Response.json({
			token,
			dbUser,
			claims: verified,
		});
	} catch (error) {
		console.error("Refresh error:", error);
		return new Response("Internal server error", {
			status: 500,
		});
	}
});
