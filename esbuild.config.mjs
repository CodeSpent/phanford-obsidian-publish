import esbuild from "esbuild";
import process from "process";

const prod = process.argv[2] === "productionn";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "child_process",
    "fs",
    "path",
    "moment",
    "node:events",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  platform: "node",
  minify: prod,
  conditions: [prod ? "production" : "development"],
  plugins: [],
  outfile: "dist/main.js",
});


// TODO: Generate manifest.json in the dist dir

if (prod) {
  console.log("Building for production...");
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}