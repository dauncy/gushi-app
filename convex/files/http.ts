import { internal } from "@/convex/_generated/api";
import { httpAction } from "@/convex/_generated/server";
import { verifyActionAccess } from "@/convex/common/utils";
import { Buffer } from "buffer";

export const uploadFileHttp = httpAction(async (ctx, req) => {
	const { dbUser } = await verifyActionAccess(ctx, { validateSubscription: false });
	const blob = await req.blob();
	const arrayBuffer = await blob.arrayBuffer();
	const base64 = Buffer.from(arrayBuffer).toString("base64");
	const { storageId, fileId } = await ctx.runAction(internal.files.actions.processFileAction, {
		base64,
		contentType: blob.type,
		userId: dbUser._id,
	});
	if (!storageId) {
		return Response.json({ storageId: null }, { status: 500 });
	}
	const imageUrl = await ctx.storage.getUrl(storageId);
	return Response.json({ storageId, imageUrl, fileId }, { status: 200 });
});

export const uploadFileOptionHttp = httpAction(async (ctx, request) => {
	await verifyActionAccess(ctx, { validateSubscription: false });
	const headers = request.headers;
	if (
		headers.get("Origin") !== null &&
		headers.get("Access-Control-Request-Method") !== null &&
		headers.get("Access-Control-Request-Headers") !== null
	) {
		return new Response(null, {
			headers: new Headers({
				"Access-Control-Allow-Methods": "POST",
				"Access-Control-Allow-Headers": "Content-Type, Digest",
				"Access-Control-Max-Age": "86400",
			}),
		});
	} else {
		return new Response();
	}
});
