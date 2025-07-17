import { defineSchema } from "convex/server";
import { jwtKeys } from "./auth";
import { audio, images, stories } from "./schema/stories.schema";
import { users } from "./users";

const schema = defineSchema({
	stories,
	audio,
	images,
	jwtKeys,
	users,
});

export default schema;
