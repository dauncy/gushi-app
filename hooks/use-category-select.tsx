import { Id } from "@/convex/_generated/dataModel";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

export const useCategorySelect = () => {
	const { category } = useGlobalSearchParams() ?? {};
	const router = useRouter();

	const handleCategorySelect = useCallback(
		(categoryId: string) => {
			router.setParams({ category: categoryId });
		},
		[router],
	);

	return {
		category: category as Id<"categories"> | undefined,
		handleCategorySelect,
	};
};
