import expect from "expect";
import fse from "fs-extra";
import path from "path";
import * as sol from "solc-typed-ast";
import * as dl from "souffle.ts";
import { analyze, getRelation } from "../src";
import { searchRecursive } from "../src/lib/utils";

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
    (fileName) =>
        fileName.endsWith(".sol") &&
        !fileName.endsWith(".sourced.sol") &&
        !sol.forAny(skipSamples, (x) => fileName.endsWith(x))
);

samples.push(...searchRecursive("test/samples", (fileName) => fileName.endsWith(".sol")));
const verbose = false;

export type NdGraph = Map<number, Set<number>>;
export type Reachable = Set<number>;

// Legitimate reachability exceptions
const exceptions: Array<[string, string, string]> = [
    // do { break; } while (exp)  - exp is unreachable
    [
        "test/samples/solidity/latest_08.sol",
        "stmtStructDocs",
        '//FunctionDefinition[@name="stmtStructDocs"]/Block/DoWhileStatement/Literal'
    ],
    [
        "test/samples/solidity/struct_docs_04.sol",
        "stmtStructDocs",
        '//FunctionDefinition[@name="stmtStructDocs"]/Block/DoWhileStatement/Literal'
    ],
    [
        "test/samples/solidity/struct_docs_05.sol",
        "stmtStructDocs",
        '//FunctionDefinition[@name="stmtStructDocs"]/Block/DoWhileStatement/Literal'
    ],
    [
        "test/samples/solidity/unicode_big.sol",
        "stmtStructDocs",
        '//FunctionDefinition[@name="stmtStructDocs"]/Block/DoWhileStatement/Literal'
    ]
];

function isException(sample: string, fun: sol.FunctionDefinition, element: sol.ASTNode): boolean {
    const xp = new sol.XPath(fun);
    for (const [excFile, excFun, selector] of exceptions) {
        if (!sample.endsWith(excFile) || excFun !== fun.name) {
            continue;
        }

        const res = xp.query(selector);

        for (const o of res) {
            if (o.id === element.id) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Hacky helper to check if a (potentially compound) statement doesnt fall through
 */
function isFallThrough(s: sol.Statement | sol.Block | sol.UncheckedBlock): boolean {
    if (s instanceof sol.Statement) {
        if (
            s instanceof sol.Return ||
            s instanceof sol.RevertStatement ||
            s instanceof sol.Throw ||
            s instanceof sol.Break ||
            s instanceof sol.Continue
        ) {
            return false;
        }

        if (s instanceof sol.IfStatement) {
            if (
                !isFallThrough(s.vTrueBody) &&
                s.vFalseBody !== undefined &&
                !isFallThrough(s.vFalseBody)
            ) {
                return false;
            }
        }

        if (s instanceof sol.TryCatchClause && !isFallThrough(s.vBlock)) {
            return false;
        }
    } else {
        for (const child of s.vStatements) {
            if (!isFallThrough(child)) {
                return false;
            }
        }
    }

    return true;
}

function binIdRelnToGraph(facts: dl.Fact[]): NdGraph {
    const res = new Map();
    for (const f of facts) {
        const [prev, next] = f.fields as [number, number];

        if (!res.has(prev)) {
            res.set(prev, new Set());
        }

        (res.get(prev) as Set<number>).add(next);
    }

    return res;
}

function getReachability(g: NdGraph, start: number): Reachable {
    const res: Reachable = new Set();
    const q: number[] = [start];

    while (q.length > 0) {
        const cur = q.pop() as number;

        if (res.has(cur)) {
            continue;
        }

        res.add(cur);

        let neighbors = g.get(cur);
        neighbors = neighbors === undefined ? new Set<number>() : neighbors;

        q.push(...neighbors);
    }

    return res;
}

export function dumpFacts(fs: dl.Fact[]): void {
    for (const f of fs) {
        console.error(f.pp());
    }
}

function isInsideArrayTypename(element: sol.ASTNode): boolean {
    // Ignore literals inside array typenames (e.g. uint[4]).
    if (element.getClosestParentByType(sol.ArrayTypeName) !== undefined) {
        return true;
    }

    // Note sometimes array typenames for user-defined
    // types appear as IndexExpressions
    if (element.getClosestParentByType(sol.IndexAccess) !== undefined) {
        const t = element.getClosestParentByType(sol.IndexAccess) as sol.IndexAccess;

        if (t.typeString.startsWith("type(")) {
            return true;
        }
    }

    return false;
}

describe("Test succ relation for all samples", () => {
    for (const sample of samples) {
        describe(sample, () => {
            let units: sol.SourceUnit[];
            let infer: sol.InferType;
            let contents: Buffer;
            let succ: dl.Fact[];
            let succFirst: NdGraph;
            let g: NdGraph;

            before(async () => {
                contents = fse.readFileSync(sample);
                const result = await sol.compileSol(sample, "auto");

                const data = result.data;
                const errors = sol.detectCompileErrors(data);

                expect(errors).toHaveLength(0);

                const reader = new sol.ASTReader();

                units = reader.read(data);

                expect(units.length).toBeGreaterThanOrEqual(1);

                infer = new sol.InferType(result.compilerVersion as string);

                const res = await analyze(
                    units,
                    infer,
                    "csv",
                    ["cfg.succ.succ", "cfg.succ.succ_first"].map(getRelation)
                );
                const facts = await res.allFacts();
                //instance.release();
                succ = facts.get("cfg.succ.succ") as dl.Fact[];
                succFirst = binIdRelnToGraph(facts.get("cfg.succ.succ_first") as dl.Fact[]);
                g = binIdRelnToGraph(succ);

                if (verbose) {
                    const ctx = reader.context;

                    console.error(`Succ: `);
                    for (const f of succ) {
                        const [prev, next] = f.fields as [number, number];

                        const prevNd = ctx.locate(prev) as sol.ASTNode;
                        const nextNd = ctx.locate(next) as sol.ASTNode;

                        const prevStr = prevNd.extractSourceFragment(contents);
                        const nextStr = nextNd.extractSourceFragment(contents);

                        console.error(
                            `${prevNd.id} -> ${nextNd.id} (prev: |${prevStr}| next: ${nextStr})`
                        );
                    }
                }
            });

            it("Every expression/statement inside a function body is reachable", () => {
                for (const unit of units) {
                    for (const fun of unit.getChildrenByType(sol.FunctionDefinition)) {
                        if (fun.vBody === undefined) {
                            continue;
                        }

                        const firstIdSet = succFirst.get(fun.vBody.id);

                        if (verbose && (firstIdSet === undefined || firstIdSet.size !== 1)) {
                            console.error(
                                `Couldnt find single entry for ${fun.name} body #${
                                    fun.vBody.id
                                }: ${sol.pp(firstIdSet)}`
                            );
                        }
                        expect(firstIdSet !== undefined && firstIdSet.size === 1).toBeTruthy();

                        const firstId = [...(firstIdSet as Set<number>)][0];
                        const reachable = getReachability(g, firstId);

                        for (const element of fun.vBody.getChildren(true)) {
                            // Only consider statements, blocks and expressions
                            if (
                                !(
                                    element instanceof sol.Expression ||
                                    element instanceof sol.Statement ||
                                    element instanceof sol.StatementWithChildren
                                )
                            ) {
                                continue;
                            }

                            if (isInsideArrayTypename(element)) {
                                continue;
                            }

                            // Skip blocks ending in a non-fallthrough statements -they are not reachable from the entry of the function
                            if (
                                (element instanceof sol.Block ||
                                    element instanceof sol.UncheckedBlock ||
                                    element instanceof sol.TryCatchClause) &&
                                !isFallThrough(element)
                            ) {
                                continue;
                            }

                            if (reachable.has(element.id)) {
                                continue;
                            }

                            // This is a legit exception
                            if (isException(sample, fun, element)) {
                                continue;
                            }

                            if (verbose) {
                                console.error(
                                    `Node ${element.extractSourceFragment(contents)} (${
                                        element.constructor.name
                                    }#${element.id}) not reachable from body (#${firstId}) of ${
                                        fun.name
                                    }`
                                );
                            }

                            expect(false).toBeTruthy();
                        }
                    }
                }
            });

            it("The only nodes without a succ are terminator nodes and the function body", () => {
                for (const unit of units) {
                    for (const fun of unit.getChildrenByType(sol.FunctionDefinition)) {
                        if (fun.vBody === undefined) {
                            continue;
                        }

                        for (const element of fun.vBody.getChildren()) {
                            if (
                                !(
                                    element instanceof sol.Expression ||
                                    element instanceof sol.Statement ||
                                    element instanceof sol.StatementWithChildren
                                )
                            ) {
                                continue;
                            }

                            if (isInsideArrayTypename(element)) {
                                continue;
                            }

                            const succs = g.get(element.id);

                            if (succs === undefined || succs.size === 0) {
                                if (
                                    verbose &&
                                    !(
                                        element === fun.vBody ||
                                        element instanceof sol.Return ||
                                        element instanceof sol.Throw ||
                                        element instanceof sol.RevertStatement
                                    )
                                ) {
                                    console.error(
                                        `Unexpected element ${sol.pp(
                                            element
                                        )} (|${element.extractSourceFragment(
                                            contents
                                        )}|)without succ in ${fun.name}`
                                    );
                                }
                                expect(
                                    element === fun.vBody ||
                                        element instanceof sol.Return ||
                                        element instanceof sol.Throw ||
                                        element instanceof sol.RevertStatement
                                ).toBeTruthy();
                            }
                        }
                    }
                }
            });
        });
    }
});
