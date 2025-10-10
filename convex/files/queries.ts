import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getFileByHash = internalQuery({
	args: {
		fileHash: v.string(),
		userId: v.id("users"),
	},
	handler: async (ctx, { fileHash, userId }) => {
		return await ctx.db
			.query("files")
			.withIndex("by_file_hash_and_user", (q) => q.eq("fileHash", fileHash).eq("userId", userId))
			.unique();
	},
});
