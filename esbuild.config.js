import { build } from "esbuild";
import path from "node:path";
import { argv } from "node:process";
import fs from "node:fs/promises";

const EXTENSIONS_DIR = "sources";
const extensionName = argv[2];

async function buildExtension(name) {
  const entry = path.join(EXTENSIONS_DIR, name, "src", "index.ts");
  const outFile = path.join("builds", `${name}.js`);

  try {
    await fs.access(entry);
  } catch {
    console.error(`❌ Entry file not found for "${name}": ${entry}`);
    return;
  }

  const config = {
    entryPoints: [entry],
    outfile: outFile,
    format: "esm",
    bundle: true,
    platform: "browser",
    target: "es2020",
    minify: false,
    sourcemap: false,
    treeShaking: true,
    loader: {
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".svg": "text",
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    external: [],
    plugins: [],
    splitting: false,
    metafile: true,
    logLevel: "info",
  };

  try {
    const result = await build(config);
    if (config.metafile) {
      console.log(`📦 Build outputs for "${name}":`);
      console.log(result.metafile.outputs);
    }
    console.log(`✅ Built "${name}" successfully!\n`);
  } catch (error) {
    console.error(`❌ Build failed for "${name}":`, error);
  }
}

async function main() {
  await fs.mkdir("builds", { recursive: true });

  if (extensionName) {
    await buildExtension(extensionName);
  } else {
    const dirs = await fs.readdir(EXTENSIONS_DIR, { withFileTypes: true });
    const extensions = dirs.filter((d) => d.isDirectory()).map((d) => d.name);

    for (const ext of extensions) {
      await buildExtension(ext);
    }
  }
}

await main();
