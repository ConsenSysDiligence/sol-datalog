import os from "os";
import fse from "fs-extra";
import * as sol from "solc-typed-ast";
import { searchRecursive } from "../utils";
import { ANALYSES_DIR, AVAILABLE_ANALYSES } from "../analyses";
import { DETECTORS_DIR } from "../detectors";
import { GEN_DIR } from "../../gen";
import * as dl from "souffle.ts";
import { join } from "path";
import { spawnSync } from "child_process";
import { FUNCTORS_DIR } from "../../functors";
import { facts } from "../translate";
import { INPUT_RELATIONS } from "../../gen/ast_facts";

export type OutputRelations = Map<string, dl.Fact[]>;

function getDLFromFolder(folder: string): string {
    const fileNames = searchRecursive(folder, (f) => f.endsWith(".dl"));

    const contents = fileNames.map(
        (fileName) => `////// ${fileName} \n` + fse.readFileSync(fileName, { encoding: "utf-8" })
    );

    return contents.join("\n");
}

function getAnalyses(): string {
    return getDLFromFolder(ANALYSES_DIR);
}

function getDetectors(): string {
    return getDLFromFolder(DETECTORS_DIR);
}

export function buildDatalog(): string {
    const ast = fse.readFileSync(join(GEN_DIR, "ast.dl"), { encoding: "utf-8" });
    const analyses = getAnalyses();
    const detectors = getDetectors();
    return [
        "// ======= AST Declarations =======",
        ast,
        "// ======= ANALYSIS RELS =======",
        analyses,
        "// ======= DETECTORS RELS =======",
        detectors,
        "// ======= INPUT DIRECTIVES ====",
        ...INPUT_RELATIONS.map(
            (reln) => `.input ${reln.name}(IO=file, filename="${reln.name}.csv", rfc4180=true)`
        ),
        "// ======= OUTPUT DIRECTIVES ====",
        ...AVAILABLE_ANALYSES.map(
            (reln) => `.output ${reln.name}(IO=file, filename="${reln.name}.csv", rfc4180=true)`
        )
    ].join("\n");
}

export const COMPILED_BINARY = join(GEN_DIR, "analyze");

export function compileDatalog(): void {
    const sysTmpDir = os.tmpdir();
    const tmpDir = fse.mkdtempSync(join(sysTmpDir, "sol-datalog-"));
    const inputFile = join(tmpDir, "input.dl");

    const dl = buildDatalog();
    fse.writeFileSync(inputFile, dl);

    const result = spawnSync("souffle", [inputFile, `-L${FUNCTORS_DIR}`, "-o", COMPILED_BINARY], {
        encoding: "utf-8"
    });

    if (result.status !== 0) {
        throw new Error(
            `Souffle terminated with non-zero exit code (${result.status}): ${result.stderr}`
        );
    }
}

/**
 * Helper function to analyze a bunch of solc-typed-ast SourceUnits and output some of the relations
 */
export async function analyze(
    units: sol.SourceUnit[],
    infer: sol.InferType,
    mode: dl.SouffleOutputType,
    outputRelations: dl.Relation[]
): Promise<dl.FactSet> {
    if (!fse.existsSync(COMPILED_BINARY)) {
        compileDatalog();
    }

    const inputFS = facts(units, infer);
    const outputFS = new dl.CSVFactSet(outputRelations);

    await dl.runCompiled(inputFS, outputFS, COMPILED_BINARY, FUNCTORS_DIR);
    inputFS.release();
    return outputFS;
}
