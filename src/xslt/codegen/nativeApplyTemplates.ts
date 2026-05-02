import type { Instruction, StylesheetIR, TemplateRule } from '../compile/ir.js';
import type { PathExpression, StepExpression } from '../../xpath/parse/ast.js';
import { tsRawExpression, type TsExpression } from './ts-ir.js';

interface RootApplyTemplatesShape {
  readonly rootTemplate: TemplateRule;
  readonly childTemplate: TemplateRule;
  readonly childMatchPath: readonly string[];
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

  const childMatchPath = getSimpleRelativeMatchPath(childTemplate);
  if (childMatchPath === undefined) {
    return undefined;
  }

  return {
    rootTemplate,
    childTemplate,
    childMatchPath,
  };
}

export function emitRootApplyTemplatesInstruction(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  childTemplate: TemplateRule,
  childMatchPath: readonly string[],
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
    runtimeHelpers.add('applyBuiltInTemplatesByPath');
    return tsRawExpression(
      `applyBuiltInTemplatesByPath(document, ${JSON.stringify(childMatchPath)}, (templateNode) => ${childBody.code})`,
    );
  }

  const selectPath = tryGetSimpleChildPath(instruction.select);
  if (
    selectPath === undefined
    || selectPath.segments.length < childMatchPath.length
    || !endsWithPath(selectPath.segments, childMatchPath)
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

function getSimpleRelativeMatchPath(template: TemplateRule): readonly string[] | undefined {
  if (
    template.name !== undefined
    || template.modes.length > 0
    || template.params.length > 0
    || template.match === undefined
    || template.match.kind !== 'path'
    || template.match.absolute
    || template.match.base !== undefined
    || template.match.steps.length === 0
  ) {
    return undefined;
  }

  const path: string[] = [];
  for (const step of template.match.steps) {
    if (
      step.kind !== 'step'
      || step.axis !== 'child'
      || step.predicates.length > 0
      || step.nodeTest.kind !== 'nameTest'
      || step.nodeTest.name.includes(':')
    ) {
      return undefined;
    }

    path.push(step.nodeTest.name);
  }

  return path;
}

function endsWithPath(path: readonly string[], suffix: readonly string[]): boolean {
  const offset = path.length - suffix.length;
  for (let index = 0; index < suffix.length; index += 1) {
    if (path[offset + index] !== suffix[index]) {
      return false;
    }
  }

  return true;
}