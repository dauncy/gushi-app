import { GenericActionCtx, GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

export type Nullable<T> = T | null;

export type RevenueCatCustomer = {
	active_entitlements: {
		items: unknown[];
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
