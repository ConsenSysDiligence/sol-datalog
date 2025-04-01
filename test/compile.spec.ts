import expect from "expect";
import { COMPILED_BINARY, compileDatalog } from "../src";
const fse = require("fs-extra");

require("dotenv").config();

it("Datalog Compiles", async () => {
    fse.removeSync(COMPILED_BINARY);
    compileDatalog();
    expect(fse.pathExistsSync(COMPILED_BINARY)).toBeTruthy();
});
