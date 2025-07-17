export default {
	providers: [
		{
			type: "customJwt",
			issuer: process.env.CONVEX_SITE_URL, // Use Convex site URL as issuer
			applicationID: "api.tuckedin.app", // Must match JWT aud claim
			jwks: `${process.env.CONVEX_SITE_URL}/.well-known/jwks.json`,
			algorithm: "RS256",
		},
	],
};
