import expect from "expect";
import fse from "fs-extra";
import * as sol from "solc-typed-ast";
import { analyze, getRelation } from "../src";
import { Fact, makeFileMap, searchRecursive } from "../src/lib/utils";
import * as dl from "souffle.ts";

const samples = searchRecursive("test/samples/analyses", (fileName) => fileName.endsWith(".json"));

interface AnalysesTest {
    [relation: string]: {
        fmt: string;
        data: string[];
    };
}
/**
 * Remove duplicate rows.
 */

/**
 * Sanitize the facts for a given relation by converting all non-primitive
 * columns to null and removing duplicate rows.
 *
 * We do this before comparing, since some path facts may be non-deterministic.
 */
export function sanitize(relation: dl.Relation, facts: any[][]): any[][] {
    const nonPrimitiveFieldIdxs: Set<number> = new Set(
        relation.fields
            .map(([, type], i) => [type, i] as [dl.DatalogType, number])
            .filter(([type]) => !dl.isPrimitiveType(type))
            .map(([, idx]) => idx)
    );

    return facts.map((values) =>
        values.map((v, idx) => (nonPrimitiveFieldIdxs.has(idx) ? null : v))
    );
}

describe("Analyses", () => {
    for (const json of samples) {
        const sample = json.replace(".json", ".sol");

        describe(sample, () => {
            let units: sol.SourceUnit[];
            let expectedOutput: AnalysesTest;
            let reader: sol.ASTReader;
            let version: string;
            let fileMap: Map<number, Uint8Array>;

            before(async () => {
                reader = new sol.ASTReader();
                const result = await sol.compileSol(sample, "auto");

                const data = result.data;
                const errors = sol.detectCompileErrors(data);

                expect(errors).toHaveLength(0);
                version = result.compilerVersion as string;

                units = reader.read(data);

                expect(units.length).toBeGreaterThanOrEqual(1);

                expectedOutput = fse.readJSONSync(json, {
                    encoding: "utf-8"
                }) as AnalysesTest;

                fileMap = makeFileMap(units);
            });

            it("Analyses expected results", async () => {
                const targetAnalyses = [...Object.keys(expectedOutput).map(getRelation)];
                const infer = new sol.InferType(version);
                const res = await analyze(units, infer, "csv", targetAnalyses);

                const facts = await res.allFacts();
                res.release();

                for (const [key, val] of Object.entries(expectedOutput)) {
                    const received = (facts.get(key) as dl.Fact[]).map((f) =>
                        new Fact(f, reader.context).fmt(val.fmt, fileMap)
                    );

                    expect(received).toEqual(val.data);
                }
            });
        });
    }
});
