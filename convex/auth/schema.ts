import { defineTable } from "convex/server";
import { v } from "convex/values";

export const jwtKeys = defineTable({
	keyId: v.string(),
	publicKey: v.string(),
	privateKey: v.string(),
	modulus: v.string(), // RSA modulus component (n)
	exponent: v.string(), // RSA exponent component (e)
	algorithm: v.string(),
	createdAt: v.number(),
	isActive: v.boolean(),
}).index("by_key_id", ["keyId"]);
