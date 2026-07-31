import { defineConfig, type Options } from "tsup";

const shared: Options = {
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	sourcemap: true,
	treeshake: true,
	target: "es2020",
};

export default defineConfig([
	{
		...shared,
		dts: true,
		clean: true,
		minify: false,
		outExtension({ format }) {
			return { js: format === "cjs" ? ".cjs" : ".js" };
		},
	},
	{
		...shared,
		dts: false,
		clean: false,
		minify: true,
		outExtension({ format }) {
			return { js: format === "cjs" ? ".min.cjs" : ".min.js" };
		},
	},
]);
