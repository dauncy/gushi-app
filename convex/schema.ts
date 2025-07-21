import { defineSchema } from "convex/server";
import { jwtKeys } from "./auth";
import { favorites } from "./favorites";
import { audio, images, stories } from "./stories";
import { users } from "./users";

const schema = defineSchema({
	stories,
	audio,
	images,
	jwtKeys,
	users,
	favorites,
});

export default schema;
