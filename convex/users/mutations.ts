import { Doc } from "@/convex/_generated/dataModel";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const upsertUser = internalMutation({
	args: {
		revenuecatUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const { revenuecatUserId } = args;
		const exists = await ctx.db
			.query("users")
			.withIndex("by_revenuecat_user_id", (q) => q.eq("revenuecatUserId", revenuecatUserId))
			.unique();
		if (exists) {
			await ctx.db.patch(exists._id, {
				updatedAt: Date.now(),
			});
			return ctx.db.get(exists._id) as unknown as Doc<"users">;
		}
		const user = await ctx.db.insert("users", {
			revenuecatUserId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return (await ctx.db.get(user)) as unknown as Doc<"users">;
	},
});
