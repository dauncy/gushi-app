import { httpRouter } from "convex/server";
import { getWellKnownJWKsHttp, loginHttp, refreshHttp } from "./auth/http";
import { uploadFileHttp, uploadFileOptionHttp } from "./files/http";
import { storyMetadataHttpAction } from "./stories";
import { subscriptionWebhooksHttpAction } from "./subscriptions/http";
import { createSupportRequestHttp } from "./support/http";
import { upsertUserHttp } from "./users/http";

const http = httpRouter();

http.route({
	path: "/.well-known/jwks.json",
	method: "GET",
	handler: getWellKnownJWKsHttp,
});

http.route({
	path: "/auth/login",
	method: "POST",
	handler: loginHttp,
});

http.route({
	path: "/auth/refresh",
	method: "POST",
	handler: refreshHttp,
});

http.route({
	path: "/users/me",
	method: "POST",
	handler: upsertUserHttp,
});

http.route({
	path: "/webhooks/payments",
	method: "POST",
	handler: subscriptionWebhooksHttpAction,
});

http.route({
	pathPrefix: "/stories/metadata/",
	method: "GET",
	handler: storyMetadataHttpAction,
});

http.route({
	path: "/support",
	method: "POST",
	handler: createSupportRequestHttp,
});

http.route({
	path: "/files",
	method: "POST",
	handler: uploadFileHttp,
});

http.route({
	path: "/files",
	method: "OPTIONS",
	handler: uploadFileOptionHttp,
});

export default http;
