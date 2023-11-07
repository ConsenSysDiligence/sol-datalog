import * as sol from "solc-typed-ast";

export function flatten<T>(arg: T[][]): T[] {
    const res: T[] = [];
    for (const x of arg) {
        res.push(...x);
    }

    return res;
}

/**
 * Convert a TS list into a datalog "recursive" list.
 */
export function listify(lst: string[]): string {
    if (lst.length === 0) {
        return `nil`;
    }

    return lst.reduceRight((x, y) => `[${y}, ${x}]`, "nil");
}

/**
 * Convert a TS bool into a datalog "bool"
 */
export function boolify(b: boolean): string {
    // For now we define bool in datalog as number
    return b ? "1" : "0";
}

/**
 * Helper to translate a symbol map into the underlying datalog record type
 */
export function translateSymbolsMap(a: Map<string, number>): string {
    if (a.size === 0) {
        return `nil`;
    }

    return [...a.entries()].reduceRight((acc, [name, id]) => `["${name}", ${id}, ${acc}]`, "nil");
}

// Helper class to pass a string to `translateVals` that shouldn't be quoted
export class Literal {
    constructor(public v: string) {}
}

function translateVal(a: any): string {
    if (typeof a === "string") {
        return `"${a}"`;
    }

    if (typeof a === "boolean") {
        return boolify(a);
    }

    if (typeof a === "number") {
        return `${a}`;
    }

    if (a instanceof sol.ASTNode) {
        return `${a.id}`;
    }

    if (a instanceof Array) {
        return listify(a.map(translateVal));
    }

    if (a instanceof Literal) {
        return a.v;
    }

    throw new Error(`Don't know how to translate ${a}`);
}

export function translateVals(...a: any[]): string[] {
    return a.map(translateVal);
}
