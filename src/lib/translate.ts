import * as sol from "solc-typed-ast";
import { flatten } from "./utils";
import { preamble, translateASTNodeInternal } from "../gen";

function facts(units: sol.SourceUnit[], infer: sol.InferType): string[] {
    const res = flatten(units.map((unit) => translateUnit(unit, infer)));

    const version = infer.version.split(".").map((x) => Number(x));

    sol.assert(version.length === 3, `Expected version tripple not ${infer.version}`);
    res.push(`CompilerVersion(${version[0]}, ${version[1]}, ${version[2]}).`);

    return res;
}

export function datalogFromUnits(units: sol.SourceUnit[], infer: sol.InferType): string {
    return [
        "// ======= PREAMBLE =======",
        preamble,
        "// ======= FACTS =======",
        ...facts(units, infer)
    ].join("\n");
}

function translateNode(nd: sol.ASTNode, infer: sol.InferType): string[] {
    const res: string[] = [];

    if (nd.parent) {
        res.push(`parent(${nd.parent.id}, ${nd.id}).`);
    }

    res.push(...translateASTNodeInternal(nd, infer));
    return res;
}

function translateUnit(unit: sol.SourceUnit, infer: sol.InferType): string[] {
    const res: string[] = [];

    unit.walk((nd) => res.push(...translateNode(nd, infer)));

    return res;
}
