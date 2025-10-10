"use node";

import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { compressToWebp, generateMD5Hash } from "./utils";

export const processFileAction = internalAction({
	args: {
		base64: v.string(),
		contentType: v.string(),
		userId: v.id("users"),
	},
	handler: async (
		ctx,
		{ base64, contentType, userId },
	): Promise<{ storageId: Id<"_storage"> | null; fileId: Id<"files"> | null }> => {
		const buffer = Buffer.from(base64, "base64");
		const blob = new Blob([buffer], { type: contentType });

		// Generate hash of original
		const hash = await generateMD5Hash(blob);
		const exists = await ctx.runQuery(internal.files.queries.getFileByHash, { fileHash: hash, userId });
		if (!!exists) {
			return {
				storageId: exists.storageId,
				fileId: exists._id,
			};
		}
		if (contentType.startsWith("image/")) {
			const {
				blob: compressedBlob,
				mimeType,
				width,
				height,
				bytes,
			} = await compressToWebp(blob, { quality: 78, maxWidth: 768, maxHeight: 768 });
			const storageId = await ctx.storage.store(compressedBlob);
			const createdFile = await ctx.runMutation(internal.files.mutations.createFile, {
				storageId,
				userId,
				metadata: { size: { width, height }, byteSize: bytes, mimeType },
				fileHash: hash,
			});
			return {
				storageId,
				fileId: createdFile,
			};
		}
		throw new ConvexError("Non Image Files not supported");
	},
});
