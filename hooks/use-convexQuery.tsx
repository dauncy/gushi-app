import { convexQueryClient } from "@/lib/convex.client";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

/**
 * Wrap a Convex query with TanStack Query using convexQueryClient.
 * This abstracts the convexQueryClient.queryOptions pattern.
 *
 * @param ref - auto-generated Query reference from `api.*`
 * @param args - typed argument object for the Query
 * @param opts - (optional) TanStack Query options (initialData, enabled, etc.)
 */
export function useConvexQuery<R extends FunctionReference<"query">>(
	ref: R,
	args: FunctionArgs<R>,
	opts?: Omit<
		UseQueryOptions<FunctionReturnType<R>, Error, FunctionReturnType<R>, ["convexQuery", R, FunctionArgs<R>]>,
		"queryKey" | "queryFn"
	>,
) {
	return useQuery({
		...convexQueryClient.queryOptions(ref, args),
		...opts,
		enabled: opts?.enabled ?? true,
		staleTime: opts?.staleTime ?? 0,
		refetchOnMount: opts?.refetchOnMount ?? true,
		refetchOnWindowFocus: opts?.refetchOnWindowFocus ?? true,
		refetchOnReconnect: opts?.refetchOnReconnect ?? true,
	});
}
