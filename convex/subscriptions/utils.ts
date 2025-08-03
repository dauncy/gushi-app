import { REVENUE_CAT_API_BASE_URL, REVENUE_CAT_PROJECT_ID } from "@/lib/constants";
import { RevenueCatCustomer, RevenueCatCustomerAliases } from "@/lib/types";

// https://api.revenuecat.com/v2/projects/{project_id}/customers/{customer_id}
export const getCustomer = async (customerId: string): Promise<RevenueCatCustomer> => {
	if (!process.env.REVENUE_CAT_API_KEY) {
		throw new Error("REVENUE_CAT_API_KEY is not set");
	}
	const url = `${REVENUE_CAT_API_BASE_URL}/projects/${REVENUE_CAT_PROJECT_ID}/customers/${customerId}`;
	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${process.env.REVENUE_CAT_API_KEY}`,
		},
	});
	if (!res.ok) {
		throw new Error("Failed to fetch customer");
	}

	const data = await res.json();
	return data;
};

export const getCustomerAliases = async (
	customerId: string,
): Promise<{
	items: RevenueCatCustomerAliases[];
	nextPage: string | null;
	object: "list";
	url: string;
}> => {
	if (!process.env.REVENUE_CAT_API_KEY) {
		throw new Error("REVENUE_CAT_API_KEY is not set");
	}
	const url = `${REVENUE_CAT_API_BASE_URL}/projects/${REVENUE_CAT_PROJECT_ID}/customers/${customerId}/aliases`;
	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${process.env.REVENUE_CAT_API_KEY}`,
		},
	});
	if (!res.ok) {
		throw new Error("Failed to fetch customer aliases");
	}

	const data = await res.json();
	return data;
};

export const getaSubscriptionType = (customer: RevenueCatCustomer) => {
	const maybeEntitlement = customer.active_entitlements.items.pop();
	if (!maybeEntitlement) {
		return null;
	}
	if (maybeEntitlement.expires_at === null) {
		return "lifetime";
	}
	if (maybeEntitlement.expires_at && new Date(maybeEntitlement.expires_at).toISOString() >= new Date().toISOString()) {
		return "monthly";
	}
	return null;
};
