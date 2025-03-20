import * as dl from "souffle.ts";

export const ANALYSES_DIR = __dirname;

export const IdT = new dl.SubT("id", dl.NumberT);
export const ContractDefinitionId = new dl.SubT("ContractDefinitionId", IdT);
export const ExpressionId = new dl.SubT("ExpressionId", IdT);
export const VariableDeclarationId = new dl.SubT("VariableDeclarationId", IdT);
export const StatementId = new dl.SubT("StatementId", IdT);
export const ModifierDefinitionId = new dl.SubT("ModifierDefinitionId", IdT);
export const FunctionDefinitionId = new dl.SubT("FunctionDefinitionId", IdT);

const NumPathT = new dl.RecordT("NumPath", [["head", dl.NumberT]]);
// Note NumPathT is recursive
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
    new dl.Relation("access.writeExpr", [
        ["eId", ExpressionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.writeStmt", [
        ["sId", StatementId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.writeModifier", [
        ["mId", ModifierDefinitionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.writeFunction", [
        ["fId", FunctionDefinitionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.readExpr", [
        ["eId", ExpressionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.readStmt", [
        ["sId", StatementId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.readModifier", [
        ["mId", ModifierDefinitionId],
        ["vId", VariableDeclarationId]
    ]),
    new dl.Relation("access.readFunction", [
        ["fId", FunctionDefinitionId],
        ["vId", VariableDeclarationId]
    ])
];

const NAME_TO_RELN = new Map<string, dl.Relation>(AVAILABLE_ANALYSES.map((r) => [r.name, r]));

export function getRelation(name: string): dl.Relation {
    const res = NAME_TO_RELN.get(name);
    dl.assert(res !== undefined, `Unknown analysis relation ${name}`);
    return res;
}
