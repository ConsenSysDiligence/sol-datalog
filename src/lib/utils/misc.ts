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

export function zip<T1, T2>(x: T1[], y: T2[]): Array<[T1, T2]> {
    const res: Array<[T1, T2]> = [];

    for (let i = 0; i < x.length; i++) {
        res.push([x[i], y[i]]);
    }

    return res;
}

export function chunk<T>(arr: T[], chunkSize: number): T[][] {
    const res: T[][] = [];
    let chunk: T[] = [];

    for (const x of arr) {
        if (chunk.length === chunkSize) {
            res.push(chunk);
            chunk = [];
        }

        chunk.push(x);
    }

    if (chunk.length > 0) {
        res.push(chunk);
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

export function translateVal(a: any): string {
    if (typeof a === "string") {
        return a;
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

export function makeFileMap(units: sol.SourceUnit[]): Map<number, Uint8Array> {
    const fileMap = new Map();

    for (const unit of units) {
        const unitSource = fse.readFileSync(unit.absolutePath);
        fileMap.set(unit.sourceListIndex, unitSource);
    }

    return fileMap;
}
