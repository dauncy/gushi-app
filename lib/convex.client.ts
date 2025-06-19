import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { getConvexURL } from "./utils";

export const convex = new ConvexReactClient(getConvexURL(), {
	unsavedChangesWarning: false,
});

export const convexQueryClient = new ConvexQueryClient(convex);

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: convexQueryClient.hashFn(),
			queryFn: convexQueryClient.queryFn(),
		},
	},
});
convexQueryClient.connect(queryClient);
