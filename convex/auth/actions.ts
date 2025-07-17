import { internal } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { extractRSAComponents, generateKeyPair } from "./utils";

export const createJWTKeyPair = internalAction({
	args: {},
	handler: async (ctx): Promise<Doc<"jwtKeys">> => {
		await ctx.runMutation(internal.auth.mutations.deactivateAllJWTKeys);
		const { publicKey, privateKey } = await generateKeyPair();
		const keyId = crypto.randomUUID();

		// Extract RSA components for JWK
		const { n, e } = await extractRSAComponents(publicKey);
		const jwtKey = await ctx.runMutation(internal.auth.mutations.createJWTKey, {
			keyId,
			publicKey,
			privateKey,
			modulus: n,
			exponent: e,
		});
		return jwtKey;
	},
});
