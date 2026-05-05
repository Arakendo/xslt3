import type { GlobalParam, StylesheetIR } from '../compile/ir.js';
import { createEmitPlan, type EmitStylesheetModuleOptions } from './plan.js';
import { tryCreateNativeTransformPlan } from './emitInstructions.js';
import { renderTemplateProvenanceComment } from './provenance.js';
import { renderTsExpression, renderTsModule } from './ts-ir.js';

export function emitStylesheetModule(
  ir: StylesheetIR,
  options: EmitStylesheetModuleOptions,
): string {
  const plan = createEmitPlan(ir, options);
  const nativePlan = tryCreateNativeTransformPlan(plan.stylesheet, plan.sourcePath);
  const typeBlock = createStylesheetTypeBlock(ir);

  if (nativePlan !== undefined) {
    return renderTsModule({
      statements: [
        `import { ${nativePlan.runtimeHelpers.join(', ')} } from ${JSON.stringify(plan.moduleSpecifier)};`,
        `import type { TransformContext, TransformResult } from ${JSON.stringify(plan.moduleSpecifier)};`,
        ...typeBlock.importStatements,
        '',
        ...typeBlock.typeStatements,
        ...(typeBlock.typeStatements.length > 0 ? [''] : []),
        `export const source = { path: ${JSON.stringify(plan.sourcePath)}, digest: ${JSON.stringify(plan.digest)} } as const;`,
        '',
        renderTemplateProvenanceComment(nativePlan.entryTemplate, plan.sourcePath),
        `export function transform(sourceXml: string, ctx: ${typeBlock.transformContextTypeName} = {}): TransformResult {`,
        '  void ctx;',
        '  const document = createCompiledDocument(sourceXml);',
        ...(nativePlan.needsCurrentNodeBinding
          ? [`  const currentNode = ${renderTsExpression(nativePlan.currentNodeExpression)};`]
          : []),
        ...(nativePlan.currentNodeMayBeNull
          ? [
              '  if (currentNode === null) {',
              '    return { output: "" };',
              '  }',
            ]
          : []),
        '  return {',
        '    output:',
        `      ${renderTsExpression(nativePlan.outputExpression)},`,
        '  };',
        '}',
        '',
        'export default { source, transform };',
      ],
    });
  }

  return renderTsModule({
    statements: [
      `import { transformCompiledStylesheet } from ${JSON.stringify(plan.moduleSpecifier)};`,
      `import type { StylesheetIR, TransformContext, TransformResult } from ${JSON.stringify(plan.moduleSpecifier)};`,
      ...typeBlock.importStatements,
      '',
      `const stylesheet = ${plan.serializedIr} satisfies StylesheetIR;`,
      '',
      ...typeBlock.typeStatements,
      ...(typeBlock.typeStatements.length > 0 ? [''] : []),
      `export const source = { path: ${JSON.stringify(plan.sourcePath)}, digest: ${JSON.stringify(plan.digest)} } as const;`,
      '',
      `export function transform(sourceXml: string, ctx: ${typeBlock.transformContextTypeName} = {}): TransformResult {`,
      '  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);',
      '}',
      '',
      'export default { source, transform };',
    ],
  });
}

export function emitStylesheetDeclarationModule(
  ir: StylesheetIR,
  options: EmitStylesheetModuleOptions,
): string {
  const plan = createEmitPlan(ir, options);
  const typeBlock = createStylesheetTypeBlock(ir);
  const statements: string[] = [
    `import type { TransformContext, TransformResult } from ${JSON.stringify(plan.moduleSpecifier)};`,
  ];

  statements.push(...typeBlock.importStatements);

  statements.push('');
  statements.push(`export declare const source: { readonly path: ${JSON.stringify(plan.sourcePath)}; readonly digest: ${JSON.stringify(plan.digest)}; };`);
  statements.push('');
  statements.push(...typeBlock.typeStatements.map((statement) => statement.replace('export interface', 'export interface').replace('export type', 'export type')));

  statements.push('');
  statements.push('export declare function transform(sourceXml: string, ctx?: StylesheetTransformContext): TransformResult;');
  statements.push('');
  statements.push('declare const _default: {');
  statements.push('  readonly source: typeof source;');
  statements.push('  readonly transform: typeof transform;');
  statements.push('};');
  statements.push('');
  statements.push('export default _default;');

  return renderTsModule({ statements });
}

function mapStylesheetParamTypeToTs(declaredType: string | undefined, xmldomTypes: Set<string>): string {
  if (declaredType === undefined) {
    return 'unknown';
  }

  const trimmedType = declaredType.trim();
  const occurrence = trimmedType.at(-1);
  const baseType = occurrence === '?' || occurrence === '*' || occurrence === '+'
    ? trimmedType.slice(0, -1).trim()
    : trimmedType;

  const mappedBaseType = mapStylesheetBaseTypeToTs(baseType, xmldomTypes);
  if (occurrence === '*' || occurrence === '+') {
    return mappedBaseType.includes('|')
      ? `readonly (${mappedBaseType})[]`
      : `readonly ${mappedBaseType}[]`;
  }

  return mappedBaseType;
}

function mapStylesheetBaseTypeToTs(baseType: string, xmldomTypes: Set<string>): string {
  switch (baseType) {
    case 'xs:string':
      return 'string';
    case 'xs:integer':
    case 'xs:double':
    case 'xs:decimal':
    case 'xs:float':
      return 'number';
    case 'xs:boolean':
      return 'boolean';
    case 'element()':
    case 'element(*)':
      xmldomTypes.add('Element');
      return 'Element';
    case 'document-node()':
    case 'document-node(element())':
    case 'document-node(element(*))':
      xmldomTypes.add('Document');
      return 'Document';
    case 'node()':
      xmldomTypes.add('Node');
      return 'Node';
    default:
      return 'unknown';
  }
}

interface StylesheetTypeBlock {
  readonly importStatements: readonly string[];
  readonly typeStatements: readonly string[];
  readonly transformContextTypeName: string;
}

function createStylesheetTypeBlock(ir: StylesheetIR): StylesheetTypeBlock {
  const parameters = ir.globalBindings.filter((binding): binding is GlobalParam => binding.kind === 'param');
  if (parameters.length === 0) {
    return {
      importStatements: [],
      typeStatements: [],
      transformContextTypeName: 'TransformContext',
    };
  }

  const xmldomTypes = new Set<string>();
  const parameterLines = parameters.map((parameter) => {
    const typeText = mapStylesheetParamTypeToTs(parameter.asType, xmldomTypes);
    const optionalToken = parameter.required ? '' : '?';
    return `  readonly ${JSON.stringify(parameter.name)}${optionalToken}: ${typeText};`;
  });

  return {
    importStatements: xmldomTypes.size > 0
      ? [`import type { ${[...xmldomTypes].sort().join(', ')} } from '@xmldom/xmldom';`]
      : [],
    typeStatements: [
      'export interface StylesheetParameters extends Readonly<Record<string, unknown>> {',
      ...parameterLines,
      '}',
      '',
      'export type StylesheetTransformContext = Omit<TransformContext, "parameters"> & {',
      '  readonly parameters?: StylesheetParameters;',
      '};',
    ],
    transformContextTypeName: 'StylesheetTransformContext',
  };
}