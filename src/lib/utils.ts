import * as sol from "solc-typed-ast";
import fse from "fs-extra";
import path from "path";

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

export function sanitizeString(s: string): string {
    // For various compiler versions a string may be missing in the AST
    if (s === null || s === undefined) {
        s = "";
    }

    return s
        .replaceAll('"', "'") // Only single quotes
        .replaceAll("\n", "\\n") // Escape new lines
        .replaceAll("\r", "\\r") // Escape carriage return
        .replaceAll(/[^\x20-\x7E]+/g, ""); // Remove remaining unicode characters
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

    console.trace();

    throw new Error(`Don't know how to translate ${a}`);
}

export function translateVals(...a: any[]): string[] {
    // console.error(`translateVals`, a);
    return a.map(translateVal);
}

export function searchRecursive(targetPath: string, filter: (entry: string) => boolean): string[] {
    const stat = fse.statSync(targetPath);
    const results: string[] = [];

    if (stat.isFile()) {
        if (filter(targetPath)) {
            results.push(path.resolve(targetPath));
        }

        return results;
    }

    for (const entry of fse.readdirSync(targetPath)) {
        const resolvedEntry = path.resolve(targetPath, entry);
        const stat = fse.statSync(resolvedEntry);

        if (stat.isDirectory()) {
            results.push(...searchRecursive(resolvedEntry, filter));
        } else if (stat.isFile() && filter(resolvedEntry)) {
            results.push(resolvedEntry);
        }
    }

    return results;
}
