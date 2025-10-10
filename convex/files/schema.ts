import { zid, zodToConvex } from "convex-helpers/server/zod";
import { defineTable } from "convex/server";
import { z } from "zod";

export const files = defineTable(
	zodToConvex(
		z.object({
			userId: zid("users"),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			storageId: zid("_storage"),
			name: z.string(),
			metadata: z.object({
				size: z.object({
					height: z.number(),
					width: z.number(),
				}),
				byteSize: z.number(),
				mimeType: z.string(),
			}),
			fileHash: z.string(),
		}),
	),
)
	.index("by_user", ["userId"])
	.index("by_file_hash", ["fileHash"])
	.index("by_file_hash_and_user", ["fileHash", "userId"]);
