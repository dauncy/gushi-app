import { Doc } from "@/convex/_generated/dataModel";
import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const deactivateAllJWTKeys = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existingKeys = await ctx.db
			.query("jwtKeys")
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

		for (const key of existingKeys) {
			await ctx.db.patch(key._id, { isActive: false });
		}
	},
});

export const createJWTKey = internalMutation({
	args: {
		keyId: v.string(),
		publicKey: v.string(),
		privateKey: v.string(),
		modulus: v.string(),
		exponent: v.string(),
	},
	handler: async (ctx, args): Promise<Doc<"jwtKeys">> => {
		const { keyId, publicKey, privateKey, modulus, exponent } = args;

		const keyDoc = await ctx.db.insert("jwtKeys", {
			keyId,
			publicKey,
			privateKey,
			modulus,
			exponent,
			algorithm: "RS256",
			createdAt: Date.now(),
			isActive: true,
		});
		const jwtKey = await ctx.db.get(keyDoc);
		if (!jwtKey) {
			throw new Error("Failed to create JWT key");
		}
		return jwtKey;
	},
});
