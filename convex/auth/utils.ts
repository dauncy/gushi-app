import { jwtVerify } from "jose";
import { JWTPayload } from "./types";

function base64URLEncode(str: ArrayBuffer): string {
	const base64 = btoa(String.fromCharCode(...new Uint8Array(str)));
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function base64URLDecode(str: string): ArrayBuffer {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	while (str.length % 4) {
		str += "=";
	}
	const binary = atob(str);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

async function pemToCryptoKey(pem: string, type: "private" | "public"): Promise<CryptoKey> {
	const pemContents = pem
		.replace(/-----BEGIN (PRIVATE|PUBLIC) KEY-----/, "")
		.replace(/-----END (PRIVATE|PUBLIC) KEY-----/, "")
		.replace(/\s/g, "");

	const binaryString = atob(pemContents);
	const keyData = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		keyData[i] = binaryString.charCodeAt(i);
	}

	if (type === "private") {
		return await crypto.subtle.importKey(
			"pkcs8",
			keyData,
			{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
			true, // Don't need to extract for signing
			["sign"],
		);
	} else {
		return await crypto.subtle.importKey(
			"spki",
			keyData,
			{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
			true, // Don't need to extract for verification
			["verify"],
		);
	}
}

export async function extractRSAComponents(publicKeyPem: string): Promise<{ n: string; e: string }> {
	const publicKey = await pemToCryptoKey(publicKeyPem, "public");
	// Export the key to get the raw components
	const exportedKey = await crypto.subtle.exportKey("jwk", publicKey);
	if (!exportedKey.n || !exportedKey.e) {
		throw new Error("Failed to extract RSA components");
	}

	return {
		n: exportedKey.n,
		e: exportedKey.e,
	};
}

export async function generateKeyPair(): Promise<{
	publicKey: string;
	privateKey: string;
	modulus: string;
	exponent: string;
}> {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "RSASSA-PKCS1-v1_5",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		true, // Make extractable so we can get JWK components
		["sign", "verify"],
	);

	// Export as JWK to get modulus and exponent
	const publicJWK = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

	// Export as PEM for storage
	const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
	const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

	const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)))}\n-----END PUBLIC KEY-----`;
	const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))}\n-----END PRIVATE KEY-----`;

	return {
		publicKey: publicKeyPem,
		privateKey: privateKeyPem,
		modulus: publicJWK.n || "",
		exponent: publicJWK.e || "AQAB",
	};
}

export async function signJWT(
	payload: Omit<JWTPayload, "iss" | "aud" | "sub" | "exp" | "iat">,
	privateKeyPem: string,
): Promise<string> {
	if (!process.env.CONVEX_SITE_URL) {
		throw new Error("CONVEX_SITE_URL is not set");
	}

	const header = {
		alg: "RS256",
		typ: "JWT",
	};

	const now = Math.floor(Date.now() / 1000);
	const fullPayload: JWTPayload = {
		...payload,
		iss: process.env.CONVEX_SITE_URL,
		aud: "api.tuckedin.app",
		sub: payload.revenuecat_user_id,
		exp: now + 60 * 60, // 1 hour
		iat: now,
	};

	const encodedHeader = base64URLEncode(new TextEncoder().encode(JSON.stringify(header)));
	const encodedPayload = base64URLEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
	const data = `${encodedHeader}.${encodedPayload}`;

	const privateKey = await pemToCryptoKey(privateKeyPem, "private");
	const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(data));

	const encodedSignature = base64URLEncode(signature);
	return `${data}.${encodedSignature}`;
}

export function createJWKFromStoredKey(
	keyId: string,
	modulus: string,
	exponent: string,
): {
	kty: "RSA";
	use: "sig";
	alg: "RS256";
	kid: string;
	n: string;
	e: string;
} {
	return {
		kty: "RSA",
		use: "sig",
		alg: "RS256",
		kid: keyId,
		n: modulus,
		e: exponent,
	};
}

export async function verifyJWT(token: string, publicKeyPem: string): Promise<JWTPayload> {
	const publicKey = await pemToCryptoKey(publicKeyPem, "public");
	const { payload } = await jwtVerify<JWTPayload>(token, publicKey, {
		issuer: process.env.CONVEX_SITE_URL,
		audience: "api.tuckedin.app",
	});

	return payload;
}
