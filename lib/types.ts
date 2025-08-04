import { ActionCtx, MutationCtx, QueryCtx } from "@/convex/_generated/server";
import { GenericActionCtx, GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

export type Nullable<T> = T | null;

export type RevenueCatCustomer = {
	active_entitlements: {
		items: {
			entitlement_id: string;
			expires_at: number | null | string;
			object: string;
		}[];
		next_page: null;
		object: "list";
		url: string;
	};
	experiment: null | unknown;
	first_seen_at: number;
	id: string;
	last_seen_app_version: string;
	last_seen_at: number;
	last_seen_country: string;
	last_seen_platform: string;
	last_seen_platform_version: string;
	object: "customer";
	project_id: string;
};

export type RevenueCatCustomerAliases = {
	created_at: number;
	id: string;
	object: "customer.alias";
};

type RunMutationCtx = {
	runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
type RunActionCtx = {
	runAction: GenericActionCtx<GenericDataModel>["runAction"];
};
type RunQueryCtx = {
	runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};

export type CacheCtx = RunQueryCtx & RunMutationCtx & RunActionCtx;

export type GenericCtx = QueryCtx | ActionCtx | MutationCtx;
