import { PaginatedQueryArgs, PaginatedQueryReference, usePaginatedQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

export const useConvexPaginatedQuery = <T extends PaginatedQueryReference>(
	query: T,
	args: PaginatedQueryArgs<T>,
	options: { initialNumItems: number },
) => {
	const [refreshing, setRefreshing] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const isMountedRef = useRef(true);

	const shouldSkip = refreshing;
	const { isLoading, loadMore, results, status } = usePaginatedQuery(query, shouldSkip ? "skip" : args, options);

	const handleRefresh = async () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current = new AbortController();
		const { signal } = abortControllerRef.current;

		setRefreshing(true);

		try {
			await new Promise<void>((resolve, reject) => {
				timeoutRef.current = setTimeout(() => {
					if (signal.aborted) {
						reject(new DOMException("Refresh aborted", "AbortError"));
						return;
					}
					resolve();
				}, 250);
			});
		} catch (error) {
			// Swallow abort errors; re-throw unexpected ones.
			if (!(error instanceof DOMException && error.name === "AbortError")) {
				throw error;
			}
		}

		if (isMountedRef.current && !signal.aborted) {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	return { isLoading, loadMore, results, status, refreshing, refresh: handleRefresh };
};
