import { build } from "../deps/dnt.ts";
import * as fs from "../deps/std/fs.ts";
import { fail } from "../deps/std/testing/asserts.ts";

const OUT_DIR = "target/npm";
await fs.emptyDir(OUT_DIR);

await Promise.all([
  build({
    entryPoints: ["mod.ts"],
    outDir: OUT_DIR,
    package: {
      name: "zones",
      version: Deno.args[0] || fail(),
      description:
        "A tiny functional effect system for TypeScript library developers",
      license: "Apache-2.0",
      repository: `github:paritytech/zones`,
    },
    compilerOptions: {
      lib: ["dom", "esnext"],
      importHelpers: true,
      sourceMap: true,
      target: "ES2021",
    },
    scriptModule: "cjs",
    shims: {
      deno: {
        test: true,
      },
    },
    test: true,
    typeCheck: true,
  }),
  fs.copy("LICENSE", `${OUT_DIR}/LICENSE`),
  fs.copy("Readme.md", `${OUT_DIR}/Readme.md`),
]);
