import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";
import svelte from "rollup-plugin-svelte";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";

const production = !process.env.ROLLUP_WATCH;

export default {
	input: "main.ts",
	output: {
		sourcemap: !production,
		format: "iife",
		file: "docs/build/bundle.js",
	},
	plugins: [
		svelte({
			dev: !production,
			css: (css) => css.write("bundle.css", !production),
			preprocess: sveltePreprocess(),
		}),
		resolve({ browser: true, dedupe: ["svelte"] }),
		commonjs(),
		typescript({ sourceMap: !production, inlineSources: !production }),

		!production &&
			serve({ contentBase: "./docs", port: 5000, open: true }),
		!production && livereload("docs"),
		production && terser({ output: { comments: false } }),
	],
	watch: { clearScreen: true },
};
