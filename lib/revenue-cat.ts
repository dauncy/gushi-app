import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export async function presentPaywall(): Promise<boolean> {
	try {
		// Present paywall for current offering:
		const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
		// or if you need to present a specific offering:
		switch (paywallResult) {
			case PAYWALL_RESULT.NOT_PRESENTED:
			case PAYWALL_RESULT.ERROR:
			case PAYWALL_RESULT.CANCELLED:
				return false;
			case PAYWALL_RESULT.PURCHASED:
			case PAYWALL_RESULT.RESTORED:
				return true;
			default:
				return false;
		}
	} catch (error) {
		console.error("[Upgrade.tsx]: presentPaywall() => ", error);
		return false;
	}
}
