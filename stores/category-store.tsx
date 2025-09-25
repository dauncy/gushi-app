import { Id } from "@/convex/_generated/dataModel";
import { proxy, useSnapshot } from "valtio";

export const selectedCategoryState = proxy<{
	categoryId: Id<"categories"> | null;
}>({
	categoryId: null,
});

export const useSelectedCategory = () => {
	return useSnapshot(selectedCategoryState);
};
