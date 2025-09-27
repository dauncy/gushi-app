import { Id } from "@/convex/_generated/dataModel";
import { Store, useStore } from "@tanstack/react-store";

// You can instantiate the store outside of React components too!
export const selectedCategoryStore = new Store<{
	categoryId: Id<"categories"> | null;
}>({
	categoryId: null,
});

export const updateCategoryId = (categoryId: Id<"categories"> | null) => {
	selectedCategoryStore.setState((state) => {
		return {
			...state,
			categoryId,
		};
	});
};

export const useSelectedCategory = () => {
	const categoryId = useStore(selectedCategoryStore, (state) => state.categoryId);
	return categoryId;
};
