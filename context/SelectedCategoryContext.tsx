import { Id } from "@/convex/_generated/dataModel";
import { createContext, ReactNode, useContext, useState } from "react";

interface SelectedCategoryContextDTO {
	categoryId: Id<"categories"> | null;
	setCategoryId: (categoryId: Id<"categories"> | null) => void;
}

const SelectedCategoryContext = createContext<SelectedCategoryContextDTO>({
	categoryId: null,
	setCategoryId: () => {},
});

export const SelectedCategoryProvider = ({ children }: { children: ReactNode }) => {
	const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(null);

	return (
		<SelectedCategoryContext.Provider value={{ categoryId, setCategoryId }}>
			{children}
		</SelectedCategoryContext.Provider>
	);
};

export const useSelectedCategory = () => {
	return useContext(SelectedCategoryContext);
};
