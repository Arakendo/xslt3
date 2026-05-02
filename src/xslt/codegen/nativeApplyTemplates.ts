import type { Instruction, StylesheetIR, TemplateRule } from '../compile/ir.js';
import type { PathExpression, StepExpression } from '../../xpath/parse/ast.js';
import { tsRawExpression, type TsExpression } from './ts-ir.js';

interface RootApplyTemplatesShape {
  readonly rootTemplate: TemplateRule;
  readonly childTemplate: TemplateRule;
  readonly childMatchName: string;
}

export function tryGetRootApplyTemplatesShape(ir: StylesheetIR): RootApplyTemplatesShape | undefined {
  if (ir.templates.length !== 2) {
    return undefined;
  }

  const rootTemplate = ir.templates.find((template) => isRootTemplateShape(template));
  const childTemplate = ir.templates.find((template) => template !== rootTemplate);
  if (rootTemplate === undefined || childTemplate === undefined) {
    return undefined;
  }

  const childMatchName = getSimpleRelativeMatchName(childTemplate);
  if (childMatchName === undefined) {
    return undefined;
  }

  return {
    rootTemplate,
    childTemplate,
    childMatchName,
  };
}

export function emitRootApplyTemplatesInstruction(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  childTemplate: TemplateRule,
  childMatchName: string,
  runtimeHelpers: Set<string>,
  emitInstructionSequence: (
    instructions: readonly Instruction[],
    runtimeHelpers: Set<string>,
    options?: {
      readonly contextNodeIdentifier?: string;
      readonly renderApplyTemplates?: (
        instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
      ) => TsExpression | undefined;
    },
  ) => TsExpression | undefined,
  tryGetSimpleChildPath: (
    ast: PathExpression | StepExpression | object,
  ) => { readonly absolute: boolean; readonly segments: readonly string[] } | undefined,
): TsExpression | undefined {
  if (instruction.withParams.length > 0) {
    return undefined;
  }

  const childBody = emitInstructionSequence(childTemplate.body, runtimeHelpers, {
    contextNodeIdentifier: 'templateNode',
  });
  if (childBody === undefined) {
    return undefined;
  }

  if (instruction.select === undefined) {
    runtimeHelpers.add('selectDescendantElementsByName');
    return tsRawExpression(
      `selectDescendantElementsByName(document, ${JSON.stringify(childMatchName)}).map((templateNode) => ${childBody.code}).join("")`,
    );
  }

  const selectPath = tryGetSimpleChildPath(instruction.select);
  if (
    selectPath === undefined
    || selectPath.segments.length === 0
    || selectPath.segments.at(-1) !== childMatchName
  ) {
    return undefined;
  }

  runtimeHelpers.add('selectSimplePathNodes');
  return tsRawExpression(
    `selectSimplePathNodes(document, ${JSON.stringify(selectPath.segments)}).map((templateNode) => ${childBody.code}).join("")`,
  );
}

function isRootTemplateShape(template: TemplateRule): boolean {
  return template.name === undefined
    && template.modes.length === 0
    && template.params.length === 0
    && template.match !== undefined
    && template.match.kind === 'path'
    && template.match.absolute
    && template.match.base === undefined
    && template.match.steps.length === 0;
}

function getSimpleRelativeMatchName(template: TemplateRule): string | undefined {
  if (
    template.name !== undefined
    || template.modes.length > 0
    || template.params.length > 0
    || template.match === undefined
    || template.match.kind !== 'path'
    || template.match.absolute
    || template.match.base !== undefined
    || template.match.steps.length !== 1
  ) {
    return undefined;
  }

  const [step] = template.match.steps;
  if (
    step === undefined
    || step.kind !== 'step'
    || step.axis !== 'child'
    || step.predicates.length > 0
    || step.nodeTest.kind !== 'nameTest'
    || step.nodeTest.name.includes(':')
  ) {
    return undefined;
  }

  return step.nodeTest.name;
}