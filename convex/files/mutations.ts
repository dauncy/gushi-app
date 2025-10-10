import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const createFile = internalMutation({
	args: {
		storageId: v.id("_storage"),
		userId: v.id("users"),
		metadata: v.object({
			size: v.object({
				height: v.number(),
				width: v.number(),
			}),
			byteSize: v.number(),
			mimeType: v.string(),
		}),
		fileHash: v.string(),
	},
	handler: async (ctx, { storageId, userId, metadata, fileHash }) => {
		const createdAt = new Date().toISOString();
		return await ctx.db.insert("files", {
			userId,
			storageId,
			fileHash,
			createdAt,
			updatedAt: createdAt,
			name: `${fileHash}.${metadata.mimeType.split("/").pop()}`,
			metadata: {
				size: {
					height: metadata.size.height,
					width: metadata.size.width,
				},
				mimeType: metadata.mimeType,
				byteSize: metadata.byteSize,
			},
		});
	},
});
