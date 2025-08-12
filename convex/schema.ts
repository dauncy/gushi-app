import { defineSchema } from "convex/server";
import { jwtKeys } from "./auth/schema";
import { favorites } from "./favorites/schema";
import { feedback } from "./feedback/schema";
import { audio, images, stories } from "./stories/schema";
import { support } from "./support/schema";
import { users } from "./users/schema";

const schema = defineSchema({
	stories,
	audio,
	images,
	jwtKeys,
	users,
	favorites,
	feedback,
	support,
});

export default schema;
