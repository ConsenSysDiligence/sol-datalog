import * as sol from "solc-typed-ast";
import * as rln from "./ast_relations";
import { sanitizeString, translateVal } from "../lib/utils";
import { FactSet, Fact } from "souffle.ts";

export function accumulateNodeFacts(nd: sol.ASTNode, infer: sol.InferType, fs: FactSet): void {
    if (nd instanceof sol.SourceUnit) {
        fs.addFacts(new Fact(rln.SourceUnit, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (const [k, v] of nd.exportedSymbols.entries()) {
            fs.addFacts(new Fact(rln.SourceUnit_exportedSymbols, [nd.id, k, v]));
        }
        fs.addFacts(
            new Fact(rln.SourceUnit_sourceEntryKey, [
                nd.id,
                translateVal(sanitizeString(nd.sourceEntryKey))
            ])
        );
        fs.addFacts(
            new Fact(rln.SourceUnit_sourceListIndex, [nd.id, translateVal(nd.sourceListIndex)])
        );
        fs.addFacts(
            new Fact(rln.SourceUnit_absolutePath, [
                nd.id,
                translateVal(sanitizeString(nd.absolutePath))
            ])
        );
        fs.addFacts(
            new Fact(rln.SourceUnit_license, [
                nd.id,
                translateVal(nd.license === undefined ? "" : sanitizeString(nd.license)),
                translateVal(nd.license !== undefined)
            ])
        );
    } else if (nd instanceof sol.ContractDefinition) {
        fs.addFacts(new Fact(rln.ContractDefinition, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.linearizedBaseContracts.length; i++) {
            const t = nd.linearizedBaseContracts[i];
            fs.addFacts(new Fact(rln.ContractDefinition_linearizedBaseContracts, [nd.id, t, i]));
        }

        for (let i = 0; i < nd.usedErrors.length; i++) {
            const t = nd.usedErrors[i];
            fs.addFacts(new Fact(rln.ContractDefinition_usedErrors, [nd.id, t, i]));
        }

        for (let i = 0; i < nd.usedEvents.length; i++) {
            const t = nd.usedEvents[i];
            fs.addFacts(new Fact(rln.ContractDefinition_usedEvents, [nd.id, t, i]));
        }
        fs.addFacts(
            new Fact(rln.ContractDefinition_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(new Fact(rln.ContractDefinition_scope, [nd.id, translateVal(nd.scope)]));
        fs.addFacts(new Fact(rln.ContractDefinition_kind, [nd.id, translateVal(nd.kind)]));
        fs.addFacts(new Fact(rln.ContractDefinition_abstract, [nd.id, translateVal(nd.abstract)]));
        fs.addFacts(
            new Fact(rln.ContractDefinition_fullyImplemented, [
                nd.id,
                translateVal(nd.fullyImplemented)
            ])
        );
        fs.addFacts(
            new Fact(rln.ContractDefinition_baseSlotExpression, [
                nd.id,
                translateVal(nd.baseSlotExpression === undefined ? -1 : nd.baseSlotExpression),
                translateVal(nd.baseSlotExpression !== undefined)
            ])
        );
    } else if (nd instanceof sol.VariableDeclaration) {
        fs.addFacts(new Fact(rln.VariableDeclaration, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.VariableDeclaration_constant, [nd.id, translateVal(nd.constant)]));
        fs.addFacts(new Fact(rln.VariableDeclaration_indexed, [nd.id, translateVal(nd.indexed)]));
        fs.addFacts(
            new Fact(rln.VariableDeclaration_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(new Fact(rln.VariableDeclaration_scope, [nd.id, translateVal(nd.scope)]));
        fs.addFacts(
            new Fact(rln.VariableDeclaration_stateVariable, [nd.id, translateVal(nd.stateVariable)])
        );
        fs.addFacts(
            new Fact(rln.VariableDeclaration_storageLocation, [
                nd.id,
                translateVal(nd.storageLocation)
            ])
        );
        fs.addFacts(
            new Fact(rln.VariableDeclaration_visibility, [nd.id, translateVal(nd.visibility)])
        );
        fs.addFacts(
            new Fact(rln.VariableDeclaration_mutability, [nd.id, translateVal(nd.mutability)])
        );
        fs.addFacts(
            new Fact(rln.VariableDeclaration_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.VariableDeclaration_typeName, [
                nd.id,
                translateVal(nd.vType === undefined ? -1 : nd.vType),
                translateVal(nd.vType !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.VariableDeclaration_overrideSpecifier, [
                nd.id,
                translateVal(nd.vOverrideSpecifier === undefined ? -1 : nd.vOverrideSpecifier),
                translateVal(nd.vOverrideSpecifier !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.VariableDeclaration_value, [
                nd.id,
                translateVal(nd.vValue === undefined ? -1 : nd.vValue),
                translateVal(nd.vValue !== undefined)
            ])
        );
        if (nd.stateVariable && nd.visibility === sol.StateVariableVisibility.Public) {
            fs.addFacts(
                new Fact(rln.VariableDeclaration_signature, [nd.id, infer.signature(nd)]),
                new Fact(rln.VariableDeclaration_signatureHash, [nd.id, infer.signatureHash(nd)])
            );
        }
    } else if (nd instanceof sol.FunctionDefinition) {
        fs.addFacts(new Fact(rln.FunctionDefinition, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vModifiers.length; i++) {
            const t = nd.vModifiers[i];
            fs.addFacts(new Fact(rln.FunctionDefinition_modifiers, [nd.id, t.id, i]));
        }
        fs.addFacts(new Fact(rln.FunctionDefinition_scope, [nd.id, translateVal(nd.scope)]));
        fs.addFacts(new Fact(rln.FunctionDefinition_kind, [nd.id, translateVal(nd.kind)]));
        fs.addFacts(
            new Fact(rln.FunctionDefinition_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(new Fact(rln.FunctionDefinition_virtual, [nd.id, translateVal(nd.virtual)]));
        fs.addFacts(
            new Fact(rln.FunctionDefinition_visibility, [nd.id, translateVal(nd.visibility)])
        );
        fs.addFacts(
            new Fact(rln.FunctionDefinition_stateMutability, [
                nd.id,
                translateVal(nd.stateMutability)
            ])
        );
        fs.addFacts(
            new Fact(rln.FunctionDefinition_isConstructor, [nd.id, translateVal(nd.isConstructor)])
        );
        fs.addFacts(
            new Fact(rln.FunctionDefinition_parameters, [nd.id, translateVal(nd.vParameters)])
        );
        fs.addFacts(
            new Fact(rln.FunctionDefinition_returnParameters, [
                nd.id,
                translateVal(nd.vReturnParameters)
            ])
        );
        fs.addFacts(
            new Fact(rln.FunctionDefinition_overrideSpecifier, [
                nd.id,
                translateVal(nd.vOverrideSpecifier === undefined ? -1 : nd.vOverrideSpecifier),
                translateVal(nd.vOverrideSpecifier !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.FunctionDefinition_body, [
                nd.id,
                translateVal(nd.vBody === undefined ? -1 : nd.vBody),
                translateVal(nd.vBody !== undefined)
            ])
        );

        fs.addFacts(
            new Fact(rln.FunctionDefinition_signature, [nd.id, infer.signature(nd)]),
            new Fact(rln.FunctionDefinition_signatureHash, [nd.id, infer.signatureHash(nd)])
        );
    } else if (nd instanceof sol.ExpressionStatement) {
        fs.addFacts(new Fact(rln.ExpressionStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.ExpressionStatement_expression, [nd.id, translateVal(nd.vExpression)])
        );
    } else if (nd instanceof sol.Assignment) {
        fs.addFacts(new Fact(rln.Assignment, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.Assignment_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.Assignment_operator, [nd.id, translateVal(sanitizeString(nd.operator))])
        );
        fs.addFacts(new Fact(rln.Assignment_leftHandSide, [nd.id, translateVal(nd.vLeftHandSide)]));
        fs.addFacts(
            new Fact(rln.Assignment_rightHandSide, [nd.id, translateVal(nd.vRightHandSide)])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.BinaryOperation) {
        fs.addFacts(new Fact(rln.BinaryOperation, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.BinaryOperation_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.BinaryOperation_operator, [
                nd.id,
                translateVal(sanitizeString(nd.operator))
            ])
        );
        fs.addFacts(
            new Fact(rln.BinaryOperation_leftExpression, [nd.id, translateVal(nd.vLeftExpression)])
        );
        fs.addFacts(
            new Fact(rln.BinaryOperation_rightExpression, [
                nd.id,
                translateVal(nd.vRightExpression)
            ])
        );
        fs.addFacts(
            new Fact(rln.BinaryOperation_userFunction, [
                nd.id,
                translateVal(nd.userFunction === undefined ? -1 : nd.userFunction),
                translateVal(nd.userFunction !== undefined)
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.Identifier) {
        fs.addFacts(new Fact(rln.Identifier, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.Identifier_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(new Fact(rln.Identifier_name, [nd.id, translateVal(sanitizeString(nd.name))]));
        fs.addFacts(
            new Fact(rln.Identifier_referencedDeclaration, [
                nd.id,
                translateVal(nd.referencedDeclaration === undefined ? -1 : nd.referencedDeclaration)
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.FunctionCall) {
        fs.addFacts(new Fact(rln.FunctionCall, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vArguments.length; i++) {
            const t = nd.vArguments[i];
            fs.addFacts(new Fact(rln.FunctionCall_arguments, [nd.id, t.id, i]));
        }
        if (nd.fieldNames !== undefined) {
            for (let i = 0; i < nd.fieldNames.length; i++) {
                const t = nd.fieldNames[i];
                fs.addFacts(new Fact(rln.FunctionCall_fieldNames, [nd.id, t, i]));
            }
        }
        fs.addFacts(
            new Fact(rln.FunctionCall_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(new Fact(rln.FunctionCall_kind, [nd.id, translateVal(nd.kind)]));
        fs.addFacts(new Fact(rln.FunctionCall_expression, [nd.id, translateVal(nd.vExpression)]));
        if (infer.isFunctionCallExternal(nd)) {
            fs.addFacts(new Fact(rln.externalCall, [nd.id]));
        }
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.Literal) {
        fs.addFacts(new Fact(rln.Literal, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.Literal_typeString, [nd.id, translateVal(sanitizeString(nd.typeString))])
        );
        fs.addFacts(new Fact(rln.Literal_kind, [nd.id, translateVal(nd.kind)]));
        fs.addFacts(
            new Fact(rln.Literal_hexValue, [
                nd.id,
                translateVal(nd.hexValue === null ? "" : sanitizeString(nd.hexValue))
            ])
        );
        fs.addFacts(
            new Fact(rln.Literal_value, [
                nd.id,
                translateVal(nd.value === null ? "" : sanitizeString(nd.value))
            ])
        );
        fs.addFacts(
            new Fact(rln.Literal_subdenomination, [
                nd.id,
                translateVal(nd.subdenomination === undefined ? "" : nd.subdenomination),
                translateVal(nd.subdenomination !== undefined)
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.NewExpression) {
        fs.addFacts(new Fact(rln.NewExpression, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.NewExpression_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(new Fact(rln.NewExpression_typeName, [nd.id, translateVal(nd.vTypeName)]));
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.Conditional) {
        fs.addFacts(new Fact(rln.Conditional, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.Conditional_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(new Fact(rln.Conditional_condition, [nd.id, translateVal(nd.vCondition)]));
        fs.addFacts(
            new Fact(rln.Conditional_trueExpression, [nd.id, translateVal(nd.vTrueExpression)])
        );
        fs.addFacts(
            new Fact(rln.Conditional_falseExpression, [nd.id, translateVal(nd.vFalseExpression)])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.FunctionCallOptions) {
        fs.addFacts(new Fact(rln.FunctionCallOptions, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (const [k, v] of nd.vOptionsMap.entries()) {
            fs.addFacts(new Fact(rln.FunctionCallOptions_options, [nd.id, k, v.id]));
        }
        fs.addFacts(
            new Fact(rln.FunctionCallOptions_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.FunctionCallOptions_expression, [nd.id, translateVal(nd.vExpression)])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.UnaryOperation) {
        fs.addFacts(new Fact(rln.UnaryOperation, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.UnaryOperation_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(new Fact(rln.UnaryOperation_prefix, [nd.id, translateVal(nd.prefix)]));
        fs.addFacts(
            new Fact(rln.UnaryOperation_operator, [
                nd.id,
                translateVal(sanitizeString(nd.operator))
            ])
        );
        fs.addFacts(
            new Fact(rln.UnaryOperation_subExpression, [nd.id, translateVal(nd.vSubExpression)])
        );
        fs.addFacts(
            new Fact(rln.UnaryOperation_userFunction, [
                nd.id,
                translateVal(nd.userFunction === undefined ? -1 : nd.userFunction),
                translateVal(nd.userFunction !== undefined)
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.IndexAccess) {
        fs.addFacts(new Fact(rln.IndexAccess, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.IndexAccess_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.IndexAccess_baseExpression, [nd.id, translateVal(nd.vBaseExpression)])
        );
        fs.addFacts(
            new Fact(rln.IndexAccess_indexExpression, [
                nd.id,
                translateVal(nd.vIndexExpression === undefined ? -1 : nd.vIndexExpression),
                translateVal(nd.vIndexExpression !== undefined)
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.MemberAccess) {
        fs.addFacts(new Fact(rln.MemberAccess, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.MemberAccess_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(new Fact(rln.MemberAccess_expression, [nd.id, translateVal(nd.vExpression)]));
        fs.addFacts(
            new Fact(rln.MemberAccess_memberName, [
                nd.id,
                translateVal(sanitizeString(nd.memberName))
            ])
        );
        fs.addFacts(
            new Fact(rln.MemberAccess_referencedDeclaration, [
                nd.id,
                translateVal(nd.referencedDeclaration === undefined ? -1 : nd.referencedDeclaration)
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.ElementaryTypeNameExpression) {
        fs.addFacts(
            new Fact(rln.ElementaryTypeNameExpression, [nd.id]),
            new Fact(rln.src, [nd.id, nd.src])
        );
        fs.addFacts(
            new Fact(rln.ElementaryTypeNameExpression_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.ElementaryTypeNameExpression_typeName, [
                nd.id,
                translateVal(
                    nd.typeName instanceof sol.ElementaryTypeName ? nd.typeName.name : nd.typeName
                )
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.TupleExpression) {
        fs.addFacts(new Fact(rln.TupleExpression, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let realI = 0, i = 0; realI < nd.components.length; realI++) {
            const t = nd.components[realI];

            if (t === null || t === undefined) {
                continue;
            }

            fs.addFacts(new Fact(rln.TupleExpression_components, [nd.id, t, i, realI]));
            i++;
        }
        fs.addFacts(
            new Fact(rln.TupleExpression_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.TupleExpression_isInlineArray, [nd.id, translateVal(nd.isInlineArray)])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.IndexRangeAccess) {
        fs.addFacts(new Fact(rln.IndexRangeAccess, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.IndexRangeAccess_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.IndexRangeAccess_baseExpression, [nd.id, translateVal(nd.vBaseExpression)])
        );
        fs.addFacts(
            new Fact(rln.IndexRangeAccess_startExpression, [
                nd.id,
                translateVal(nd.vStartExpression === undefined ? -1 : nd.vStartExpression),
                translateVal(nd.vStartExpression !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.IndexRangeAccess_endExpression, [
                nd.id,
                translateVal(nd.vEndExpression === undefined ? -1 : nd.vEndExpression),
                translateVal(nd.vEndExpression !== undefined)
            ])
        );
        if (sol.isConstant(nd)) {
            fs.addFacts(new Fact(rln.ConstantExpression, [nd.id]));
        }
    } else if (nd instanceof sol.ErrorDefinition) {
        fs.addFacts(new Fact(rln.ErrorDefinition, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.ErrorDefinition_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(
            new Fact(rln.ErrorDefinition_parameters, [nd.id, translateVal(nd.vParameters)])
        );
    } else if (nd instanceof sol.UserDefinedValueTypeDefinition) {
        fs.addFacts(
            new Fact(rln.UserDefinedValueTypeDefinition, [nd.id]),
            new Fact(rln.src, [nd.id, nd.src])
        );
        fs.addFacts(
            new Fact(rln.UserDefinedValueTypeDefinition_name, [
                nd.id,
                translateVal(sanitizeString(nd.name))
            ])
        );
        fs.addFacts(
            new Fact(rln.UserDefinedValueTypeDefinition_underlyingType, [
                nd.id,
                translateVal(nd.underlyingType)
            ])
        );
    } else if (nd instanceof sol.StructDefinition) {
        fs.addFacts(new Fact(rln.StructDefinition, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vMembers.length; i++) {
            const t = nd.vMembers[i];
            fs.addFacts(new Fact(rln.StructDefinition_members, [nd.id, t.id, i]));
        }
        fs.addFacts(
            new Fact(rln.StructDefinition_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(new Fact(rln.StructDefinition_scope, [nd.id, translateVal(nd.scope)]));
        fs.addFacts(
            new Fact(rln.StructDefinition_visibility, [
                nd.id,
                translateVal(sanitizeString(nd.visibility))
            ])
        );
    } else if (nd instanceof sol.EnumDefinition) {
        fs.addFacts(new Fact(rln.EnumDefinition, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vMembers.length; i++) {
            const t = nd.vMembers[i];
            fs.addFacts(new Fact(rln.EnumDefinition_members, [nd.id, t.id, i]));
        }
        fs.addFacts(
            new Fact(rln.EnumDefinition_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
    } else if (nd instanceof sol.EnumValue) {
        fs.addFacts(new Fact(rln.EnumValue, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.EnumValue_name, [nd.id, translateVal(sanitizeString(nd.name))]));
    } else if (nd instanceof sol.EventDefinition) {
        fs.addFacts(new Fact(rln.EventDefinition, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.EventDefinition_anonymous, [nd.id, translateVal(nd.anonymous)]));
        fs.addFacts(
            new Fact(rln.EventDefinition_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(
            new Fact(rln.EventDefinition_parameters, [nd.id, translateVal(nd.vParameters)])
        );
    } else if (nd instanceof sol.ModifierDefinition) {
        fs.addFacts(new Fact(rln.ModifierDefinition, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.ModifierDefinition_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(new Fact(rln.ModifierDefinition_virtual, [nd.id, translateVal(nd.virtual)]));
        fs.addFacts(
            new Fact(rln.ModifierDefinition_visibility, [
                nd.id,
                translateVal(sanitizeString(nd.visibility))
            ])
        );
        fs.addFacts(
            new Fact(rln.ModifierDefinition_parameters, [nd.id, translateVal(nd.vParameters)])
        );
        fs.addFacts(
            new Fact(rln.ModifierDefinition_overrideSpecifier, [
                nd.id,
                translateVal(nd.vOverrideSpecifier === undefined ? -1 : nd.vOverrideSpecifier),
                translateVal(nd.vOverrideSpecifier !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.ModifierDefinition_body, [
                nd.id,
                translateVal(nd.vBody === undefined ? -1 : nd.vBody),
                translateVal(nd.vBody !== undefined)
            ])
        );
    } else if (nd instanceof sol.Mapping) {
        fs.addFacts(new Fact(rln.Mapping, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.Mapping_typeString, [nd.id, translateVal(sanitizeString(nd.typeString))])
        );
        fs.addFacts(new Fact(rln.Mapping_keyType, [nd.id, translateVal(nd.vKeyType)]));
        fs.addFacts(new Fact(rln.Mapping_valueType, [nd.id, translateVal(nd.vValueType)]));
    } else if (nd instanceof sol.FunctionTypeName) {
        fs.addFacts(new Fact(rln.FunctionTypeName, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.FunctionTypeName_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.FunctionTypeName_visibility, [nd.id, translateVal(nd.visibility)])
        );
        fs.addFacts(
            new Fact(rln.FunctionTypeName_stateMutability, [
                nd.id,
                translateVal(nd.stateMutability)
            ])
        );
        fs.addFacts(
            new Fact(rln.FunctionTypeName_parameterTypes, [nd.id, translateVal(nd.vParameterTypes)])
        );
        fs.addFacts(
            new Fact(rln.FunctionTypeName_returnParameterTypes, [
                nd.id,
                translateVal(nd.vReturnParameterTypes)
            ])
        );
    } else if (nd instanceof sol.ElementaryTypeName) {
        fs.addFacts(new Fact(rln.ElementaryTypeName, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.ElementaryTypeName_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.ElementaryTypeName_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(
            new Fact(rln.ElementaryTypeName_stateMutability, [
                nd.id,
                translateVal(nd.stateMutability)
            ])
        );
    } else if (nd instanceof sol.ArrayTypeName) {
        fs.addFacts(new Fact(rln.ArrayTypeName, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.ArrayTypeName_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(new Fact(rln.ArrayTypeName_baseType, [nd.id, translateVal(nd.vBaseType)]));
        fs.addFacts(
            new Fact(rln.ArrayTypeName_length, [
                nd.id,
                translateVal(nd.vLength === undefined ? -1 : nd.vLength),
                translateVal(nd.vLength !== undefined)
            ])
        );
    } else if (nd instanceof sol.UserDefinedTypeName) {
        fs.addFacts(new Fact(rln.UserDefinedTypeName, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.UserDefinedTypeName_typeString, [
                nd.id,
                translateVal(sanitizeString(nd.typeString))
            ])
        );
        fs.addFacts(
            new Fact(rln.UserDefinedTypeName_name, [
                nd.id,
                translateVal(nd.name === undefined ? "" : sanitizeString(nd.name)),
                translateVal(nd.name !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.UserDefinedTypeName_referencedDeclaration, [
                nd.id,
                translateVal(nd.referencedDeclaration === undefined ? -1 : nd.referencedDeclaration)
            ])
        );
        fs.addFacts(
            new Fact(rln.UserDefinedTypeName_path, [
                nd.id,
                translateVal(nd.path === undefined ? -1 : nd.path),
                translateVal(nd.path !== undefined)
            ])
        );
    } else if (nd instanceof sol.ForStatement) {
        fs.addFacts(new Fact(rln.ForStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.ForStatement_body, [nd.id, translateVal(nd.vBody)]));
        fs.addFacts(
            new Fact(rln.ForStatement_initializationExpression, [
                nd.id,
                translateVal(
                    nd.vInitializationExpression === undefined ? -1 : nd.vInitializationExpression
                ),
                translateVal(nd.vInitializationExpression !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.ForStatement_condition, [
                nd.id,
                translateVal(nd.vCondition === undefined ? -1 : nd.vCondition),
                translateVal(nd.vCondition !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.ForStatement_loopExpression, [
                nd.id,
                translateVal(nd.vLoopExpression === undefined ? -1 : nd.vLoopExpression),
                translateVal(nd.vLoopExpression !== undefined)
            ])
        );
    } else if (nd instanceof sol.TryStatement) {
        fs.addFacts(new Fact(rln.TryStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vClauses.length; i++) {
            const t = nd.vClauses[i];
            fs.addFacts(new Fact(rln.TryStatement_clauses, [nd.id, t.id, i]));
        }
        fs.addFacts(
            new Fact(rln.TryStatement_externalCall, [nd.id, translateVal(nd.vExternalCall)])
        );
    } else if (nd instanceof sol.Throw) {
        fs.addFacts(new Fact(rln.Throw, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
    } else if (nd instanceof sol.Break) {
        fs.addFacts(new Fact(rln.Break, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
    } else if (nd instanceof sol.EmitStatement) {
        fs.addFacts(new Fact(rln.EmitStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.EmitStatement_eventCall, [nd.id, translateVal(nd.vEventCall)]));
    } else if (nd instanceof sol.InlineAssembly) {
        fs.addFacts(new Fact(rln.InlineAssembly, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
    } else if (nd instanceof sol.Block) {
        fs.addFacts(new Fact(rln.Block, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vStatements.length; i++) {
            const t = nd.vStatements[i];
            fs.addFacts(new Fact(rln.Block_statements, [nd.id, t.id, i]));
        }
    } else if (nd instanceof sol.RevertStatement) {
        fs.addFacts(new Fact(rln.RevertStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.RevertStatement_errorCall, [nd.id, translateVal(nd.errorCall)]));
    } else if (nd instanceof sol.UncheckedBlock) {
        fs.addFacts(new Fact(rln.UncheckedBlock, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vStatements.length; i++) {
            const t = nd.vStatements[i];
            fs.addFacts(new Fact(rln.UncheckedBlock_statements, [nd.id, t.id, i]));
        }
    } else if (nd instanceof sol.Return) {
        fs.addFacts(new Fact(rln.Return, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.Return_functionReturnParameters, [
                nd.id,
                translateVal(nd.functionReturnParameters)
            ])
        );
        fs.addFacts(
            new Fact(rln.Return_expression, [
                nd.id,
                translateVal(nd.vExpression === undefined ? -1 : nd.vExpression),
                translateVal(nd.vExpression !== undefined)
            ])
        );
    } else if (nd instanceof sol.WhileStatement) {
        fs.addFacts(new Fact(rln.WhileStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.WhileStatement_condition, [nd.id, translateVal(nd.vCondition)]));
        fs.addFacts(new Fact(rln.WhileStatement_body, [nd.id, translateVal(nd.vBody)]));
    } else if (nd instanceof sol.VariableDeclarationStatement) {
        fs.addFacts(
            new Fact(rln.VariableDeclarationStatement, [nd.id]),
            new Fact(rln.src, [nd.id, nd.src])
        );

        for (let realI = 0, i = 0; realI < nd.assignments.length; realI++) {
            const t = nd.assignments[realI];

            if (t === null || t === undefined) {
                continue;
            }

            fs.addFacts(
                new Fact(rln.VariableDeclarationStatement_assignments, [nd.id, t, i, realI])
            );
            i++;
        }

        for (let i = 0; i < nd.vDeclarations.length; i++) {
            const t = nd.vDeclarations[i];
            fs.addFacts(new Fact(rln.VariableDeclarationStatement_declarations, [nd.id, t.id, i]));
        }
        fs.addFacts(
            new Fact(rln.VariableDeclarationStatement_initialValue, [
                nd.id,
                translateVal(nd.vInitialValue === undefined ? -1 : nd.vInitialValue),
                translateVal(nd.vInitialValue !== undefined)
            ])
        );
    } else if (nd instanceof sol.IfStatement) {
        fs.addFacts(new Fact(rln.IfStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.IfStatement_condition, [nd.id, translateVal(nd.vCondition)]));
        fs.addFacts(new Fact(rln.IfStatement_trueBody, [nd.id, translateVal(nd.vTrueBody)]));
        fs.addFacts(
            new Fact(rln.IfStatement_falseBody, [
                nd.id,
                translateVal(nd.vFalseBody === undefined ? -1 : nd.vFalseBody),
                translateVal(nd.vFalseBody !== undefined)
            ])
        );
    } else if (nd instanceof sol.TryCatchClause) {
        fs.addFacts(new Fact(rln.TryCatchClause, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.TryCatchClause_errorName, [
                nd.id,
                translateVal(sanitizeString(nd.errorName))
            ])
        );
        fs.addFacts(new Fact(rln.TryCatchClause_block, [nd.id, translateVal(nd.vBlock)]));
        fs.addFacts(
            new Fact(rln.TryCatchClause_parameters, [
                nd.id,
                translateVal(nd.vParameters === undefined ? -1 : nd.vParameters),
                translateVal(nd.vParameters !== undefined)
            ])
        );
    } else if (nd instanceof sol.DoWhileStatement) {
        fs.addFacts(new Fact(rln.DoWhileStatement, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(new Fact(rln.DoWhileStatement_condition, [nd.id, translateVal(nd.vCondition)]));
        fs.addFacts(new Fact(rln.DoWhileStatement_body, [nd.id, translateVal(nd.vBody)]));
    } else if (nd instanceof sol.Continue) {
        fs.addFacts(new Fact(rln.Continue, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
    } else if (nd instanceof sol.PlaceholderStatement) {
        fs.addFacts(
            new Fact(rln.PlaceholderStatement, [nd.id]),
            new Fact(rln.src, [nd.id, nd.src])
        );
    } else if (nd instanceof sol.ParameterList) {
        fs.addFacts(new Fact(rln.ParameterList, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vParameters.length; i++) {
            const t = nd.vParameters[i];
            fs.addFacts(new Fact(rln.ParameterList_parameters, [nd.id, t.id, i]));
        }
    } else if (nd instanceof sol.InheritanceSpecifier) {
        fs.addFacts(
            new Fact(rln.InheritanceSpecifier, [nd.id]),
            new Fact(rln.src, [nd.id, nd.src])
        );

        for (let i = 0; i < nd.vArguments.length; i++) {
            const t = nd.vArguments[i];
            fs.addFacts(new Fact(rln.InheritanceSpecifier_arguments, [nd.id, t.id, i]));
        }
        fs.addFacts(
            new Fact(rln.InheritanceSpecifier_baseType, [nd.id, translateVal(nd.vBaseType)])
        );
    } else if (nd instanceof sol.UsingForDirective) {
        fs.addFacts(new Fact(rln.UsingForDirective, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        if (nd.vFunctionList !== undefined) {
            for (let i = 0; i < nd.vFunctionList.length; i++) {
                const t = nd.vFunctionList[i];
                fs.addFacts(
                    new Fact(rln.UsingForDirective_functionList, [
                        nd.id,
                        t instanceof sol.ASTNode ? t.id : t.definition.id,
                        t instanceof sol.ASTNode ? "" : t.operator,
                        i
                    ])
                );
            }
        }
        fs.addFacts(new Fact(rln.UsingForDirective_isGlobal, [nd.id, translateVal(nd.isGlobal)]));
        fs.addFacts(
            new Fact(rln.UsingForDirective_libraryName, [
                nd.id,
                translateVal(nd.vLibraryName === undefined ? -1 : nd.vLibraryName),
                translateVal(nd.vLibraryName !== undefined)
            ])
        );
        fs.addFacts(
            new Fact(rln.UsingForDirective_typeName, [
                nd.id,
                translateVal(nd.vTypeName === undefined ? -1 : nd.vTypeName),
                translateVal(nd.vTypeName !== undefined)
            ])
        );
    } else if (nd instanceof sol.IdentifierPath) {
        fs.addFacts(new Fact(rln.IdentifierPath, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.IdentifierPath_name, [nd.id, translateVal(sanitizeString(nd.name))])
        );
        fs.addFacts(
            new Fact(rln.IdentifierPath_referencedDeclaration, [
                nd.id,
                translateVal(nd.referencedDeclaration === undefined ? -1 : nd.referencedDeclaration)
            ])
        );
    } else if (nd instanceof sol.PragmaDirective) {
        fs.addFacts(new Fact(rln.PragmaDirective, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.literals.length; i++) {
            const t = nd.literals[i];
            fs.addFacts(new Fact(rln.PragmaDirective_literals, [nd.id, t, i]));
        }
    } else if (nd instanceof sol.ModifierInvocation) {
        fs.addFacts(new Fact(rln.ModifierInvocation, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vArguments.length; i++) {
            const t = nd.vArguments[i];
            fs.addFacts(new Fact(rln.ModifierInvocation_arguments, [nd.id, t.id, i]));
        }
        fs.addFacts(
            new Fact(rln.ModifierInvocation_modifierName, [nd.id, translateVal(nd.vModifierName)])
        );
        fs.addFacts(
            new Fact(rln.ModifierInvocation_kind, [
                nd.id,
                translateVal(nd.kind === undefined ? "" : nd.kind),
                translateVal(nd.kind !== undefined)
            ])
        );
    } else if (nd instanceof sol.ImportDirective) {
        fs.addFacts(new Fact(rln.ImportDirective, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));
        fs.addFacts(
            new Fact(rln.ImportDirective_file, [nd.id, translateVal(sanitizeString(nd.file))])
        );
        fs.addFacts(
            new Fact(rln.ImportDirective_absolutePath, [
                nd.id,
                translateVal(sanitizeString(nd.absolutePath))
            ])
        );
        fs.addFacts(
            new Fact(rln.ImportDirective_unitAlias, [
                nd.id,
                translateVal(sanitizeString(nd.unitAlias))
            ])
        );
        fs.addFacts(new Fact(rln.ImportDirective_scope, [nd.id, translateVal(nd.scope)]));
        fs.addFacts(new Fact(rln.ImportDirective_sourceUnit, [nd.id, translateVal(nd.sourceUnit)]));
    } else if (nd instanceof sol.OverrideSpecifier) {
        fs.addFacts(new Fact(rln.OverrideSpecifier, [nd.id]), new Fact(rln.src, [nd.id, nd.src]));

        for (let i = 0; i < nd.vOverrides.length; i++) {
            const t = nd.vOverrides[i];
            fs.addFacts(new Fact(rln.OverrideSpecifier_overrides, [nd.id, t.id, i]));
        }
    } else if (nd instanceof sol.StructuredDocumentation) {
        fs.addFacts(
            new Fact(rln.StructuredDocumentation, [nd.id]),
            new Fact(rln.src, [nd.id, nd.src])
        );
        fs.addFacts(
            new Fact(rln.StructuredDocumentation_text, [
                nd.id,
                translateVal(sanitizeString(nd.text))
            ])
        );
    } else {
        throw new Error(`Unknown AST node type ${nd.constructor.name}.`);
    }
}
