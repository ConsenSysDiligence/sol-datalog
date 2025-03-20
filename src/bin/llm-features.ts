#!/usr/bin/env node
import { Command } from "commander";
import fse from "fs-extra";
import {
    ASTReader,
    CACHE_DIR,
    CompilationOutput,
    CompileFailedError,
    CompileResult,
    CompilerKind,
    CompilerVersions,
    InferType,
    LatestCompilerVersion,
    PathOptions,
    PossibleCompilerKinds,
    compileJson,
    compileJsonData,
    compileSol,
    compileSourceString,
    downloadSupportedCompilers,
    isExact
} from "solc-typed-ast";
import {
    analyze,
    FunctionDefinitionId,
    getRelation,
    ModifierDefinitionId,
    VariableDeclarationId
} from "../lib";
import { Fact } from "../lib/utils";
import { Relation } from "souffle.ts";

const pkg = require("../../package.json");

enum CompileMode {
    Auto = "auto",
    Sol = "sol",
    Json = "json"
}

const compileModes = Object.values(CompileMode);

async function main() {
    const program = new Command();

    program
        .name("llm-features")
        .description(pkg.description)
        .version(pkg.version, "-v, --version", "Print package version")
        .helpOption("-h, --help", "Print help message");

    program.argument(
        "[file(s)]",
        "Either one or more Solidity files, one JSON compiler output file."
    );

    program
        .option("--solidity-versions", "Print information about supported Solidity versions.")
        .option("--stdin", "Read input from STDIN instead of files.")
        .option(
            "--mode <mode>",
            `One of the following input modes: "${CompileMode.Sol}" (Solidity source), "${CompileMode.Json}" (JSON compiler artifact), "${CompileMode.Auto}" (try to detect by file extension)`,
            CompileMode.Auto
        )
        .option(
            "--compiler-version <compilerVersion>",
            `Solc version to use: ${LatestCompilerVersion} (exact SemVer version specifier), auto (try to detect suitable compiler version)`,
            "auto"
        )
        .option(
            "--compiler-kind <compilerKind>",
            `Type of Solidity compiler to use. Currently supported values are "${CompilerKind.WASM}" or "${CompilerKind.Native}".`,
            CompilerKind.WASM
        )
        .option("--path-remapping <pathRemapping>", "Path remapping input for Solc.")
        .option("--base-path <basePath>", "Base path for compiler to look for files Solc.")
        .option(
            "--include-path <includePath...>",
            "Include paths for compiler to additinally look for files. Supports multiple entries."
        )
        .option(
            "--compiler-settings <compilerSettings>",
            `Additional settings passed to the solc compiler in the form of a JSON string (e.g. '{"optimizer": {"enabled": true, "runs": 200}}'). Note the double quotes. For more details see https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description.`
        )
        .option(
            "--locate-compiler-cache",
            "Print location of current compiler cache directory (used to store downloaded compilers)."
        )
        .option(
            "--download-compilers <compilerKind...>",
            `Download specified kind of supported compilers to compiler cache. Supports multiple entries.`
        );

    program.parse(process.argv);

    const args = program.args;
    const options = program.opts();

    if (options.solidityVersions) {
        const message = [
            "Latest supported version: " + LatestCompilerVersion,
            "",
            `All supported versions (${CompilerVersions.length} total):`,
            ...CompilerVersions
        ].join("\n");

        console.log(message);

        return;
    }

    if (options.locateCompilerCache) {
        console.log(CACHE_DIR);

        return;
    }

    if (options.downloadCompilers) {
        const compilerKinds = options.downloadCompilers.map((kind: string): CompilerKind => {
            if (PossibleCompilerKinds.has(kind)) {
                return kind as CompilerKind;
            }

            throw new Error(
                `Invalid compiler kind "${kind}". Possible values: ${[
                    ...PossibleCompilerKinds.values()
                ].join(", ")}.`
            );
        });

        console.log(
            `Downloading compilers (${compilerKinds.join(", ")}) to current compiler cache:`
        );

        for await (const compiler of downloadSupportedCompilers(compilerKinds)) {
            console.log(`${compiler.path} (${compiler.constructor.name} v${compiler.version})`);
        }

        return;
    }

    if (options.help || (!args.length && !options.stdin)) {
        console.log(program.helpInformation());

        return;
    }

    const stdin: boolean = options.stdin;
    const mode: CompileMode = options.mode;
    const compilerKind: CompilerKind = options.compilerKind;

    if (!PossibleCompilerKinds.has(compilerKind)) {
        throw new Error(
            `Invalid compiler kind "${compilerKind}". Possible values: ${[
                ...PossibleCompilerKinds.values()
            ].join(", ")}.`
        );
    }

    if (!compileModes.includes(mode)) {
        throw new Error(`Invalid mode "${mode}". Possible values: ${compileModes.join(", ")}.`);
    }

    const compilerVersion: string = options.compilerVersion;

    if (!(compilerVersion === "auto" || isExact(compilerVersion))) {
        const message = [
            `Invalid compiler version "${compilerVersion}".`,
            'Possible values: "auto" or exact version string.'
        ].join(" ");

        throw new Error(message);
    }

    const pathOptions: PathOptions = {
        remapping: options.pathRemapping ? options.pathRemapping.split(";") : [],
        basePath: options.basePath,
        includePath: options.includePath
    };

    let compilerSettings: any = undefined;

    if (options.compilerSettings) {
        try {
            compilerSettings = JSON.parse(options.compilerSettings);
        } catch (e) {
            throw new Error(
                `Invalid compiler settings '${options.compilerSettings}'. Compiler settings must be a valid JSON object (${e}).`
            );
        }
    }

    const compilationOutput: CompilationOutput[] = [CompilationOutput.ALL];

    let result: CompileResult;

    try {
        if (stdin) {
            if (mode === "auto") {
                throw new Error(
                    'Mode "auto" is not supported for the input from STDIN. Explicitly specify "mode" as "sol" or "json" instead.'
                );
            }

            const fileName = "stdin";
            const content = await fse.readFile(process.stdin.fd, { encoding: "utf-8" });

            result =
                mode === "json"
                    ? await compileJsonData(
                          fileName,
                          JSON.parse(content),
                          compilerVersion,
                          compilationOutput,
                          compilerSettings,
                          compilerKind
                      )
                    : await compileSourceString(
                          fileName,
                          content,
                          compilerVersion,
                          pathOptions,
                          compilationOutput,
                          compilerSettings,
                          compilerKind
                      );
        } else {
            const fileNames = args;
            const singleFileName = fileNames[0];
            const iSingleFileName = singleFileName.toLowerCase();

            let isSol: boolean;
            let isJson: boolean;

            if (mode === "auto") {
                isSol = iSingleFileName.endsWith(".sol");
                isJson = iSingleFileName.endsWith(".json");
            } else {
                isSol = mode === "sol";
                isJson = mode === "json";
            }

            if (isSol) {
                result = await compileSol(
                    fileNames,
                    compilerVersion,
                    pathOptions,
                    compilationOutput,
                    compilerSettings,
                    compilerKind
                );
            } else if (isJson) {
                result = await compileJson(
                    singleFileName,
                    compilerVersion,
                    compilationOutput,
                    compilerSettings,
                    compilerKind
                );
            } else {
                throw new Error("Unable to auto-detect mode by the file name: " + singleFileName);
            }
        }
    } catch (e: any) {
        if (e instanceof CompileFailedError) {
            console.error("Compile errors encountered:");

            for (const failure of e.failures) {
                console.error(
                    failure.compilerVersion
                        ? `SolcJS ${failure.compilerVersion}:`
                        : "Unknown compiler:"
                );

                for (const error of failure.errors) {
                    console.error(error);
                }
            }

            throw new Error("Unable to compile due to errors above.");
        }

        throw e;
    }

    const reader = new ASTReader();
    const units = reader.read(result.data);
    const infer = new InferType(result.compilerVersion as string);

    const templates = new Map<string, string>([
        ["inh.inheritsStrict", "Contract {0}.name inherits from contract {1}.name"],
        ["hasParam", "Function {0}.name has parameter {1}.name"],
        ["hasModifier", "Function {0}.name has modifier {1}.name"],
        ["access.readFunction", "Function {0}.name reads variable {1}.name at location {2}"],
        ["access.writeFunction", "Function {0}.name writes variable {1}.name at location {2}"],
        ["cg.path", "Function {0}.name calls callable {1}.name via {2}"]
    ]);

    const outputAnalysesNames = [
        "inh.inheritsStrict",
        "access.readFunction",
        "access.writeFunction",
        "cg.edge"
    ];

    const outputAnalyses = outputAnalysesNames.map(getRelation);
    outputAnalyses.push(
        new Relation("hasParam", [
            ["fId", FunctionDefinitionId],
            ["vId", VariableDeclarationId]
        ]),
        new Relation("hasModifier", [
            ["fId", FunctionDefinitionId],
            ["vId", ModifierDefinitionId]
        ])
    );

    const res = await analyze(units, infer, "csv", outputAnalyses);
    const output = await res.allFacts();
    res.release();

    for (const relation of outputAnalyses) {
        const facts = output.get(relation.name);

        if (!facts) {
            continue;
        }

        for (const fact of facts) {
            const f = new Fact(fact, reader.context);
            console.log(f.fmt(templates.get(relation.name) as string));
        }
    }
    return;
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((e) => {
        console.error(e.message);

        process.exit(1);
    });
