import { readFileSync } from "node:fs";
import type { OutputOptions } from "rolldown";
import { defineConfig, type UserConfig } from "tsdown";

const pkg = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

const BANNER = (format: string) =>
	`/*! ${pkg.name} v${pkg.version} - ${format} | M.Muzammil <https://muzammil.work/> | MIT License */`;

const applyOutputOptions = (
	options: OutputOptions,
	format: string,
	isLibrary = false,
) => {
	options.banner = BANNER(format);

	options.comments = {
		legal: true,
	};

	if (isLibrary) {
		options.exports = "named";
	}

	return options;
};

const shared: UserConfig = {
	sourcemap: false,
	target: "es2020",
};

const packageBuild = (minify: boolean): UserConfig => ({
	...shared,
	entry: {
		observekit: "src/index.ts",
	},
	format: ["esm", "cjs"],
	dts: !minify,
	clean: !minify,
	minify,
	outputOptions(options, format) {
		return applyOutputOptions(options, format, true);
	},
	outExtensions({ format }) {
		return {
			js: minify
				? format === "es"
					? ".esm.min.js"
					: ".min.cjs"
				: format === "es"
					? ".esm.js"
					: ".cjs",
			...(minify
				? {}
				: {
						dts: format === "es" ? ".ts" : ".cts",
					}),
		};
	},
});

const browserBuild = (minify: boolean): UserConfig => ({
	...shared,
	entry: {
		observekit: "src/browser.ts",
	},
	format: ["iife"],
	globalName: pkg.name,
	dts: false,
	clean: false,
	minify,
	outputOptions(options, format) {
		applyOutputOptions(options, format, false);

		options.entryFileNames = minify ? "[name].min.js" : "[name].js";

		return options;
	},
});

export default defineConfig([
	packageBuild(false),
	packageBuild(true),
	browserBuild(false),
	browserBuild(true),
]);
