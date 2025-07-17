import { defineTable } from "convex/server";
import { v } from "convex/values";

export const users = defineTable({
	createdAt: v.number(),
	updatedAt: v.number(),
	revenuecatUserId: v.string(),
}).index("by_revenuecat_user_id", ["revenuecatUserId"]);
