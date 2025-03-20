import expect from "expect";
import path from "path";
import * as sol from "solc-typed-ast";
import { searchRecursive } from "../src/lib/utils";
import { CSVFactSet, FactSet, runCompiled } from "souffle.ts";
import { COMPILED_BINARY, facts, getRelation } from "../src";
import { FUNCTORS_DIR } from "../src/functors";

require("dotenv").config();

// These files in solc-typed-ast don't compile on their own. So skip em.
const skipSamples: string[] = [
    "test/samples/solidity/error.sol",
    "test/samples/solidity/latest_08.sourced.sol",
    "test/samples/solidity/meta/complex_imports/c.sourced.sol",
    "test/samples/solidity/meta/imports/lib/B.sol",
    "test/samples/solidity/meta/imports/lib2/C.sol",
    "test/samples/solidity/meta/imports/lib2/D.sol",
    "test/samples/solidity/path_remapping/entry.sol",
    "test/samples/solidity/features_0824.sol"
];

const samples = searchRecursive(
    path.join(process.env["SOLC_TYPED_AST_DIR"] as string, "../test/samples/solidity"),
    (fileName) => fileName.endsWith(".sol") && !sol.forAny(skipSamples, (x) => fileName.endsWith(x))
);

describe("Integration test on samples", () => {
    for (const sample of samples) {
        describe(sample, () => {
            let units: sol.SourceUnit[];
            let inputFS: FactSet;

            before(async () => {
                const result = await sol.compileSol(sample, "auto");

                const data = result.data;
                const errors = sol.detectCompileErrors(data);

                expect(errors).toHaveLength(0);

                units = new sol.ASTReader().read(data);

                expect(units.length).toBeGreaterThanOrEqual(1);

                const infer = new sol.InferType(result.compilerVersion as string);

                inputFS = facts(units, infer);
            });

            after(() => {
                /**
                 * Comment this out if you want to preserve TMP_DIR for debug purposes
                 */
                inputFS.release();
            });

            it("each AST node is expressed in datalog by fact", async () => {
                const missing = new Set<sol.ASTNode>();
                const idMap = new Map<string, Set<number>>();

                for (const unit of units) {
                    for (const node of unit.getChildren()) {
                        if (!idMap.has(node.type)) {
                            const facts = (await inputFS.facts(node.type)).map((f) => f.fields);
                            expect(facts.length > 0 && facts[0].length === 1);
                            idMap.set(
                                node.type,
                                new Set<number>(facts.map((row) => row[0] as number))
                            );
                        }

                        const s = idMap.get(node.type) as Set<number>;

                        if (!s.has(node.id)) {
                            missing.add(node);
                        }
                    }
                }

                sol.assert(missing.size === 0, `Missing nodes {0}`, missing);
            });

            it("each AST node has a src fact", async () => {
                const srcFacts = await inputFS.facts("src");
                const srcMap = new Map<number, string>(
                    srcFacts.map((f) => f.fields as [number, string])
                );

                const missing = new Set<sol.ASTNode>();

                for (const unit of units) {
                    unit.walk((node) => {
                        if (srcMap.get(node.id) !== node.src) {
                            missing.add(node);
                        }
                    });
                }

                sol.assert(missing.size === 0, `Missing srcs for nodes {0}`, missing);
            });

            it("Facts are sufficient for souffle binary to run", async () => {
                const outputFS = new CSVFactSet([getRelation("cfg.dominate")]);

                const p = (async () => {
                    await runCompiled(inputFS, outputFS, COMPILED_BINARY, FUNCTORS_DIR);
                    outputFS.release();
                })();

                expect(p).resolves.not.toThrow();
            });
        });
    }
});
