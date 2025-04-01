import * as dl from "souffle.ts";
import {
    ContractDefinitionId,
    ExpressionId,
    FunctionCallId,
    FunctionDefinitionId,
    ModifierDefinitionId,
    StatementId,
    VariableDeclarationId
} from "../../gen/ast_relations";

export const ANALYSES_DIR = __dirname;

export const IdT = new dl.SubT("id", dl.NumberT);

const NumPathT = new dl.RecordT("NumPath", [["head", dl.NumberT]]);
const LocT = new dl.ADTT("Loc", [
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
LocT.branches[1][1][0][1] = LocT;
LocT.branches[2][1][0][1] = LocT;
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
    new dl.Relation("cfg.domStmt.path", [
        ["pred", IdT],
        ["succ", IdT],
        ["path", NumPathT]
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
    new dl.Relation("cfg.succ.succ_first", [
        ["prev", IdT],
        ["next", IdT]
    ]),
    new dl.Relation("access.writes", [
        ["id", IdT],
        ["loc", LocT]
    ]),
    new dl.Relation("access.writesVar", [
        ["id", IdT],
        ["varId", VariableDeclarationId],
        ["loc", LocT]
    ]),
    new dl.Relation("access.writesFunction", [
        ["fId", FunctionDefinitionId],
        ["varId", VariableDeclarationId],
        ["nod", IdT],
        ["loc", LocT]
    ]),
    new dl.Relation("access.readExpr", [
        ["eId", ExpressionId],
        ["vId", VariableDeclarationId],
        ["locId", IdT]
    ]),
    new dl.Relation("access.readStmt", [
        ["sId", StatementId],
        ["vId", VariableDeclarationId],
        ["locId", IdT]
    ]),
    new dl.Relation("access.readModifier", [
        ["mId", ModifierDefinitionId],
        ["vId", VariableDeclarationId],
        ["locId", IdT]
    ]),
    new dl.Relation("access.readFunction", [
        ["fId", FunctionDefinitionId],
        ["vId", VariableDeclarationId],
        ["locId", IdT]
    ]),
    new dl.Relation("access.readFunction", [
        ["fId", FunctionDefinitionId],
        ["vId", VariableDeclarationId],
        ["locId", IdT]
    ]),
    new dl.Relation("hasParam", [
        ["fId", FunctionDefinitionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("hasModifier", [
        ["fId", FunctionDefinitionId],
        ["vId", ModifierDefinitionId]
    ])
];

const NAME_TO_RELN = new Map<string, dl.Relation>(AVAILABLE_ANALYSES.map((r) => [r.name, r]));

export function getRelation(name: string): dl.Relation {
    const res = NAME_TO_RELN.get(name);
    dl.assert(res !== undefined, `Unknown analysis relation ${name}`);
    return res;
}
