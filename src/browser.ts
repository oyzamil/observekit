import { observekit } from "./index";

(
	globalThis as typeof globalThis & { observekit: typeof observekit }
).observekit = observekit;
