import * as sol from "solc-typed-ast";
import fse from "fs-extra";
import path from "path";

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
