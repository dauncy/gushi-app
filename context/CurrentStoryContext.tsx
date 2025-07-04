import { Id } from "@/convex/_generated/dataModel";
import { createContext, useContext, useState } from "react";

interface CurrentStoryContextType {
	storyId: Id<"stories"> | null;
	setStoryId: (storyId: Id<"stories"> | null) => void;
}

export const CurrentStoryContext = createContext<CurrentStoryContextType>({
	storyId: null,
	setStoryId: () => {},
});

export const CurrentStoryProvider = ({ children }: { children: React.ReactNode }) => {
	const [storyId, setStoryId] = useState<Id<"stories"> | null>(null);

	return <CurrentStoryContext.Provider value={{ storyId, setStoryId }}>{children}</CurrentStoryContext.Provider>;
};

export const useCurrentStory = () => {
	const { storyId, setStoryId } = useContext(CurrentStoryContext);

	return { storyId, setStoryId };
};
