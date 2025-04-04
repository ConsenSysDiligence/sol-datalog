import * as sol from "solc-typed-ast";

export interface PPAble {
    pp(): string;
}

export type PPIsh =
    | PPAble
    | string
    | number
    | boolean
    | bigint
    | null
    | undefined
    | PPIsh[]
    | { [key: string]: PPIsh }
    | Set<PPIsh>
    | Map<PPIsh, PPIsh>
    | Iterable<PPIsh>
    | sol.ASTNode;

export function isPPAble(value: any): value is PPAble {
    return value ? typeof value.pp === "function" : false;
}

export function pp(value: PPIsh): string {
    if (value === undefined) {
        return "<undefined>";
    }

    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint"
    ) {
        return String(value);
    }

    if (isPPAble(value)) {
        return value.pp();
    }

    if (value instanceof Array) {
        return ppArr(value);
    }

    if (value instanceof Set) {
        return ppSet(value);
    }

    if (value instanceof Map) {
        return ppMap(value);
    }

    if (value instanceof sol.ASTNode) {
        if (value instanceof sol.FunctionDefinition) {
            return `${value.vScope instanceof sol.ContractDefinition ? value.vScope.name + ":" : ""}${value.name}`;
        }
        return sol.pp(value);
    }

    if (typeof value === "object") {
        const res: string[] = [];

        for (const [key, val] of Object.entries(value)) {
            res.push(`${key}: ${pp(val)}`);
        }

        return `{${res.join(", ")}}`;
    }

    if (typeof value[Symbol.iterator] === "function") {
        return ppIter(value);
    }

    throw new Error("Unhandled value in pp(): " + String(value));
}

export function ppArr(array: PPIsh[], separator = ",", start = "[", end = "]"): string {
    return start + array.map(pp).join(separator) + end;
}

export function ppIter(iter: Iterable<PPIsh>, separator = ",", start = "[", end = "]"): string {
    const parts: string[] = [];

    for (const part of iter) {
        parts.push(pp(part));
    }

    return start + parts.join(separator) + end;
}

export function ppSet(set: Set<PPIsh>, separator = ",", start = "{", end = "}"): string {
    return ppIter(set, separator, start, end);
}

export function ppMap(
    map: Map<PPIsh, PPIsh>,
    separator = ",",
    keyValueSeparator = ":",
    start = "{",
    end = "}"
): string {
    const parts: string[] = [];

    for (const [name, val] of map.entries()) {
        parts.push(pp(name) + keyValueSeparator + pp(val));
    }

    return start + parts.join(separator) + end;
}
