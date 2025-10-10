"use node";

import crypto from "crypto";
import sharp from "sharp";

type WebpOptions = {
	quality?: number; // 1–100 (default 75). Ignored if lossless=true
	nearLossless?: boolean; // favor crisp edges for PNG-like inputs
	lossless?: boolean; // true = lossless webp
	effort?: number; // 0–6 encode effort; 4 is a good default
	maxWidth?: number; // optional bounding box
	maxHeight?: number;
};

export async function compressToWebp(
	imageBlob: Blob,
	{ quality = 75, nearLossless = false, lossless = false, effort = 4, maxWidth, maxHeight }: WebpOptions = {},
) {
	// 1) Blob -> Buffer
	const arrayBuffer = await imageBlob.arrayBuffer();
	const input = Buffer.from(arrayBuffer);

	// 2) Build pipeline (auto-orient, ensure sRGB)
	let pipeline = sharp(input, { failOn: "none" }).rotate().toColorspace("srgb");

	// 3) Optional resize (no upscaling)
	if (maxWidth || maxHeight) {
		pipeline = pipeline.resize({
			width: maxWidth,
			height: maxHeight,
			fit: "inside",
			withoutEnlargement: true,
		});
	}

	// 4) Encode as WEBP always
	const webpParams: sharp.WebpOptions = {
		quality,
		effort,
		nearLossless,
		lossless,
	};

	const { data, info } = await pipeline.webp(webpParams).toBuffer({ resolveWithObject: true });

	// 5) Return bytes + convenience Blob + metadata
	const mimeType = "image/webp";
	return {
		buffer: data, // Node Buffer containing WEBP
		blob: new Blob([data], { type: mimeType }), // If you need a Blob back
		mimeType,
		width: info.width,
		height: info.height,
		bytes: data.length,
	};
}

export const generateMD5Hash = async (blob: Blob) => {
	const arrayBuffer = await blob.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const hash = crypto.createHash("md5").update(buffer).digest("hex");
	return hash;
};
