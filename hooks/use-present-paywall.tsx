import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";

export const usePresentPaywall = () => {
	const pressableRef = useRef<boolean>(true);
	const router = useRouter();

	const presentPaywall = useCallback(() => {
		if (pressableRef.current) {
			pressableRef.current = false;
			router.push("/upgrade");
			setTimeout(() => {
				pressableRef.current = true;
			}, 500);
		}
	}, [router, pressableRef]);

	return {
		presentPaywall,
	};
};
