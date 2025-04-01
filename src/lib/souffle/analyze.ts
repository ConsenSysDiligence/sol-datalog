import * as sol from "solc-typed-ast";
import * as dl from "souffle.ts";
import { facts } from "../translate";
import { COMPILED_BINARY } from "./compile";

/**
 * Helper function to analyze a bunch of solc-typed-ast SourceUnits and output some of the relations
 */
export async function analyze(
    units: sol.SourceUnit[],
    infer: sol.InferType,
    mode: dl.SouffleOutputType,
    outputRelations: dl.Relation[]
): Promise<dl.FactSet> {
    const inputFS = facts(units, infer);
    const outputFS = new dl.CSVFactSet(outputRelations);

    await dl.runCompiled(inputFS, outputFS, COMPILED_BINARY);
    inputFS.release();
    return outputFS;
}
