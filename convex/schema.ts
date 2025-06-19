import { defineSchema } from "convex/server";
import { audio, images, stories } from "./schema/stories.schema";

const schema = defineSchema({
	stories,
	audio,
	images,
});

export default schema;
