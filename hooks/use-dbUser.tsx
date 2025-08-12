import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convexQuery";

export const useDbUser = () => {
	const { data, isLoading, error } = useConvexQuery(api.users.queries.getUserPublic, {});
	return { dbUser: data, isLoading, error };
};
