import {
    assert,
    ASTContext,
    ASTNode,
    ASTNodeConstructor,
    ContractDefinition,
    FunctionDefinition,
    pp
} from "solc-typed-ast";
import * as DL from "souffle.ts";

export type RelationFieldT = ASTNodeConstructor<ASTNode> | string;
export type RelationField = ASTNode | string | number | boolean | string[];

const stringTypeAliases = new Set([
    "ContractKind",
    "LiteralKind",
    "TimeUnit",
    "EtherUnit",
    "FunctionCallKind",
    "DataLocation",
    "Mutability",
    "FunctionStateMutability",
    "FunctionKind",
    "ModifierInvocationKind",
    "StateVariableVisibility",
    "FunctionVisibility",
    "ElementaryTypeNameMutability",
    "SubdenominationT"
]);

function liftValue(val: DL.FieldVal, type: DL.DatalogType, ctx: ASTContext): RelationField {
    if (type === DL.SymbolT) {
        assert(typeof val === "string", `Type mismatch. Expected string not {0}`, val as any);
        return val;
    }

    if (type === DL.NumberT) {
        assert(typeof val === "number", `Type mismatch. Expected string not {0}`, val as any);
        return val;
    }

    if (type instanceof DL.SubT) {
        if (type.name === "bool") {
            assert(typeof val === "number", `Type mismatch. Expected number not {0}`, val as any);
            return val === 1;
        }

        if (stringTypeAliases.has(type.name)) {
            assert(typeof val === "string", `Type mismatch. Expected string not {0}`, val as any);
            return val;
        }
        if (type.name === "id" || type.name.endsWith("Id")) {
            // ASTNode
            assert(typeof val === "number", `Type mismatch. Expected number not {0}`, val as any);
            return ctx.locate(val);
        }

        if (type.name.endsWith("Id")) {
            // ASTNode
            assert(typeof val === "number", `Type mismatch. Expected number not {0}`, val as any);
            return ctx.locate(val);
        }
    }

    if (type instanceof DL.RecordT) {
        if (type.name === "CallPath") {
            const res: string[] = [];

            while (val !== null) {
                const fun = ctx.locate(Number((val as DL.RecordVal).head)) as FunctionDefinition;
                const name =
                    fun.vScope instanceof ContractDefinition
                        ? `${fun.vScope.name}:${fun.name}`
                        : fun.name;
                res.push(name);
                val = (val as DL.RecordVal).tail;
            }

            return res;
        }
    }

    assert(false, `Unknown datalog type ${type.name}`);
}

export class Fact {
    public readonly relation: DL.Relation;
    public readonly args: RelationField[];

    constructor(fact: DL.Fact, ctx: ASTContext) {
        this.relation = fact.relation;
        this.args = fact.fields.map((val, i) => liftValue(val, this.relation.fields[i][1], ctx));
    }

    fmt(message: string): string {
        for (let i = 0; i < this.args.length; i++) {
            const detail = this.args[i];
            const part = pp(detail);

            message = message.replace(
                new RegExp("\\{" + i + "\\}.name", "g"),
                (detail as any).name
            );
            message = message.replace(new RegExp("\\{" + i + "\\}", "g"), part);
        }

        return message;
    }
}
