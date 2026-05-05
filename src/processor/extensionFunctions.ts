import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import ts from 'typescript';

import type {
  ExtensionFunctionCatalog,
  ExtensionFunctionParameterSignature,
  ExtensionFunctionSignature,
} from '../xslt/compile/extensionFunctions.js';

export function loadExtensionFunctionCatalog(stylesheetFilePath: string): ExtensionFunctionCatalog {
  const functionsFilePath = join(dirname(stylesheetFilePath), 'functions.ts');
  if (!existsSync(functionsFilePath)) {
    return new Map();
  }

  const program = ts.createProgram([functionsFilePath], {
    allowJs: false,
    checkJs: false,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  });
  const sourceFile = program.getSourceFile(functionsFilePath);
  if (sourceFile === undefined) {
    return new Map();
  }

  const checker = program.getTypeChecker();
  const signatures = new Map<string, ExtensionFunctionSignature>();

  visit(sourceFile);
  return signatures;

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineXsltFunctions') {
      collectSignatures(node);
    }

    ts.forEachChild(node, visit);
  }

  function collectSignatures(callExpression: ts.CallExpression): void {
    const [namespaceArgument, functionsArgument] = callExpression.arguments;
    if (
      namespaceArgument === undefined
      || functionsArgument === undefined
      || !ts.isStringLiteralLike(namespaceArgument)
      || !ts.isObjectLiteralExpression(functionsArgument)
    ) {
      return;
    }

    const namespaceUri = namespaceArgument.text;
    for (const property of functionsArgument.properties) {
      const localName = getPropertyName(property.name);
      if (localName === undefined) {
        continue;
      }

      const callableNode = getCallableNode(property);
      if (callableNode === undefined) {
        continue;
      }

      const type = checker.getTypeAtLocation(callableNode);
      const signature = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0];
      if (signature === undefined) {
        continue;
      }

      const parameters = signature.getParameters().map((parameter) => {
        const declaration = (parameter.valueDeclaration ?? callableNode) as ts.Declaration;
        const parameterType = checker.getTypeOfSymbolAtLocation(parameter, declaration);
        return createParameterSignature(checker, parameter, declaration, parameterType);
      });
      const minimumArity = parameters.filter((parameter) => !parameter.optional).length;
      const maximumArity = signatureHasRestParameter(signature) ? undefined : parameters.length;
      const returnType = checker.typeToString(signature.getReturnType(), callableNode, ts.TypeFormatFlags.NoTruncation);
      const signatureText = `${localName}(${parameters.map((parameter) => `${parameter.name}${parameter.optional ? '?' : ''}: ${parameter.typeText}`).join(', ')}): ${returnType}`;

      signatures.set(`{${namespaceUri}}${localName}`, {
        namespaceUri,
        localName,
        signatureText,
        minimumArity,
        ...(maximumArity === undefined ? {} : { maximumArity }),
        parameters,
      });
    }
  }
}

function createParameterSignature(
  checker: ts.TypeChecker,
  parameter: ts.Symbol,
  declaration: ts.Declaration,
  parameterType: ts.Type,
): ExtensionFunctionParameterSignature {
  return {
    name: parameter.getName(),
    typeText: checker.typeToString(parameterType, declaration, ts.TypeFormatFlags.NoTruncation),
    inferredTypes: inferTypeCategories(parameterType),
    optional: isOptionalParameterDeclaration(declaration),
  };
}

function inferTypeCategories(type: ts.Type): readonly ('boolean' | 'number' | 'string' | 'unknown')[] {
  if (type.isUnion()) {
    const categories = new Set<'boolean' | 'number' | 'string' | 'unknown'>();
    for (const part of type.types) {
      if ((part.flags & ts.TypeFlags.Undefined) !== 0 || (part.flags & ts.TypeFlags.Null) !== 0) {
        continue;
      }
      for (const category of inferTypeCategories(part)) {
        categories.add(category);
      }
    }
    return categories.size === 0 ? ['unknown'] : [...categories];
  }

  if ((type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral | ts.TypeFlags.StringLike)) !== 0) {
    return ['string'];
  }

  if ((type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral | ts.TypeFlags.NumberLike)) !== 0) {
    return ['number'];
  }

  if ((type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral | ts.TypeFlags.BooleanLike)) !== 0) {
    return ['boolean'];
  }

  return ['unknown'];
}

function getCallableNode(property: ts.ObjectLiteralElementLike): ts.Node | undefined {
  if (ts.isMethodDeclaration(property)) {
    return property;
  }

  if (ts.isPropertyAssignment(property) && (ts.isFunctionExpression(property.initializer) || ts.isArrowFunction(property.initializer))) {
    return property.initializer;
  }

  return undefined;
}

function getPropertyName(name: ts.PropertyName | undefined): string | undefined {
  if (name === undefined) {
    return undefined;
  }

  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function isOptionalParameterDeclaration(declaration: ts.Declaration): boolean {
  if (!ts.isParameter(declaration)) {
    return false;
  }

  return declaration.questionToken !== undefined || declaration.initializer !== undefined || declaration.dotDotDotToken !== undefined;
}

function signatureHasRestParameter(signature: ts.Signature): boolean {
  const lastParameter = signature.parameters[signature.parameters.length - 1];
  const declaration = lastParameter?.valueDeclaration;
  return declaration !== undefined && ts.isParameter(declaration) && declaration.dotDotDotToken !== undefined;
}