import { EventEmitter } from "events";

export const EVENTS = {
	SEARCH_TAB_PRESS: "SEARCH_TAB_PRESS",
} as const;

export const eventRegister = new EventEmitter();
