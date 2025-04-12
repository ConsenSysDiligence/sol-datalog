import * as dl from "souffle.ts";
import {
    ContractDefinitionId,
    ExpressionId,
    FunctionCallId,
    FunctionDefinitionId,
    ModifierDefinitionId,
    VariableDeclarationId
} from "../../gen/ast_relations";

export const ANALYSES_DIR = __dirname;

export const IdT = new dl.SubT("id", dl.NumberT);

const NumPathT = new dl.RecordT("NumPath", [["head", dl.NumberT]]);
const ShapeT = new dl.ADTT("Shape", [
    ["Var", [["id", VariableDeclarationId]]],
    [
        "Member",
        [
            ["base", null as any],
            ["field", dl.SymbolT]
        ]
    ],
    ["Index", [["base", null as any]]],
    ["FunCall", [["call", FunctionCallId]]]
]);

// Fixup recursive type references
ShapeT.branches[1][1][0][1] = ShapeT;
ShapeT.branches[2][1][0][1] = ShapeT;
//LocT.branches[3][1][0][1] = LocT;

NumPathT.fields.push(["tail", NumPathT]);

export const AVAILABLE_ANALYSES: dl.Relation[] = [
    new dl.Relation("cg.edge", [
        ["from", IdT],
        ["to", IdT]
    ]),
    new dl.Relation("cg.path", [
        ["from", IdT],
        ["to", IdT],
        ["path", NumPathT]
    ]),
    new dl.Relation("inh.inherits", [
        ["childContractId", ContractDefinitionId],
        ["baseContractId", ContractDefinitionId]
    ]),
    new dl.Relation("inh.inheritsStrict", [
        ["childContractId", ContractDefinitionId],
        ["baseContractId", ContractDefinitionId]
    ]),
    new dl.Relation("inh.overrides", [
        ["childNode", IdT],
        ["baseFun", IdT]
    ]),
    new dl.Relation("cfg.dom.path", [
        ["pred", IdT],
        ["succ", IdT],
        ["path", NumPathT]
    ]),
    new dl.Relation("cfg.dominate", [
        ["pred", IdT],
        ["succ", IdT],
        ["path", NumPathT]
    ]),
    new dl.Relation("cfg.succ.succ", [
        ["prev", IdT],
        ["next", IdT]
    ]),
    new dl.Relation("cfg.succ.path", [
        ["prev", IdT],
        ["next", IdT]
    ]),
    new dl.Relation("cfg.succ.succ_first", [
        ["prev", IdT],
        ["next", IdT]
    ]),
    new dl.Relation("access.writesVar", [
        ["id", IdT],
        ["varId", VariableDeclarationId],
        ["loc", ShapeT]
    ]),
    new dl.Relation("access.writesFunction", [
        ["fId", FunctionDefinitionId],
        ["varId", VariableDeclarationId],
        ["nod", IdT],
        ["loc", ShapeT]
    ]),
    new dl.Relation("access.readsVar", [
        ["eId", ExpressionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.readsFunction", [
        ["fId", FunctionDefinitionId],
        ["vId", VariableDeclarationId],
        ["locId", IdT]
    ]),
    new dl.Relation("dataflow.flows", [
        ["from", IdT],
        ["to", IdT],
        ["var", VariableDeclarationId]
    ]),
    new dl.Relation("hasParam", [
        ["fId", FunctionDefinitionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("hasModifier", [
        ["fId", FunctionDefinitionId],
        ["vId", ModifierDefinitionId]
    ]),
    new dl.Relation("accessShape", [
        ["expr", ExpressionId],
        ["varId", VariableDeclarationId],
        ["shape", ShapeT]
    ])
];

const NAME_TO_RELN = new Map<string, dl.Relation>(AVAILABLE_ANALYSES.map((r) => [r.name, r]));

export function getRelation(name: string): dl.Relation {
    const res = NAME_TO_RELN.get(name);
    dl.assert(res !== undefined, `Unknown analysis relation ${name}`);
    return res;
}
