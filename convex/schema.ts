import { defineSchema } from "convex/server";
import { jwtKeys } from "./auth";
import { audio, images, stories } from "./stories";
import { users } from "./users";

const schema = defineSchema({
	stories,
	audio,
	images,
	jwtKeys,
	users,
});

export default schema;
