import { createSignal } from "solid-js";

export type FerretTab = "look" | "calls" | "sounds" | "app";

/** Which tab of Settings -> Ferret is open (other pages can pick one) */
export const [ferretTab, setFerretTab] = createSignal<FerretTab>("look");
