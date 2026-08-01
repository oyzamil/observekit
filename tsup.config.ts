import { readFileSync } from "node:fs";
import { defineConfig, type Options } from "tsup";

const pkg = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

const shared: Options = {
	sourcemap: true,
	target: "es2020",
	banner(ctx) {
		return {
			js: `/* observekit v${pkg.version} - ${ctx.format} | M.Muzammil <https://muzammil.work/> | MIT License */`,
		};
	},
};

export default defineConfig([
	{
		...shared,
		entry: {
			observekit: "src/index.ts",
		},
		format: ["esm", "cjs"],
		dts: true,
		clean: true,
		minify: false,
		outExtension({ format }) {
			return { js: `.${format}.js` };
		},
	},
	{
		...shared,
		entry: {
			observekit: "src/index.ts",
		},
		format: ["esm", "cjs"],
		dts: false,
		clean: false,
		minify: true,
		outExtension({ format }) {
			return { js: `.${format}.min.js` };
		},
	},
	{
		...shared,
		entry: {
			observekit: "src/browser.ts",
		},
		format: ["iife"],
		dts: false,
		clean: false,
		minify: false,
		outExtension() {
			return { js: ".js" };
		},
	},
	{
		...shared,
		entry: {
			observekit: "src/browser.ts",
		},
		format: ["iife"],
		dts: false,
		clean: false,
		minify: true,
		outExtension() {
			return { js: ".min.js" };
		},
	},
]);
