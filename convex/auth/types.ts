export interface JWTPayload {
	revenuecat_user_id: string;
	iss: string;
	aud: string;
	sub: string;
	exp: number;
	iat: number;
}
