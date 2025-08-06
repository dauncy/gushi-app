import { Id } from "@/convex/_generated/dataModel";
import { httpAction } from "@/convex/_generated/server";
import { internal } from "../_generated/api";
import { getDescription } from "./actions";

export const storyMetadataHttpAction = httpAction(async (ctx, req) => {
	const url = new URL(req.url);
	const apiKey = req.headers.get("x-api-key");
	if (apiKey !== process.env.LANDING_PAGE_API_KEY) {
		return new Response("Unauthorized", { status: 401 });
	}
	const storyId: Id<"stories"> = url.pathname.split("/").pop() as Id<"stories">;

	if (!storyId) {
		return new Response("No story ID", { status: 400 });
	}
	try {
		const [story, metaDescription] = await Promise.all([
			ctx.runQuery(internal.stories.queries.getStoryMetadata, { storyId }),
			getDescription(ctx, { storyId }),
		]);

		if (!story) {
			return new Response("Story not found", { status: 404 });
		}

		return Response.json(
			{
				title: story?.title,
				description: metaDescription,
				image: story.imageUrl,
				duration: story.duration,
				updatedAt: story.updatedAt,
			},
			{
				status: 200,
				headers: {
					"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
				},
			},
		);
	} catch (error) {
		console.error("[convex/stories/http.ts] Error generating story metadata", error);
		return new Response("Internal server error", { status: 500 });
	}
});
