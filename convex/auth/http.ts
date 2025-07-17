import { internal } from "@/convex/_generated/api";
import { httpAction } from "@/convex/_generated/server";
import { getCustomer } from "@/convex/subscriptions/utils";
import { signJWT, verifyJWT } from "./utils";

export const getWellKnownJWKsHttp = httpAction(async (ctx) => {
	const activeKey = await ctx.runQuery(internal.auth.queries.getActiveJWTKey);

	if (!activeKey) {
		// Create a new key pair if none exists
		console.log("Creating a new key pair");
		const newKey = await ctx.runAction(internal.auth.actions.createJWTKeyPair, {});
		console.log("New key", newKey);

		const jwk = {
			kty: "RSA",
			use: "sig",
			alg: "RS256",
			kid: newKey.keyId,
			n: newKey.modulus,
			e: newKey.exponent,
		};

		return new Response(JSON.stringify({ keys: [jwk] }), {
			headers: { "Content-Type": "application/json" },
		});
	}
	console.log("Active key", activeKey);
	const jwk = {
		kty: "RSA",
		use: "sig",
		alg: "RS256",
		kid: activeKey.keyId,
		n: activeKey.modulus,
		e: activeKey.exponent,
	};

	return new Response(JSON.stringify({ keys: [jwk] }), {
		headers: { "Content-Type": "application/json" },
	});
});

export const loginHttp = httpAction(async (ctx, req) => {
	const { revenuecat_user_id } = await req.json();
	if (!revenuecat_user_id) {
		return new Response("Revenuecat user ID is required", { status: 401 });
	}
	const customer = await getCustomer(revenuecat_user_id);
	if (!customer) {
		return new Response("Customer not found", { status: 404 });
	}

	const activeKey = await ctx.runQuery(internal.auth.queries.getActiveJWTKey);
	if (!activeKey) {
		return new Response("Internal Server Error", { status: 500 });
	}

	const dbUser = await ctx.runQuery(internal.users.queries.getUserByRevenuecatUserId, {
		revenuecatUserId: revenuecat_user_id,
	});
	if (!dbUser) {
		return new Response("failed to find user", { status: 404 });
	}

	const token = await signJWT(
		{
			revenuecat_user_id: customer.id,
		},
		activeKey.privateKey,
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
		const customer = await getCustomer(revenuecat_user_id);
		if (!customer) {
			return new Response(JSON.stringify({ error: "Customer not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		let dbUser = await ctx.runQuery(internal.users.queries.getUserByRevenuecatUserId, {
			revenuecatUserId: revenuecat_user_id,
		});
		if (force_refresh) {
			dbUser = await ctx.runMutation(internal.users.mutations.upsertUser, {
				revenuecatUserId: revenuecat_user_id,
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
				revenuecat_user_id: customer.id,
			},
			activeKey.privateKey,
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
