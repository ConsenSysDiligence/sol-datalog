import { assert, ASTContext, ASTNode, ASTNodeConstructor } from "solc-typed-ast";
import * as DL from "souffle.ts";
import { pp } from "./pp";

export type RelationFieldT = ASTNodeConstructor<ASTNode> | string;
export type RelationField = ASTNode | string | number | boolean | ASTNode[];

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
        if (type.name === "NumPath") {
            const res: ASTNode[] = [];

            while (val !== null) {
                const node = ctx.locate(Number((val as DL.RecordVal).head));
                res.push(node);
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

    fmt(message: string, files?: Map<number, Uint8Array>): string {
        for (let i = 0; i < this.args.length; i++) {
            const detail = this.args[i];
            const part = pp(detail);

            message = message.replace(
                new RegExp("\\{" + i + "\\}([.a-zA-Z0-9_]*)", "g"),
                (match, p) => {
                    if (p.length === 0) {
                        return pp(detail);
                    }

                    const components = p.split(".");
                    let val: any = detail;
                    for (const comp of components) {
                        if (comp.length === 0) {
                            continue;
                        }

                        // Special case - if its .source then extract the corresponding source fragment
                        if (comp === "source") {
                            const unitId = Number(val["src"].split(":")[2]);
                            assert(
                                files !== undefined,
                                `Need a source map to decode source format`
                            );
                            const source = files.get(unitId);
                            assert(
                                source !== undefined,
                                `Unknown source for SourceUnit with id ${unitId}`
                            );
                            val = new TextDecoder("utf-8")
                                .decode((val as ASTNode).extractSourceFragment(source))
                                .replaceAll("\n", "\\n");

                            continue;
                        }

                        val = val[comp];
                    }

                    return pp(val);
                }
            );
            message = message.replace(new RegExp("\\{" + i + "\\}", "g"), part);
        }

        return message;
    }
}
