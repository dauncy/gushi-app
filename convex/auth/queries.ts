import { internalQuery } from "@/convex/_generated/server";
import { Doc } from "../_generated/dataModel";

export const getActiveJWTKey = internalQuery({
	args: {},
	handler: async (ctx): Promise<Doc<"jwtKeys"> | null> => {
		return await ctx.db
			.query("jwtKeys")
			.filter((q) => q.eq(q.field("isActive"), true))
			.order("desc")
			.first();
	},
});
