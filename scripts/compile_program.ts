import { COMPILED_BINARY, compileDatalog } from "../src/lib/souffle/souffle";
import fs from "fs-extra";

compileDatalog();
// copy the compiled binary to the dist directory
fs.copyFileSync(COMPILED_BINARY, COMPILED_BINARY.replace("src", "dist"));