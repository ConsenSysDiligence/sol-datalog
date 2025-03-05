import * as sol from "solc-typed-ast";
import * as rlns from "../gen/ast_facts";
import { accumulateNodeFacts } from "../gen";
import { CSVFactSet, Fact, FactSet } from "souffle.ts";

export function facts(units: sol.SourceUnit[], infer: sol.InferType): FactSet {
    const fs = new CSVFactSet(rlns.INPUT_RELATIONS);
    fs.initializeEmpty();

    for (const unit of units) {
        unit.walk((nd) => translateNode(nd, infer, fs));
    }

    const version = infer.version.split(".").map((x) => Number(x));

    sol.assert(version.length === 3, `Expected version tripple not ${infer.version}`);
    fs.addFacts(
        new Fact(rlns.CompilerVersion, [Number(version[0]), Number(version[1]), Number(version[2])])
    );

    return fs;
}

function translateNode(nd: sol.ASTNode, infer: sol.InferType, fs: FactSet): void {
    if (nd.parent) {
        fs.addFacts(new Fact(rlns.parent, [nd.parent.id, nd.id]));
    }

    accumulateNodeFacts(nd, infer, fs);
}
