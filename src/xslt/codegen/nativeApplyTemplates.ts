import type { Instruction, StylesheetIR, TemplateRule } from '../compile/ir.js';
import type { PathExpression, StepExpression } from '../../xpath/parse/ast.js';
import { tsRawExpression, type TsExpression } from './ts-ir.js';
import { renderCommentedArrowFunction, renderTemplateProvenanceComment } from './provenance.js';

interface RootApplyTemplatesShape {
  readonly rootTemplate: TemplateRule;
  readonly childTemplate: TemplateRule;
  readonly childMatchAbsolute: boolean;
  readonly childMatchPath: readonly string[];
}

interface RootApplyTemplatesNestedShape extends RootApplyTemplatesShape {
  readonly nestedChildTemplate: TemplateRule;
  readonly nestedChildMatchAbsolute: boolean;
  readonly nestedChildMatchPath: readonly string[];
}

export interface ApplyTemplatesTemplatePlan {
  readonly template: TemplateRule;
  readonly matchAbsolute: boolean;
  readonly matchPath: readonly string[];
  readonly nestedPlan?: ApplyTemplatesTemplatePlan;
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

  const childMatchPath = getSimpleMatchPath(childTemplate);
  if (childMatchPath === undefined) {
    return undefined;
  }

  return {
    rootTemplate,
    childTemplate,
    childMatchAbsolute: childTemplate.match?.kind === 'path' ? childTemplate.match.absolute : false,
    childMatchPath,
  };
}

export function tryGetRootApplyTemplatesNestedShape(ir: StylesheetIR): RootApplyTemplatesNestedShape | undefined {
  if (ir.templates.length !== 3) {
    return undefined;
  }

  const rootTemplate = ir.templates.find((template) => isRootTemplateShape(template));
  if (rootTemplate === undefined) {
    return undefined;
  }

  const rootApplyTemplates = findSingleApplyTemplatesInstruction(rootTemplate.body);
  if (rootApplyTemplates === undefined || rootApplyTemplates.withParams.length > 0) {
    return undefined;
  }

  const remainingTemplates = ir.templates.filter((template) => template !== rootTemplate);
  if (remainingTemplates.length !== 2) {
    return undefined;
  }

  const candidateTemplates = remainingTemplates.map((template) => {
    const matchPath = getSimpleMatchPath(template);
    if (matchPath === undefined) {
      return undefined;
    }

    return {
      template,
      matchAbsolute: template.match?.kind === 'path' ? template.match.absolute : false,
      matchPath,
    };
  });
  if (candidateTemplates.some((candidate) => candidate === undefined)) {
    return undefined;
  }

  const definedCandidates = candidateTemplates.filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== undefined);

  const matchingCandidates = rootApplyTemplates.select === undefined
    ? (() => {
        const absoluteCandidates = definedCandidates.filter((candidate) => candidate.matchAbsolute);
        if (absoluteCandidates.length > 0) {
          return absoluteCandidates;
        }

        const relativeCandidates = definedCandidates.filter((candidate) => !candidate.matchAbsolute);
        const maxLength = relativeCandidates.reduce((currentMax, candidate) => Math.max(currentMax, candidate.matchPath.length), 0);
        return relativeCandidates.filter((candidate) => candidate.matchPath.length === maxLength);
      })()
    : (() => {
        const selectPath = getSimpleSelectPath(rootApplyTemplates.select);
        if (selectPath === undefined) {
          return [];
        }

        return definedCandidates.filter((candidate) =>
          selectPathMatchesTemplate(selectPath.segments, candidate.matchPath, candidate.matchAbsolute),
        );
      })();
  if (matchingCandidates.length !== 1) {
    return undefined;
  }

  const childCandidate = matchingCandidates[0];
  if (childCandidate === undefined) {
    return undefined;
  }

  const nestedCandidate = definedCandidates.find((candidate) => candidate.template !== childCandidate.template);
  if (nestedCandidate === undefined) {
    return undefined;
  }

  return {
    rootTemplate,
    childTemplate: childCandidate.template,
    childMatchAbsolute: childCandidate.matchAbsolute,
    childMatchPath: childCandidate.matchPath,
    nestedChildTemplate: nestedCandidate.template,
    nestedChildMatchAbsolute: nestedCandidate.matchAbsolute,
    nestedChildMatchPath: nestedCandidate.matchPath,
  };
}

export function emitRootApplyTemplatesInstruction(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  childTemplate: TemplateRule,
  childMatchAbsolute: boolean,
  childMatchPath: readonly string[],
  contextNodeIdentifier: string,
  runtimeHelpers: Set<string>,
  emitInstructionSequence: (
    instructions: readonly Instruction[],
    runtimeHelpers: Set<string>,
    options?: {
      readonly contextNodeIdentifier?: string;
      readonly renderApplyTemplates?: (
        instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
        contextNodeIdentifier: string,
      ) => TsExpression | undefined;
    },
  ) => TsExpression | undefined,
  tryGetSimpleChildPath: (
    ast: PathExpression | StepExpression | object,
  ) => { readonly absolute: boolean; readonly segments: readonly string[] } | undefined,
  sourcePath?: string,
  nestedOptions?: {
    readonly nestedChildTemplate: TemplateRule;
    readonly nestedChildMatchAbsolute: boolean;
    readonly nestedChildMatchPath: readonly string[];
  },
): TsExpression | undefined {
  if (instruction.withParams.length > 0) {
    return undefined;
  }

  // MVP+4 only plans the root apply-templates dispatch. Nested apply-templates
  // inside child template bodies still fall back through generic emission.
  const childBody = emitInstructionSequence(childTemplate.body, runtimeHelpers, nestedOptions === undefined
    ? {
        contextNodeIdentifier: 'templateNode',
      }
    : {
        contextNodeIdentifier: 'templateNode',
        renderApplyTemplates: (nestedInstruction, nestedContextNodeIdentifier) => emitRootApplyTemplatesInstruction(
          nestedInstruction,
          nestedOptions.nestedChildTemplate,
          nestedOptions.nestedChildMatchAbsolute,
          nestedOptions.nestedChildMatchPath,
          nestedContextNodeIdentifier,
          runtimeHelpers,
          emitInstructionSequence,
          tryGetSimpleChildPath,
          sourcePath,
        ),
      });
  if (childBody === undefined) {
    return undefined;
  }

  const childTemplateCallback = renderCommentedArrowFunction(
    renderTemplateProvenanceComment(childTemplate, sourcePath),
    '(templateNode)',
    childBody.code,
  );

  if (instruction.select === undefined) {
    runtimeHelpers.add('applyBuiltInTemplatesByPath');
    return tsRawExpression(
      childMatchAbsolute
        ? `applyBuiltInTemplatesByPath(document, ${JSON.stringify(childMatchPath)}, ${childTemplateCallback}, true)`
        : `applyBuiltInTemplatesByPath(${contextNodeIdentifier}, ${JSON.stringify(childMatchPath)}, ${childTemplateCallback})`,
    );
  }

  const selectPath = tryGetSimpleChildPath(instruction.select);
  if (
    selectPath === undefined
    || !selectPathMatchesTemplate(selectPath.segments, childMatchPath, childMatchAbsolute)
  ) {
    return undefined;
  }

  runtimeHelpers.add('selectSimplePathNodes');
  return tsRawExpression(
    `selectSimplePathNodes(${selectPath.absolute ? 'document' : contextNodeIdentifier}, ${JSON.stringify(selectPath.segments)}).map(${childTemplateCallback}).join("")`,
  );
}

export function tryGetRootApplyTemplatesPlan(
  ir: StylesheetIR,
): { readonly rootTemplate: TemplateRule; readonly childPlan: ApplyTemplatesTemplatePlan } | undefined {
  const rootTemplate = ir.templates.find((template) => isRootTemplateShape(template));
  if (rootTemplate === undefined) {
    return undefined;
  }

  const rootApplyTemplates = findSingleApplyTemplatesInstruction(rootTemplate.body);
  if (rootApplyTemplates === undefined || rootApplyTemplates.withParams.length > 0) {
    return undefined;
  }

  const remainingTemplates = ir.templates.filter((template) => template !== rootTemplate);
  if (remainingTemplates.length === 0) {
    return undefined;
  }

  const childPlan = tryBuildApplyTemplatesTemplatePlan(rootApplyTemplates, remainingTemplates);
  if (childPlan === undefined) {
    return undefined;
  }

  return {
    rootTemplate,
    childPlan: childPlan.plan,
  };
}

export function emitPlannedApplyTemplatesInstruction(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  childPlan: ApplyTemplatesTemplatePlan,
  contextNodeIdentifier: string,
  runtimeHelpers: Set<string>,
  emitInstructionSequence: (
    instructions: readonly Instruction[],
    runtimeHelpers: Set<string>,
    options?: {
      readonly contextNodeIdentifier?: string;
      readonly renderApplyTemplates?: (
        instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
        contextNodeIdentifier: string,
      ) => TsExpression | undefined;
    },
  ) => TsExpression | undefined,
  tryGetSimpleChildPath: (
    ast: PathExpression | StepExpression | object,
  ) => { readonly absolute: boolean; readonly segments: readonly string[] } | undefined,
  sourcePath?: string,
): TsExpression | undefined {
  if (instruction.withParams.length > 0) {
    return undefined;
  }

  const nestedPlan = childPlan.nestedPlan;

  const childBody = emitInstructionSequence(childPlan.template.body, runtimeHelpers, nestedPlan === undefined
    ? {
        contextNodeIdentifier: 'templateNode',
      }
    : {
        contextNodeIdentifier: 'templateNode',
        renderApplyTemplates: (nestedInstruction, nestedContextNodeIdentifier) => emitPlannedApplyTemplatesInstruction(
          nestedInstruction,
          nestedPlan,
          nestedContextNodeIdentifier,
          runtimeHelpers,
          emitInstructionSequence,
          tryGetSimpleChildPath,
          sourcePath,
        ),
      });
  if (childBody === undefined) {
    return undefined;
  }

  const childTemplateCallback = renderCommentedArrowFunction(
    renderTemplateProvenanceComment(childPlan.template, sourcePath),
    '(templateNode)',
    childBody.code,
  );

  if (instruction.select === undefined) {
    runtimeHelpers.add('applyBuiltInTemplatesByPath');
    return tsRawExpression(
      childPlan.matchAbsolute
        ? `applyBuiltInTemplatesByPath(document, ${JSON.stringify(childPlan.matchPath)}, ${childTemplateCallback}, true)`
        : `applyBuiltInTemplatesByPath(${contextNodeIdentifier}, ${JSON.stringify(childPlan.matchPath)}, ${childTemplateCallback})`,
    );
  }

  const selectPath = tryGetSimpleChildPath(instruction.select);
  if (
    selectPath === undefined
    || !selectPathMatchesTemplate(selectPath.segments, childPlan.matchPath, childPlan.matchAbsolute)
  ) {
    return undefined;
  }

  runtimeHelpers.add('selectSimplePathNodes');
  return tsRawExpression(
    `selectSimplePathNodes(${selectPath.absolute ? 'document' : contextNodeIdentifier}, ${JSON.stringify(selectPath.segments)}).map(${childTemplateCallback}).join("")`,
  );
}

function tryBuildApplyTemplatesTemplatePlan(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  templates: readonly TemplateRule[],
): { readonly plan: ApplyTemplatesTemplatePlan; readonly remainingTemplates: readonly TemplateRule[] } | undefined {
  const candidates = getTemplateMatchCandidates(templates);
  if (candidates === undefined) {
    return undefined;
  }

  const matchingCandidates = getMatchingApplyTemplatesCandidates(instruction, candidates);
  if (matchingCandidates.length !== 1) {
    return undefined;
  }

  const [matchedCandidate] = matchingCandidates;
  if (matchedCandidate === undefined) {
    return undefined;
  }

  const remainingTemplates = templates.filter((template) => template !== matchedCandidate.template);
  const nestedInstruction = findSingleApplyTemplatesInstruction(matchedCandidate.template.body);
  if (nestedInstruction === undefined) {
    return {
      plan: {
        template: matchedCandidate.template,
        matchAbsolute: matchedCandidate.matchAbsolute,
        matchPath: matchedCandidate.matchPath,
      },
      remainingTemplates,
    };
  }

  if (nestedInstruction.withParams.length > 0) {
    return undefined;
  }

  const nestedPlan = tryBuildApplyTemplatesTemplatePlan(nestedInstruction, remainingTemplates);
  if (nestedPlan === undefined) {
    return undefined;
  }

  return {
    plan: {
      template: matchedCandidate.template,
      matchAbsolute: matchedCandidate.matchAbsolute,
      matchPath: matchedCandidate.matchPath,
      nestedPlan: nestedPlan.plan,
    },
    remainingTemplates: nestedPlan.remainingTemplates,
  };
}

function getTemplateMatchCandidates(templates: readonly TemplateRule[]): Array<{
  readonly template: TemplateRule;
  readonly matchAbsolute: boolean;
  readonly matchPath: readonly string[];
}> | undefined {
  const candidates = templates.map((template) => {
    const matchPath = getSimpleMatchPath(template);
    if (matchPath === undefined) {
      return undefined;
    }

    return {
      template,
      matchAbsolute: template.match?.kind === 'path' ? template.match.absolute : false,
      matchPath,
    };
  });
  if (candidates.some((candidate) => candidate === undefined)) {
    return undefined;
  }

  return candidates.filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== undefined);
}

function getMatchingApplyTemplatesCandidates(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  candidates: readonly {
    readonly template: TemplateRule;
    readonly matchAbsolute: boolean;
    readonly matchPath: readonly string[];
  }[],
): readonly {
  readonly template: TemplateRule;
  readonly matchAbsolute: boolean;
  readonly matchPath: readonly string[];
}[] {
  if (instruction.select === undefined) {
    const absoluteCandidates = candidates.filter((candidate) => candidate.matchAbsolute);
    if (absoluteCandidates.length > 0) {
      return absoluteCandidates;
    }

    const relativeCandidates = candidates.filter((candidate) => !candidate.matchAbsolute);
    const maxLength = relativeCandidates.reduce((currentMax, candidate) => Math.max(currentMax, candidate.matchPath.length), 0);
    return relativeCandidates.filter((candidate) => candidate.matchPath.length === maxLength);
  }

  const selectPath = getSimpleSelectPath(instruction.select);
  if (selectPath === undefined) {
    return [];
  }

  return candidates.filter((candidate) =>
    selectPathMatchesTemplate(selectPath.segments, candidate.matchPath, candidate.matchAbsolute),
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

function getSimpleMatchPath(template: TemplateRule): readonly string[] | undefined {
  if (
    template.name !== undefined
    || template.modes.length > 0
    || template.params.length > 0
    || template.match === undefined
    || template.match.kind !== 'path'
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

function selectPathMatchesTemplate(
  selectPath: readonly string[],
  templatePath: readonly string[],
  templateIsAbsolute: boolean,
): boolean {
  if (templateIsAbsolute) {
    return selectPath.length === templatePath.length && endsWithPath(selectPath, templatePath);
  }

  return selectPath.length >= templatePath.length && endsWithPath(selectPath, templatePath);
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

function findSingleApplyTemplatesInstruction(
  instructions: readonly Instruction[],
): Extract<Instruction, { readonly kind: 'applyTemplates' }> | undefined {
  const matches: Array<Extract<Instruction, { readonly kind: 'applyTemplates' }>> = [];

  const visit = (items: readonly Instruction[]) => {
    for (const instruction of items) {
      switch (instruction.kind) {
        case 'applyTemplates':
          matches.push(instruction);
          break;
        case 'literalElement':
        case 'if':
        case 'forEach':
          visit(instruction.body);
          break;
        case 'choose':
          for (const branch of instruction.whenBranches) {
            visit(branch.body);
          }
          if (instruction.otherwiseBody !== undefined) {
            visit(instruction.otherwiseBody);
          }
          break;
        default:
          break;
      }
    }
  };

  visit(instructions);
  return matches.length === 1 ? matches[0] : undefined;
}

function getSimpleSelectPath(
  ast: PathExpression | StepExpression | object,
): { readonly absolute: boolean; readonly segments: readonly string[] } | undefined {
  if (!('kind' in ast) || ast.kind !== 'path' || ast.base !== undefined) {
    return undefined;
  }

  const segments: string[] = [];
  for (const step of ast.steps) {
    if (
      step.kind !== 'step'
      || step.axis !== 'child'
      || step.predicates.length > 0
      || step.nodeTest.kind !== 'nameTest'
      || step.nodeTest.name.includes(':')
    ) {
      return undefined;
    }

    segments.push(step.nodeTest.name);
  }

  return {
    absolute: ast.absolute,
    segments,
  };
}