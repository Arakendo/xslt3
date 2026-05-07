import type { Instruction, StylesheetIR, TemplateRule, TemplateParam, WithParam } from '../compile/ir.js';
import type { PathExpression, StepExpression, XPathAst, XPathBinaryOperator } from '../../xpath/parse/ast.js';
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

interface TemplateMatchCandidate {
  readonly template: TemplateRule;
  readonly matchAbsolute: boolean;
  readonly matchPath: readonly string[];
  readonly priority: number;
  readonly templateIndex: number;
}

export interface ApplyTemplatesTemplatePlan {
  readonly template: TemplateRule;
  readonly matchAbsolute: boolean;
  readonly matchPath: readonly string[];
  readonly nestedPlans?: readonly ApplyTemplatesTemplatePlan[];
}

interface ApplyTemplatesInvocationContext {
  readonly positionExpression?: string;
  readonly lastExpression?: string;
  readonly variableBindings?: ReadonlyMap<string, TsExpression>;
}

interface SimpleSelectPathStepPlan {
  readonly name: string;
  readonly position?: number | 'last';
  readonly positionTotalDivisor?: number;
  readonly positionTotalNumerator?: number;
  readonly positionTotalOffset?: number;
  readonly positionTotalPolynomialDenominator?: number;
  readonly positionTotalPolynomialQuadraticNumerator?: number;
  readonly positionTotalPolynomialLinearNumerator?: number;
  readonly positionTotalPolynomialConstantNumerator?: number;
  readonly excludedPositionTotalDivisors?: readonly number[];
  readonly excludedPositionTotalDivisorOffsets?: readonly ({ readonly divisor: number; readonly offset: number })[];
  readonly excludedPositionTotalFractions?: readonly ({ readonly denominator: number; readonly numerator: number; readonly offset: number })[];
  readonly excludedPositionTotalPolynomials?: readonly ({ readonly denominator: number; readonly quadraticNumerator: number; readonly linearNumerator: number; readonly constantNumerator: number })[];
  readonly maximumPositionExclusiveTotalDivisors?: readonly number[];
  readonly maximumPositionExclusiveTotalDivisorOffsets?: readonly ({ readonly divisor: number; readonly offset: number })[];
  readonly maximumPositionExclusiveTotalFractions?: readonly ({ readonly denominator: number; readonly numerator: number; readonly offset: number })[];
  readonly maximumPositionExclusiveTotalPolynomials?: readonly ({ readonly denominator: number; readonly quadraticNumerator: number; readonly linearNumerator: number; readonly constantNumerator: number })[];
  readonly maximumPositionInclusiveTotalDivisors?: readonly number[];
  readonly maximumPositionInclusiveTotalDivisorOffsets?: readonly ({ readonly divisor: number; readonly offset: number })[];
  readonly maximumPositionInclusiveTotalFractions?: readonly ({ readonly denominator: number; readonly numerator: number; readonly offset: number })[];
  readonly maximumPositionInclusiveTotalPolynomials?: readonly ({ readonly denominator: number; readonly quadraticNumerator: number; readonly linearNumerator: number; readonly constantNumerator: number })[];
  readonly minimumPositionExclusiveTotalDivisors?: readonly number[];
  readonly minimumPositionExclusiveTotalDivisorOffsets?: readonly ({ readonly divisor: number; readonly offset: number })[];
  readonly minimumPositionExclusiveTotalFractions?: readonly ({ readonly denominator: number; readonly numerator: number; readonly offset: number })[];
  readonly minimumPositionExclusiveTotalPolynomials?: readonly ({ readonly denominator: number; readonly quadraticNumerator: number; readonly linearNumerator: number; readonly constantNumerator: number })[];
  readonly minimumPositionInclusiveTotalDivisors?: readonly number[];
  readonly minimumPositionInclusiveTotalDivisorOffsets?: readonly ({ readonly divisor: number; readonly offset: number })[];
  readonly minimumPositionInclusiveTotalFractions?: readonly ({ readonly denominator: number; readonly numerator: number; readonly offset: number })[];
  readonly minimumPositionInclusiveTotalPolynomials?: readonly ({ readonly denominator: number; readonly quadraticNumerator: number; readonly linearNumerator: number; readonly constantNumerator: number })[];
  readonly positionFromLastOffset?: number;
  readonly includedPositions?: readonly number[];
  readonly includedPositionFromLastOffsets?: readonly number[];
  readonly maximumPositionFromLastOffset?: number;
  readonly minimumPosition?: number;
  readonly maximumPosition?: number;
  readonly excludedPosition?: number;
  readonly excludedPositions?: readonly number[];
  readonly positionModuloDivisor?: number;
  readonly positionModuloRemainder?: number;
  readonly alternatives?: readonly SupportedStepPositionPlan[];
}

type SupportedStepPositionPlan = Pick<
  SimpleSelectPathStepPlan,
  'position' | 'positionTotalDivisor' | 'positionTotalNumerator' | 'positionTotalOffset' | 'positionTotalPolynomialDenominator' | 'positionTotalPolynomialQuadraticNumerator' | 'positionTotalPolynomialLinearNumerator' | 'positionTotalPolynomialConstantNumerator' | 'excludedPositionTotalDivisors' | 'excludedPositionTotalDivisorOffsets' | 'excludedPositionTotalFractions' | 'excludedPositionTotalPolynomials' | 'maximumPositionExclusiveTotalDivisors' | 'maximumPositionExclusiveTotalDivisorOffsets' | 'maximumPositionExclusiveTotalFractions' | 'maximumPositionExclusiveTotalPolynomials' | 'maximumPositionInclusiveTotalDivisors' | 'maximumPositionInclusiveTotalDivisorOffsets' | 'maximumPositionInclusiveTotalFractions' | 'maximumPositionInclusiveTotalPolynomials' | 'minimumPositionExclusiveTotalDivisors' | 'minimumPositionExclusiveTotalDivisorOffsets' | 'minimumPositionExclusiveTotalFractions' | 'minimumPositionExclusiveTotalPolynomials' | 'minimumPositionInclusiveTotalDivisors' | 'minimumPositionInclusiveTotalDivisorOffsets' | 'minimumPositionInclusiveTotalFractions' | 'minimumPositionInclusiveTotalPolynomials' | 'positionFromLastOffset' | 'includedPositions' | 'includedPositionFromLastOffsets' | 'maximumPositionFromLastOffset' | 'minimumPosition' | 'maximumPosition' | 'excludedPosition' | 'excludedPositions' | 'positionModuloDivisor' | 'positionModuloRemainder' | 'alternatives'
>;

type SupportedLastDivisorPolynomialValue = {
  readonly denominator: number;
  readonly quadraticNumerator: number;
  readonly linearNumerator: number;
  readonly constantNumerator: number;
};

type SupportedPositionComparisonOperator = '=' | 'eq' | '>' | 'gt' | '>=' | 'ge' | '<' | 'lt' | '<=' | 'le' | '!=' | 'ne';

interface NativeApplyTemplatesEmitOptions {
  readonly contextNodeIdentifier?: string;
  readonly positionExpression?: string;
  readonly lastExpression?: string;
  readonly variableBindings?: ReadonlyMap<string, TsExpression>;
  readonly renderApplyTemplates?: (
    instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
    contextNodeIdentifier: string,
    context: ApplyTemplatesInvocationContext,
  ) => TsExpression | undefined;
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
  if (rootApplyTemplates === undefined) {
    return undefined;
  }

  const remainingTemplates = ir.templates.filter((template) => template !== rootTemplate);
  if (remainingTemplates.length !== 2) {
    return undefined;
  }

  const candidateTemplates = remainingTemplates.map((template, templateIndex) => {
    const matchPath = getSimpleMatchPath(template);
    if (matchPath === undefined) {
      return undefined;
    }

    return {
      template,
      matchAbsolute: template.match?.kind === 'path' ? template.match.absolute : false,
      matchPath,
      priority: getTemplatePriority(template),
      templateIndex,
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
          selectPathMatchesTemplate(selectPath.steps, candidate.matchPath, candidate.matchAbsolute),
        );
      })();
  const childCandidate = sortMatchingCandidates(matchingCandidates)[0];
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
    options?: NativeApplyTemplatesEmitOptions,
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
): { readonly rootTemplate: TemplateRule; readonly childPlans: readonly ApplyTemplatesTemplatePlan[] } | undefined {
  const rootTemplate = ir.templates.find((template) => isRootTemplateShape(template));
  if (rootTemplate === undefined) {
    return undefined;
  }

  const rootApplyTemplates = findSingleApplyTemplatesInstruction(rootTemplate.body);
  if (rootApplyTemplates === undefined) {
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
    childPlans: childPlan.plans,
  };
}

export function emitPlannedApplyTemplatesInstruction(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  childPlans: readonly ApplyTemplatesTemplatePlan[],
  contextNodeIdentifier: string,
  runtimeHelpers: Set<string>,
  emitInstructionSequence: (
    instructions: readonly Instruction[],
    runtimeHelpers: Set<string>,
    options?: NativeApplyTemplatesEmitOptions,
  ) => TsExpression | undefined,
  tryGetSimpleChildPath: (
    ast: PathExpression | StepExpression | object,
  ) => { readonly absolute: boolean; readonly segments: readonly string[] } | undefined,
  createTemplateInvocationSetup: (
    params: readonly TemplateParam[],
    withParams: readonly WithParam[],
    runtimeHelpers: Set<string>,
    parentBindings: ReadonlyMap<string, TsExpression> | undefined,
    callerContextNodeIdentifier: string,
    calleeContextNodeIdentifier: string,
    callerPositionExpression?: string,
    callerLastExpression?: string,
    calleePositionExpression?: string,
    calleeLastExpression?: string,
  ) => { readonly setupStatements: readonly string[]; readonly variableBindings: ReadonlyMap<string, TsExpression> } | undefined,
  context: ApplyTemplatesInvocationContext = {},
  sourcePath?: string,
): TsExpression | undefined {
  if (childPlans.length === 0) {
    return undefined;
  }

  const childTemplateCallbacks = childPlans.map((childPlan) => {
    const invocationSetup = createTemplateInvocationSetup(
      childPlan.template.params,
      instruction.withParams,
      runtimeHelpers,
      context.variableBindings,
      contextNodeIdentifier,
      'templateNode',
      context.positionExpression,
      context.lastExpression,
    );
    if (invocationSetup === undefined) {
      return undefined;
    }

    const nestedPlans = childPlan.nestedPlans;
    const childCallbackParameters = '(templateNode, templateIndex, templateNodes)';
    const childBody = emitInstructionSequence(childPlan.template.body, runtimeHelpers, nestedPlans === undefined
      ? {
          contextNodeIdentifier: 'templateNode',
          positionExpression: '(templateIndex + 1)',
          lastExpression: 'templateNodes.length',
          variableBindings: invocationSetup.variableBindings,
        }
      : {
          contextNodeIdentifier: 'templateNode',
          positionExpression: '(templateIndex + 1)',
          lastExpression: 'templateNodes.length',
          variableBindings: invocationSetup.variableBindings,
          renderApplyTemplates: (nestedInstruction, nestedContextNodeIdentifier, nestedContext) => emitPlannedApplyTemplatesInstruction(
            nestedInstruction,
            nestedPlans,
            nestedContextNodeIdentifier,
            runtimeHelpers,
            emitInstructionSequence,
            tryGetSimpleChildPath,
            createTemplateInvocationSetup,
            {
              ...(nestedContext.positionExpression === undefined ? {} : { positionExpression: nestedContext.positionExpression }),
              ...(nestedContext.lastExpression === undefined ? {} : { lastExpression: nestedContext.lastExpression }),
              variableBindings: invocationSetup.variableBindings,
            },
            sourcePath,
          ),
        });
    if (childBody === undefined) {
      return undefined;
    }

    const callbackBody = invocationSetup.setupStatements.length === 0
      ? childBody.code
      : `(() => {\n${invocationSetup.setupStatements.map((statement) => `  ${statement}`).join('\n')}\n  return ${childBody.code};\n})()`;

    return {
      plan: childPlan,
      callback: renderCommentedArrowFunction(
        renderTemplateProvenanceComment(childPlan.template, sourcePath),
        childCallbackParameters,
        callbackBody,
      ),
    };
  });
  if (childTemplateCallbacks.some((callback) => callback === undefined)) {
    return undefined;
  }

  const definedCallbacks = childTemplateCallbacks.filter((callback): callback is NonNullable<typeof callback> => callback !== undefined);
  const renderMatchedNode = definedCallbacks.length === 1
    ? definedCallbacks[0]!.callback
    : (() => {
        runtimeHelpers.add('matchesTemplatePath');
        const dispatchLines = definedCallbacks.map(({ plan, callback }) =>
          `if (matchesTemplatePath(templateNode, ${JSON.stringify(plan.matchPath)}, ${plan.matchAbsolute ? 'true' : 'false'})) { return (${callback})(templateNode); }`
        );
        return ['(templateNode) => {', ...dispatchLines.map((line) => `  ${line}`), '  return "";', '}'].join('\n');
      })();

  if (instruction.select === undefined) {
    runtimeHelpers.add('applyBuiltInTemplatesByPath');
    return tsRawExpression(
      childPlans.every((childPlan) => childPlan.matchAbsolute)
        ? `applyBuiltInTemplatesByPath(document, ${JSON.stringify(childPlans[0]!.matchPath)}, ${renderMatchedNode}, true)`
        : `applyBuiltInTemplatesByPath(${contextNodeIdentifier}, ${JSON.stringify(childPlans[0]!.matchPath)}, ${renderMatchedNode})`,
    );
  }

  const selectPath = getSimpleSelectPath(instruction.select);
  if (
    selectPath === undefined
    || !childPlans.some((childPlan) => selectPathMatchesTemplate(selectPath.steps, childPlan.matchPath, childPlan.matchAbsolute))
  ) {
    return undefined;
  }

  runtimeHelpers.add('selectSimplePathNodesByStepPlan');
  return tsRawExpression(
    `selectSimplePathNodesByStepPlan(${selectPath.absolute ? 'document' : contextNodeIdentifier}, ${JSON.stringify(selectPath.steps)}).map(${renderMatchedNode}).join("")`,
  );
}

function tryBuildApplyTemplatesTemplatePlan(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  templates: readonly TemplateRule[],
): { readonly plans: readonly ApplyTemplatesTemplatePlan[]; readonly remainingTemplates: readonly TemplateRule[] } | undefined {
  const candidates = getTemplateMatchCandidates(templates);
  if (candidates === undefined) {
    return undefined;
  }

  const matchingCandidates = sortMatchingCandidates(getMatchingApplyTemplatesCandidates(instruction, candidates));
  if (matchingCandidates.length === 0) {
    return undefined;
  }

  const matchedTemplates = new Set(matchingCandidates.map((candidate) => candidate.template));
  const remainingTemplates = templates.filter((template) => !matchedTemplates.has(template));

  const plans: ApplyTemplatesTemplatePlan[] = [];
  for (const matchedCandidate of matchingCandidates) {
    const nestedInstruction = findSingleApplyTemplatesInstruction(matchedCandidate.template.body);
    if (nestedInstruction === undefined) {
      plans.push({
        template: matchedCandidate.template,
        matchAbsolute: matchedCandidate.matchAbsolute,
        matchPath: matchedCandidate.matchPath,
      });
      continue;
    }

    const nestedPlan = tryBuildApplyTemplatesTemplatePlan(nestedInstruction, remainingTemplates);
    if (nestedPlan === undefined) {
      return undefined;
    }

    plans.push({
      template: matchedCandidate.template,
      matchAbsolute: matchedCandidate.matchAbsolute,
      matchPath: matchedCandidate.matchPath,
      nestedPlans: nestedPlan.plans,
    });
  }

  return {
    plans,
    remainingTemplates,
  };
}

function getTemplateMatchCandidates(templates: readonly TemplateRule[]): readonly TemplateMatchCandidate[] | undefined {
  const candidates = templates.map((template, templateIndex) => {
    const matchPath = getSimpleMatchPath(template);
    if (matchPath === undefined) {
      return undefined;
    }

    return {
      template,
      matchAbsolute: template.match?.kind === 'path' ? template.match.absolute : false,
      matchPath,
      priority: getTemplatePriority(template),
      templateIndex,
    };
  });
  if (candidates.some((candidate) => candidate === undefined)) {
    return undefined;
  }

  return candidates.filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== undefined);
}

function getMatchingApplyTemplatesCandidates(
  instruction: Extract<Instruction, { readonly kind: 'applyTemplates' }>,
  candidates: readonly TemplateMatchCandidate[],
): readonly TemplateMatchCandidate[] {
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
    selectPathMatchesTemplate(selectPath.steps, candidate.matchPath, candidate.matchAbsolute),
  );
}

function sortMatchingCandidates(candidates: readonly TemplateMatchCandidate[]): readonly TemplateMatchCandidate[] {
  return [...candidates].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return right.templateIndex - left.templateIndex;
  });
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
    ) {
      return undefined;
    }

    if (step.nodeTest.kind === 'nameTest') {
      if (step.nodeTest.name.includes(':')) {
        return undefined;
      }

      path.push(step.nodeTest.name);
      continue;
    }

    if (step.nodeTest.kind === 'wildcardTest') {
      path.push('*');
      continue;
    }

    return undefined;
  }

  return path;
}

function getTemplatePriority(template: TemplateRule): number {
  if (template.priority !== undefined) {
    return template.priority;
  }

  if (template.match === undefined || template.match.kind !== 'path') {
    return Number.NEGATIVE_INFINITY;
  }

  if (isRootTemplateShape(template)) {
    return 0.5;
  }

  const match = template.match;
  if (match.base !== undefined || match.steps.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  if (match.absolute) {
    return 0.5;
  }

  const step = match.steps[match.steps.length - 1];
  if (step?.kind !== 'step') {
    return Number.NEGATIVE_INFINITY;
  }

  if (step.nodeTest.kind === 'nameTest') {
    return 0;
  }

  if (step.nodeTest.kind === 'wildcardTest') {
    return -0.5;
  }

  if (step.nodeTest.kind === 'kindTest' && (step.nodeTest.name === 'node' || step.nodeTest.name === 'text')) {
    return -0.5;
  }

  return Number.NEGATIVE_INFINITY;
}

function selectPathMatchesTemplate(
  selectPath: readonly (string | SimpleSelectPathStepPlan)[],
  templatePath: readonly string[],
  templateIsAbsolute: boolean,
): boolean {
  const selectSegments = selectPath.map((step) => typeof step === 'string' ? step : step.name);

  if (templateIsAbsolute) {
    return selectSegments.length === templatePath.length && pathsOverlapAtOffset(selectSegments, templatePath, 0);
  }

  return selectSegments.length >= templatePath.length && pathsOverlapAtOffset(selectSegments, templatePath, selectSegments.length - templatePath.length);
}

function pathsOverlapAtOffset(path: readonly string[], suffix: readonly string[], offset: number): boolean {
  for (let index = 0; index < suffix.length; index += 1) {
    if (!segmentsOverlap(path[offset + index], suffix[index])) {
      return false;
    }
  }

  return true;
}

function segmentsOverlap(left: string | undefined, right: string | undefined): boolean {
  if (left === undefined || right === undefined) {
    return false;
  }

  return left === '*' || right === '*' || left === right;
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
): { readonly absolute: boolean; readonly steps: readonly SimpleSelectPathStepPlan[] } | undefined {
  if (!('kind' in ast) || ast.kind !== 'path' || ast.base !== undefined) {
    return undefined;
  }

  const steps: SimpleSelectPathStepPlan[] = [];
  for (const step of ast.steps) {
    if (step.kind !== 'step' || step.axis !== 'child' || step.predicates.length > 1) {
      return undefined;
    }

    const predicate = step.predicates[0];
    const predicatePlan = predicate === undefined ? {} : tryGetSupportedStepPositionPredicate(predicate);
    if (predicate !== undefined && predicatePlan === undefined) {
      return undefined;
    }

    if (step.nodeTest.kind === 'nameTest') {
      if (step.nodeTest.name.includes(':')) {
        return undefined;
      }

      steps.push({ name: step.nodeTest.name, ...(predicatePlan ?? {}) });
      continue;
    }

    if (step.nodeTest.kind === 'wildcardTest') {
      steps.push({ name: '*', ...(predicatePlan ?? {}) });
      continue;
    }

    return undefined;
  }

  return {
    absolute: ast.absolute,
    steps,
  };
}

function tryGetSupportedStepPositionPredicate(
  predicate: XPathAst,
): SupportedStepPositionPlan | undefined {
  if (predicate.kind === 'number') {
    return Number.isInteger(predicate.value) && predicate.value >= 1 ? { position: predicate.value } : undefined;
  }

  if (isZeroArgFunctionCall(predicate, 'last')) {
    return { position: 'last' };
  }

  if (predicate.kind === 'functionCall' && predicate.callee === 'not' && predicate.arguments.length === 1) {
    const [argument] = predicate.arguments;
    return argument === undefined ? undefined : tryGetSupportedNegatedStepPositionPredicate(argument);
  }

  if (predicate.kind !== 'binary') {
    return undefined;
  }

  if (predicate.operator === 'and') {
    const leftPlan = tryGetSupportedStepPositionPredicate(predicate.left);
    const rightPlan = tryGetSupportedStepPositionPredicate(predicate.right);
    return leftPlan === undefined || rightPlan === undefined ? undefined : mergeSupportedStepPositionPlans(leftPlan, rightPlan);
  }

  if (predicate.operator === 'or') {
    const leftPlan = tryGetSupportedStepPositionPredicate(predicate.left);
    const rightPlan = tryGetSupportedStepPositionPredicate(predicate.right);
    return leftPlan === undefined || rightPlan === undefined ? undefined : unionSupportedStepPositionPlans(leftPlan, rightPlan);
  }

  const leftPosition = isZeroArgFunctionCall(predicate.left, 'position');
  const rightPosition = isZeroArgFunctionCall(predicate.right, 'position');
  const leftLast = isZeroArgFunctionCall(predicate.left, 'last');
  const rightLast = isZeroArgFunctionCall(predicate.right, 'last');
  const leftNumber = predicate.left.kind === 'number' ? predicate.left.value : undefined;
  const rightNumber = predicate.right.kind === 'number' ? predicate.right.value : undefined;
  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  const moduloPlan = tryGetSupportedPositionModuloComparison(predicate);
  const lastDivisorPlan = tryGetSupportedPositionLastDivisorComparison(predicate);
  const lastDivisorRangePlan = tryGetSupportedPositionLastDivisorRangeComparison(predicate);
  const lastOffsetPlan = tryGetSupportedPositionLastOffsetComparison(predicate);
  const lastRangePlan = tryGetSupportedPositionLastRangeComparison(predicate);

  if (moduloPlan !== undefined) {
    return moduloPlan;
  }

  if (lastDivisorPlan !== undefined) {
    return lastDivisorPlan;
  }

  if (lastDivisorRangePlan !== undefined) {
    return lastDivisorRangePlan;
  }

  if (lastOffsetPlan !== undefined) {
    return lastOffsetPlan;
  }

  if (lastRangePlan !== undefined) {
    return lastRangePlan;
  }

  if (operator !== undefined && leftPosition && rightNumber !== undefined) {
    return createSupportedStepPositionComparison(operator, rightNumber);
  }

  if (operator !== undefined && rightPosition && leftNumber !== undefined) {
    return createSupportedStepPositionComparison(reverseComparisonOperator(operator), leftNumber);
  }

  if ((leftPosition && rightLast) || (leftLast && rightPosition)) {
    return operator === undefined ? undefined : createSupportedPositionLastComparison(operator);
  }

  return undefined;
}

function createSupportedStepPositionComparison(
  operator: SupportedPositionComparisonOperator | undefined,
  value: number,
): SupportedStepPositionPlan | undefined {
  if (!Number.isInteger(value) || value < 1) {
    return undefined;
  }

  switch (operator) {
    case '=':
    case 'eq':
      return { position: value };
    case '>':
    case 'gt':
      return { minimumPosition: value + 1 };
    case '>=':
    case 'ge':
      return { minimumPosition: value };
    case '<':
    case 'lt':
      return value === 1 ? { maximumPosition: 0 } : { maximumPosition: value - 1 };
    case '<=':
    case 'le':
      return { maximumPosition: value };
    case '!=':
    case 'ne':
      return { excludedPosition: value };
    default:
      return undefined;
  }
}

function tryGetSupportedNegatedStepPositionPredicate(predicate: XPathAst): SupportedStepPositionPlan | undefined {
  if (predicate.kind === 'functionCall' && predicate.callee === 'not' && predicate.arguments.length === 1) {
    const [argument] = predicate.arguments;
    return argument === undefined ? undefined : tryGetSupportedStepPositionPredicate(argument);
  }

  if (predicate.kind === 'binary' && predicate.operator === 'or') {
    const leftPlan = tryGetSupportedNegatedStepPositionPredicate(predicate.left);
    const rightPlan = tryGetSupportedNegatedStepPositionPredicate(predicate.right);
    return leftPlan === undefined || rightPlan === undefined ? undefined : mergeSupportedStepPositionPlans(leftPlan, rightPlan);
  }

  if (predicate.kind === 'binary' && predicate.operator === 'and') {
    const leftPlan = tryGetSupportedNegatedStepPositionPredicate(predicate.left);
    const rightPlan = tryGetSupportedNegatedStepPositionPredicate(predicate.right);
    return leftPlan === undefined || rightPlan === undefined ? undefined : unionSupportedStepPositionPlans(leftPlan, rightPlan);
  }

  const negatedLastOffsetPlan = tryGetSupportedNegatedPositionLastOffsetComparison(predicate);
  if (negatedLastOffsetPlan !== undefined) {
    return negatedLastOffsetPlan;
  }

  const negatedLastDivisorPlan = tryGetSupportedNegatedPositionLastDivisorComparison(predicate);
  if (negatedLastDivisorPlan !== undefined) {
    return negatedLastDivisorPlan;
  }

  const negatedLastDivisorRangePlan = tryGetSupportedNegatedPositionLastDivisorRangeComparison(predicate);
  if (negatedLastDivisorRangePlan !== undefined) {
    return negatedLastDivisorRangePlan;
  }

  const negatedLastRangePlan = tryGetSupportedNegatedPositionLastRangeComparison(predicate);
  if (negatedLastRangePlan !== undefined) {
    return negatedLastRangePlan;
  }

  const negatedModuloPlan = tryGetSupportedNegatedPositionModuloComparison(predicate);
  if (negatedModuloPlan !== undefined) {
    return negatedModuloPlan;
  }

  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const leftPosition = isZeroArgFunctionCall(predicate.left, 'position');
  const rightPosition = isZeroArgFunctionCall(predicate.right, 'position');
  const leftLast = isZeroArgFunctionCall(predicate.left, 'last');
  const rightLast = isZeroArgFunctionCall(predicate.right, 'last');
  const leftNumber = predicate.left.kind === 'number' ? predicate.left.value : undefined;
  const rightNumber = predicate.right.kind === 'number' ? predicate.right.value : undefined;
  const operator = getSupportedPositionComparisonOperator(predicate.operator);

  if (operator !== undefined && leftPosition && rightNumber !== undefined) {
    return createSupportedStepPositionComparison(negateComparisonOperator(operator), rightNumber);
  }

  if (operator !== undefined && rightPosition && leftNumber !== undefined) {
    return createSupportedStepPositionComparison(reverseComparisonOperator(negateComparisonOperator(operator)), leftNumber);
  }

  if (operator !== undefined && ((leftPosition && rightLast) || (leftLast && rightPosition))) {
    return createSupportedPositionLastComparison(negateComparisonOperator(operator));
  }

  return undefined;
}

function negateComparisonOperator(operator: SupportedPositionComparisonOperator): SupportedPositionComparisonOperator {
  switch (operator) {
    case '=':
      return '!=';
    case 'eq':
      return 'ne';
    case '!=':
      return '=';
    case 'ne':
      return 'eq';
    case '<':
      return '>=';
    case 'lt':
      return 'ge';
    case '<=':
      return '>';
    case 'le':
      return 'gt';
    case '>':
      return '<=';
    case 'gt':
      return 'le';
    case '>=':
      return '<';
    case 'ge':
      return 'lt';
  }
}

function createSupportedPositionLastComparison(operator: SupportedPositionComparisonOperator): SupportedStepPositionPlan | undefined {
  switch (operator) {
    case '=':
    case 'eq':
      return { position: 'last' };
    case '!=':
    case 'ne':
    case '<':
    case 'lt':
      return { maximumPositionFromLastOffset: 1 };
    case '>=':
    case 'ge':
      return { position: 'last' };
    case '<=':
    case 'le':
      return {};
    case '>':
    case 'gt':
      return { maximumPosition: 0 };
  }
}

function tryGetSupportedNegatedPositionLastOffsetComparison(predicate: XPathAst): SupportedStepPositionPlan | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator !== '=' && operator !== 'eq' && operator !== '!=' && operator !== 'ne') {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    const lastOffset = tryGetLastOffsetValue(predicate.right);
    return lastOffset === undefined ? undefined : createSupportedNegatedPositionLastOffsetComparison(operator, lastOffset);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    const lastOffset = tryGetLastOffsetValue(predicate.left);
    return lastOffset === undefined ? undefined : createSupportedNegatedPositionLastOffsetComparison(operator, lastOffset);
  }

  return undefined;
}

function createSupportedNegatedPositionLastOffsetComparison(
  operator: SupportedPositionComparisonOperator,
  lastOffset: number,
): SupportedStepPositionPlan | undefined {
  switch (operator) {
    case '=':
    case 'eq':
      return createSupportedNegatedPositionLastOffsetPlan(lastOffset);
    case '!=':
    case 'ne':
      return { positionFromLastOffset: lastOffset };
  }

  return undefined;
}

function createSupportedNegatedPositionLastOffsetPlan(lastOffset: number): SupportedStepPositionPlan {
  if (lastOffset === 0) {
    return { maximumPositionFromLastOffset: 1 };
  }

  return {
    alternatives: [
      { maximumPositionFromLastOffset: lastOffset + 1 },
      { includedPositionFromLastOffsets: Array.from({ length: lastOffset }, (_, index) => index) },
    ],
  };
}

function tryGetSupportedNegatedPositionLastRangeComparison(predicate: XPathAst): SupportedStepPositionPlan | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator === undefined) {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    return createSupportedNegatedPositionLastRangePlan(operator, predicate.right);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    return createSupportedNegatedPositionLastRangePlan(reverseComparisonOperator(operator), predicate.left);
  }

  return undefined;
}

function createSupportedNegatedPositionLastRangePlan(
  operator: SupportedPositionComparisonOperator,
  ast: XPathAst,
): SupportedStepPositionPlan | undefined {
  const lastOffset = tryGetLastOffsetValue(ast);
  if (lastOffset === undefined) {
    return undefined;
  }

  switch (operator) {
    case '<':
    case 'lt':
      return { includedPositionFromLastOffsets: Array.from({ length: lastOffset + 1 }, (_, index) => index) };
    case '<=':
    case 'le':
      return lastOffset === 0
        ? { maximumPosition: 0 }
        : { includedPositionFromLastOffsets: Array.from({ length: lastOffset }, (_, index) => index) };
    case '>':
    case 'gt':
      return { maximumPositionFromLastOffset: lastOffset };
    case '>=':
    case 'ge':
      return { maximumPositionFromLastOffset: lastOffset + 1 };
    default:
      return undefined;
  }
}

function tryGetSupportedNegatedPositionModuloComparison(predicate: XPathAst): SupportedStepPositionPlan | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator !== '=' && operator !== 'eq') {
    return undefined;
  }

  const leftModuloDivisor = tryGetPositionModuloDivisor(predicate.left);
  const rightModuloDivisor = tryGetPositionModuloDivisor(predicate.right);
  const leftNumber = predicate.left.kind === 'number' ? predicate.left.value : undefined;
  const rightNumber = predicate.right.kind === 'number' ? predicate.right.value : undefined;

  if (leftModuloDivisor !== undefined && rightNumber !== undefined) {
    return createSupportedNegatedModuloPlan(leftModuloDivisor, rightNumber);
  }

  if (rightModuloDivisor !== undefined && leftNumber !== undefined) {
    return createSupportedNegatedModuloPlan(rightModuloDivisor, leftNumber);
  }

  return undefined;
}

function createSupportedNegatedModuloPlan(
  divisor: number,
  remainder: number,
): SupportedStepPositionPlan | undefined {
  if (!Number.isInteger(remainder) || remainder < 0 || remainder >= divisor) {
    return undefined;
  }

  const alternatives: SupportedStepPositionPlan[] = [];
  for (let candidateRemainder = 0; candidateRemainder < divisor; candidateRemainder += 1) {
    if (candidateRemainder === remainder) {
      continue;
    }

    alternatives.push({
      positionModuloDivisor: divisor,
      positionModuloRemainder: candidateRemainder,
    });
  }

  return alternatives.length === 0 ? { maximumPosition: 0 } : { alternatives };
}

function tryGetSupportedPositionModuloComparison(
  predicate: XPathAst,
): Pick<SimpleSelectPathStepPlan, 'positionModuloDivisor' | 'positionModuloRemainder'> | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator !== '=' && operator !== 'eq') {
    return undefined;
  }

  const leftModuloDivisor = tryGetPositionModuloDivisor(predicate.left);
  const rightModuloDivisor = tryGetPositionModuloDivisor(predicate.right);
  const leftNumber = predicate.left.kind === 'number' ? predicate.left.value : undefined;
  const rightNumber = predicate.right.kind === 'number' ? predicate.right.value : undefined;

  if (leftModuloDivisor !== undefined && rightNumber !== undefined) {
    return createSupportedPositionModuloPlan(leftModuloDivisor, rightNumber);
  }

  if (rightModuloDivisor !== undefined && leftNumber !== undefined) {
    return createSupportedPositionModuloPlan(rightModuloDivisor, leftNumber);
  }

  return undefined;
}

function reverseComparisonOperator(
  operator: SupportedPositionComparisonOperator,
): SupportedPositionComparisonOperator {
  switch (operator) {
    case '>':
      return '<';
    case 'gt':
      return 'lt';
    case '>=':
      return '<=';
    case 'ge':
      return 'le';
    case '<':
      return '>';
    case 'lt':
      return 'gt';
    case '<=':
      return '>=';
    case 'le':
      return 'ge';
    default:
      return operator;
  }
}

function getSupportedPositionComparisonOperator(operator: XPathBinaryOperator): SupportedPositionComparisonOperator | undefined {
  switch (operator) {
    case '=':
    case 'eq':
    case '>':
    case 'gt':
    case '>=':
    case 'ge':
    case '<':
    case 'lt':
    case '<=':
    case 'le':
    case '!=':
    case 'ne':
      return operator;
    default:
      return undefined;
  }
}

function isZeroArgFunctionCall(ast: XPathAst, callee: string): boolean {
  return ast.kind === 'functionCall' && ast.callee === callee && ast.arguments.length === 0;
}

function tryGetPositionModuloDivisor(
  ast: XPathAst,
): number | undefined {
  if (ast.kind !== 'binary' || ast.operator !== 'mod') {
    return undefined;
  }

  if (!isZeroArgFunctionCall(ast.left, 'position') || ast.right.kind !== 'number') {
    return undefined;
  }

  const divisor = ast.right.value;
  if (!Number.isInteger(divisor) || divisor <= 0) {
    return undefined;
  }

  return divisor;
}

function createSupportedPositionModuloPlan(
  divisor: number,
  remainder: number,
): Pick<SimpleSelectPathStepPlan, 'positionModuloDivisor' | 'positionModuloRemainder'> | undefined {
  if (!Number.isInteger(remainder) || remainder < 0 || remainder >= divisor) {
    return undefined;
  }

  return {
    positionModuloDivisor: divisor,
    positionModuloRemainder: remainder,
  };
}

function tryGetSupportedPositionLastDivisorComparison(
  predicate: XPathAst,
): SupportedStepPositionPlan | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator !== '=' && operator !== 'eq' && operator !== '!=' && operator !== 'ne') {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.right);
    return value === undefined ? undefined : createSupportedPositionLastDivisorComparison(operator, value);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.left);
    return value === undefined ? undefined : createSupportedPositionLastDivisorComparison(operator, value);
  }

  return undefined;
}

function tryGetSupportedPositionLastDivisorRangeComparison(
  predicate: XPathAst,
):
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalPolynomials'>
  | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator === undefined || operator === '=' || operator === 'eq' || operator === '!=' || operator === 'ne') {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.right);
    return value === undefined ? undefined : createSupportedPositionLastDivisorRangeComparison(operator, value);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.left);
    return value === undefined ? undefined : createSupportedPositionLastDivisorRangeComparison(reverseComparisonOperator(operator), value);
  }

  return undefined;
}

function createSupportedPositionLastDivisorRangeComparison(
  operator: SupportedPositionComparisonOperator,
  value: SupportedLastDivisorPolynomialValue,
):
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalPolynomials'>
  | undefined {
  const linearOffset = value.constantNumerator / value.denominator;
  const canUseLinearConstraint = value.quadraticNumerator === 0
    && value.linearNumerator > 0
    && Number.isInteger(linearOffset);

  switch (operator) {
    case '<':
    case 'lt':
      return canUseLinearConstraint
        ? value.linearNumerator !== 1
          ? { maximumPositionExclusiveTotalFractions: [{ denominator: value.denominator, numerator: value.linearNumerator, offset: linearOffset }] }
          : linearOffset === 0
          ? { maximumPositionExclusiveTotalDivisors: [value.denominator] }
          : { maximumPositionExclusiveTotalDivisorOffsets: [{ divisor: value.denominator, offset: linearOffset }] }
        : { maximumPositionExclusiveTotalPolynomials: [value] };
    case '<=':
    case 'le':
      return canUseLinearConstraint
        ? value.linearNumerator !== 1
          ? { maximumPositionInclusiveTotalFractions: [{ denominator: value.denominator, numerator: value.linearNumerator, offset: linearOffset }] }
          : linearOffset === 0
          ? { maximumPositionInclusiveTotalDivisors: [value.denominator] }
          : { maximumPositionInclusiveTotalDivisorOffsets: [{ divisor: value.denominator, offset: linearOffset }] }
        : { maximumPositionInclusiveTotalPolynomials: [value] };
    case '>':
    case 'gt':
      return canUseLinearConstraint
        ? value.linearNumerator !== 1
          ? { minimumPositionExclusiveTotalFractions: [{ denominator: value.denominator, numerator: value.linearNumerator, offset: linearOffset }] }
          : linearOffset === 0
          ? { minimumPositionExclusiveTotalDivisors: [value.denominator] }
          : { minimumPositionExclusiveTotalDivisorOffsets: [{ divisor: value.denominator, offset: linearOffset }] }
        : { minimumPositionExclusiveTotalPolynomials: [value] };
    case '>=':
    case 'ge':
      return canUseLinearConstraint
        ? value.linearNumerator !== 1
          ? { minimumPositionInclusiveTotalFractions: [{ denominator: value.denominator, numerator: value.linearNumerator, offset: linearOffset }] }
          : linearOffset === 0
          ? { minimumPositionInclusiveTotalDivisors: [value.denominator] }
          : { minimumPositionInclusiveTotalDivisorOffsets: [{ divisor: value.denominator, offset: linearOffset }] }
        : { minimumPositionInclusiveTotalPolynomials: [value] };
    default:
      return undefined;
  }
}

function createSupportedPositionLastDivisorComparison(
  operator: SupportedPositionComparisonOperator,
  value: SupportedLastDivisorPolynomialValue,
): SupportedStepPositionPlan | undefined {
  const linearOffset = value.constantNumerator / value.denominator;
  const canUseLinearConstraint = value.quadraticNumerator === 0
    && value.linearNumerator > 0
    && Number.isInteger(linearOffset);

  if (value.quadraticNumerator === 0 && value.linearNumerator <= 0) {
    return undefined;
  }

  switch (operator) {
    case '=':
    case 'eq':
      return canUseLinearConstraint
        ? {
            positionTotalDivisor: value.denominator,
            ...(value.linearNumerator === 1 ? {} : { positionTotalNumerator: value.linearNumerator }),
            ...(linearOffset === 0 ? {} : { positionTotalOffset: linearOffset }),
          }
        : {
            positionTotalPolynomialDenominator: value.denominator,
            positionTotalPolynomialQuadraticNumerator: value.quadraticNumerator,
            ...(value.linearNumerator === 0 ? {} : { positionTotalPolynomialLinearNumerator: value.linearNumerator }),
            ...(value.constantNumerator === 0 ? {} : { positionTotalPolynomialConstantNumerator: value.constantNumerator }),
          };
    case '!=':
    case 'ne':
      return canUseLinearConstraint
        ? value.linearNumerator !== 1
          ? { excludedPositionTotalFractions: [{ denominator: value.denominator, numerator: value.linearNumerator, offset: linearOffset }] }
          : linearOffset === 0
          ? { excludedPositionTotalDivisors: [value.denominator] }
          : { excludedPositionTotalDivisorOffsets: [{ divisor: value.denominator, offset: linearOffset }] }
        : {
            excludedPositionTotalPolynomials: [{
              denominator: value.denominator,
              quadraticNumerator: value.quadraticNumerator,
              linearNumerator: value.linearNumerator,
              constantNumerator: value.constantNumerator,
            }],
          };
    default:
      return undefined;
  }
}

function tryGetSupportedNegatedPositionLastDivisorComparison(
  predicate: XPathAst,
): SupportedStepPositionPlan | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator !== '=' && operator !== 'eq' && operator !== '!=' && operator !== 'ne') {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.right);
    return value === undefined ? undefined : createSupportedPositionLastDivisorComparison(negateComparisonOperator(operator), value);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.left);
    return value === undefined ? undefined : createSupportedPositionLastDivisorComparison(negateComparisonOperator(operator), value);
  }

  return undefined;
}

function tryGetSupportedNegatedPositionLastDivisorRangeComparison(
  predicate: XPathAst,
):
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionExclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'maximumPositionInclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionExclusiveTotalPolynomials'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalDivisors'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalDivisorOffsets'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalFractions'>
  | Pick<SimpleSelectPathStepPlan, 'minimumPositionInclusiveTotalPolynomials'>
  | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator === undefined || operator === '=' || operator === 'eq' || operator === '!=' || operator === 'ne') {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.right);
    return value === undefined ? undefined : createSupportedPositionLastDivisorRangeComparison(negateComparisonOperator(operator), value);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    const value = tryGetLastDivisorPolynomialValue(predicate.left);
    return value === undefined ? undefined : createSupportedPositionLastDivisorRangeComparison(reverseComparisonOperator(negateComparisonOperator(operator)), value);
  }

  return undefined;
}

function tryGetSupportedPositionLastOffsetComparison(
  predicate: XPathAst,
): Pick<SimpleSelectPathStepPlan, 'positionFromLastOffset'> | SupportedStepPositionPlan | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator !== '=' && operator !== 'eq' && operator !== '!=' && operator !== 'ne') {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    const lastOffset = tryGetLastOffsetValue(predicate.right);
    return lastOffset === undefined ? undefined : createSupportedPositionLastOffsetComparison(operator, lastOffset);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    const lastOffset = tryGetLastOffsetValue(predicate.left);
    return lastOffset === undefined ? undefined : createSupportedPositionLastOffsetComparison(operator, lastOffset);
  }

  return undefined;
}

function createSupportedPositionLastOffsetComparison(
  operator: SupportedPositionComparisonOperator,
  lastOffset: number,
): SupportedStepPositionPlan | undefined {
  switch (operator) {
    case '=':
    case 'eq':
      return { positionFromLastOffset: lastOffset };
    case '!=':
    case 'ne':
      return createSupportedNegatedPositionLastOffsetPlan(lastOffset);
  }

  return undefined;
}

function tryGetLastOffsetValue(ast: XPathAst): number | undefined {
  if (isZeroArgFunctionCall(ast, 'last')) {
    return 0;
  }

  if (ast.kind !== 'binary' || ast.operator !== '-') {
    return undefined;
  }

  if (!isZeroArgFunctionCall(ast.left, 'last') || ast.right.kind !== 'number') {
    return undefined;
  }

  const offset = ast.right.value;
  return Number.isInteger(offset) && offset >= 0 ? offset : undefined;
}

function tryGetLastDivisorValue(ast: XPathAst): number | undefined {
  if (ast.kind !== 'binary' || ast.operator !== 'div') {
    return undefined;
  }

  if (!isZeroArgFunctionCall(ast.left, 'last') || ast.right.kind !== 'number') {
    return undefined;
  }

  const divisor = ast.right.value;
  return Number.isInteger(divisor) && divisor > 0 ? divisor : undefined;
}

function tryGetLastDivisorOffsetValue(
  ast: XPathAst,
): { readonly divisor: number; readonly offset: number } | undefined {
  const divisor = tryGetLastDivisorValue(ast);
  if (divisor !== undefined) {
    return { divisor, offset: 0 };
  }

  if (ast.kind !== 'binary' || (ast.operator !== '+' && ast.operator !== '-')) {
    return undefined;
  }

  const leftDivisor = tryGetLastDivisorValue(ast.left);
  if (leftDivisor === undefined || ast.right.kind !== 'number' || !Number.isInteger(ast.right.value)) {
    return undefined;
  }

  return {
    divisor: leftDivisor,
    offset: ast.operator === '+' ? ast.right.value : -ast.right.value,
  };
}

function tryGetLastDivisorLinearValue(
  ast: XPathAst,
): { readonly denominator: number; readonly numerator: number; readonly offset: number } | undefined {
  if (ast.kind === 'sequence' && ast.items.length === 1) {
    const [item] = ast.items;
    return item === undefined ? undefined : tryGetLastDivisorLinearValue(item);
  }

  if (ast.kind === 'number') {
    return Number.isInteger(ast.value) ? { denominator: 1, numerator: 0, offset: ast.value } : undefined;
  }

  const divisorOffset = tryGetLastDivisorOffsetValue(ast);
  if (divisorOffset !== undefined) {
    return { denominator: divisorOffset.divisor, numerator: 1, offset: divisorOffset.offset };
  }

  if (ast.kind !== 'binary') {
    return undefined;
  }

  if (ast.operator === '*') {
    if (ast.left.kind === 'number' && Number.isInteger(ast.left.value) && ast.left.value > 0) {
      const rightValue = tryGetLastDivisorLinearValue(ast.right);
      return rightValue === undefined ? undefined : scaleLastDivisorLinearValue(rightValue, ast.left.value);
    }

    if (ast.right.kind === 'number' && Number.isInteger(ast.right.value) && ast.right.value > 0) {
      const leftValue = tryGetLastDivisorLinearValue(ast.left);
      return leftValue === undefined ? undefined : scaleLastDivisorLinearValue(leftValue, ast.right.value);
    }

    return undefined;
  }

  if (ast.operator !== '+' && ast.operator !== '-') {
    return undefined;
  }

  const leftValue = tryGetLastDivisorLinearValue(ast.left);
  const rightValue = tryGetLastDivisorLinearValue(ast.right);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  const denominator = getLeastCommonMultiple(leftValue.denominator, rightValue.denominator);
  const signedRightNumerator = ast.operator === '+' ? rightValue.numerator : -rightValue.numerator;
  const signedRightOffset = ast.operator === '+' ? rightValue.offset : -rightValue.offset;
  const numerator = (leftValue.numerator * (denominator / leftValue.denominator)) + (signedRightNumerator * (denominator / rightValue.denominator));
  const offset = leftValue.offset + signedRightOffset;

  if (numerator === 0) {
    return { denominator: 1, numerator: 0, offset };
  }

  const greatestCommonDivisor = getGreatestCommonDivisor(Math.abs(numerator), denominator);
  return {
    denominator: denominator / greatestCommonDivisor,
    numerator: numerator / greatestCommonDivisor,
    offset,
  };
}

function scaleLastDivisorLinearValue(
  value: { readonly denominator: number; readonly numerator: number; readonly offset: number },
  factor: number,
): { readonly denominator: number; readonly numerator: number; readonly offset: number } {
  if (value.numerator === 0) {
    return {
      denominator: 1,
      numerator: 0,
      offset: value.offset * factor,
    };
  }

  const scaledNumerator = value.numerator * factor;
  const greatestCommonDivisor = getGreatestCommonDivisor(Math.abs(scaledNumerator), value.denominator);
  return {
    denominator: value.denominator / greatestCommonDivisor,
    numerator: scaledNumerator / greatestCommonDivisor,
    offset: value.offset * factor,
  };
}

function tryGetLastDivisorPolynomialValue(ast: XPathAst): SupportedLastDivisorPolynomialValue | undefined {
  const linearValue = tryGetLastDivisorLinearValue(ast);
  if (linearValue !== undefined) {
    return {
      denominator: linearValue.denominator,
      quadraticNumerator: 0,
      linearNumerator: linearValue.numerator,
      constantNumerator: linearValue.offset * linearValue.denominator,
    };
  }

  if (ast.kind !== 'binary' || ast.operator !== '*') {
    return undefined;
  }

  const leftValue = tryGetLastDivisorPolynomialValue(ast.left);
  const rightValue = tryGetLastDivisorPolynomialValue(ast.right);
  if (leftValue === undefined || rightValue === undefined || leftValue.quadraticNumerator !== 0 || rightValue.quadraticNumerator !== 0) {
    return undefined;
  }

  return normalizeLastDivisorPolynomialValue({
    denominator: leftValue.denominator * rightValue.denominator,
    quadraticNumerator: leftValue.linearNumerator * rightValue.linearNumerator,
    linearNumerator: (leftValue.linearNumerator * rightValue.constantNumerator) + (rightValue.linearNumerator * leftValue.constantNumerator),
    constantNumerator: leftValue.constantNumerator * rightValue.constantNumerator,
  });
}

function normalizeLastDivisorPolynomialValue(
  value: SupportedLastDivisorPolynomialValue,
): SupportedLastDivisorPolynomialValue {
  if (value.quadraticNumerator === 0 && value.linearNumerator === 0 && value.constantNumerator === 0) {
    return {
      denominator: 1,
      quadraticNumerator: 0,
      linearNumerator: 0,
      constantNumerator: 0,
    };
  }

  const coefficients = [
    Math.abs(value.quadraticNumerator),
    Math.abs(value.linearNumerator),
    Math.abs(value.constantNumerator),
    value.denominator,
  ].filter((coefficient) => coefficient !== 0);
  const greatestCommonDivisor = coefficients.reduce(
    (divisor, coefficient) => getGreatestCommonDivisor(divisor, coefficient),
  );

  return greatestCommonDivisor === 1
    ? value
    : {
        denominator: value.denominator / greatestCommonDivisor,
        quadraticNumerator: value.quadraticNumerator / greatestCommonDivisor,
        linearNumerator: value.linearNumerator / greatestCommonDivisor,
        constantNumerator: value.constantNumerator / greatestCommonDivisor,
      };
}

function tryGetSupportedPositionLastRangeComparison(
  predicate: XPathAst,
): Pick<SimpleSelectPathStepPlan, 'maximumPositionFromLastOffset' | 'includedPositionFromLastOffsets'> | undefined {
  if (predicate.kind !== 'binary') {
    return undefined;
  }

  const operator = getSupportedPositionComparisonOperator(predicate.operator);
  if (operator === undefined) {
    return undefined;
  }

  if (isZeroArgFunctionCall(predicate.left, 'position')) {
    return createSupportedPositionLastRangeComparison(operator, predicate.right);
  }

  if (isZeroArgFunctionCall(predicate.right, 'position')) {
    return createSupportedPositionLastRangeComparison(reverseComparisonOperator(operator), predicate.left);
  }

  return undefined;
}

function createSupportedPositionLastRangeComparison(
  operator: SupportedPositionComparisonOperator,
  ast: XPathAst,
): Pick<SimpleSelectPathStepPlan, 'maximumPositionFromLastOffset' | 'includedPositionFromLastOffsets'> | undefined {
  const lastOffset = tryGetLastOffsetValue(ast);
  if (lastOffset === undefined) {
    return undefined;
  }

  switch (operator) {
    case '<':
    case 'lt':
      return { maximumPositionFromLastOffset: lastOffset + 1 };
    case '<=':
    case 'le':
      return { maximumPositionFromLastOffset: lastOffset };
    case '>':
    case 'gt':
      return { includedPositionFromLastOffsets: Array.from({ length: lastOffset }, (_, index) => index) };
    case '>=':
    case 'ge':
      return { includedPositionFromLastOffsets: Array.from({ length: lastOffset + 1 }, (_, index) => index) };
    default:
      return undefined;
  }
}

function mergeSupportedStepPositionPlans(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): SupportedStepPositionPlan | undefined {
  if (left.alternatives !== undefined || right.alternatives !== undefined) {
    const leftAlternatives = getSupportedStepPositionAlternatives(left);
    const rightAlternatives = getSupportedStepPositionAlternatives(right);
    if (leftAlternatives === undefined || rightAlternatives === undefined) {
      return undefined;
    }

    const mergedAlternatives: SupportedStepPositionPlan[] = [];
    for (const leftAlternative of leftAlternatives) {
      for (const rightAlternative of rightAlternatives) {
        const mergedAlternative = mergeSupportedStepPositionPlans(leftAlternative, rightAlternative);
        if (mergedAlternative === undefined) {
          return undefined;
        }

        mergedAlternatives.push(mergedAlternative);
      }
    }

    return mergedAlternatives.length === 1 ? mergedAlternatives[0] : { alternatives: mergedAlternatives };
  }

  if (
    left.includedPositions !== undefined
    || right.includedPositions !== undefined
  ) {
    return undefined;
  }

  const position = getMergedExactPosition(left, right);
  if (position === undefined && (left.position !== undefined || right.position !== undefined)) {
    return undefined;
  }

  const positionTotalConstraint = getMergedPositionTotalConstraint(left, right);
  if (
    positionTotalConstraint === undefined
    && (
      left.positionTotalDivisor !== undefined
      || right.positionTotalDivisor !== undefined
      || left.positionTotalPolynomialDenominator !== undefined
      || right.positionTotalPolynomialDenominator !== undefined
    )
  ) {
    return undefined;
  }

  const positionFromLastOffset = getMergedPositionFromLastOffset(left, right);
  if (positionFromLastOffset === undefined && (left.positionFromLastOffset !== undefined || right.positionFromLastOffset !== undefined)) {
    return undefined;
  }

  const excludedPositions = getMergedExcludedPositions(left, right);
  const excludedPositionTotalDivisors = getMergedExcludedPositionTotalDivisors(left, right);
  const excludedPositionTotalDivisorOffsets = getMergedExcludedPositionTotalDivisorOffsets(left, right);
  const excludedPositionTotalFractions = getMergedExcludedPositionTotalFractions(left, right);
  const excludedPositionTotalPolynomials = getMergedExcludedPositionTotalPolynomials(left, right);
  const maximumPositionExclusiveTotalDivisors = getMergedDivisorConstraintValues(left, right, 'maximumPositionExclusiveTotalDivisors');
  const maximumPositionExclusiveTotalDivisorOffsets = getMergedDivisorOffsetConstraintValues(left, right, 'maximumPositionExclusiveTotalDivisorOffsets');
  const maximumPositionExclusiveTotalFractions = getMergedFractionConstraintValues(left, right, 'maximumPositionExclusiveTotalFractions');
  const maximumPositionExclusiveTotalPolynomials = getMergedPolynomialConstraintValues(left, right, 'maximumPositionExclusiveTotalPolynomials');
  const maximumPositionInclusiveTotalDivisors = getMergedDivisorConstraintValues(left, right, 'maximumPositionInclusiveTotalDivisors');
  const maximumPositionInclusiveTotalDivisorOffsets = getMergedDivisorOffsetConstraintValues(left, right, 'maximumPositionInclusiveTotalDivisorOffsets');
  const maximumPositionInclusiveTotalFractions = getMergedFractionConstraintValues(left, right, 'maximumPositionInclusiveTotalFractions');
  const maximumPositionInclusiveTotalPolynomials = getMergedPolynomialConstraintValues(left, right, 'maximumPositionInclusiveTotalPolynomials');
  const minimumPositionExclusiveTotalDivisors = getMergedDivisorConstraintValues(left, right, 'minimumPositionExclusiveTotalDivisors');
  const minimumPositionExclusiveTotalDivisorOffsets = getMergedDivisorOffsetConstraintValues(left, right, 'minimumPositionExclusiveTotalDivisorOffsets');
  const minimumPositionExclusiveTotalFractions = getMergedFractionConstraintValues(left, right, 'minimumPositionExclusiveTotalFractions');
  const minimumPositionExclusiveTotalPolynomials = getMergedPolynomialConstraintValues(left, right, 'minimumPositionExclusiveTotalPolynomials');
  const minimumPositionInclusiveTotalDivisors = getMergedDivisorConstraintValues(left, right, 'minimumPositionInclusiveTotalDivisors');
  const minimumPositionInclusiveTotalDivisorOffsets = getMergedDivisorOffsetConstraintValues(left, right, 'minimumPositionInclusiveTotalDivisorOffsets');
  const minimumPositionInclusiveTotalFractions = getMergedFractionConstraintValues(left, right, 'minimumPositionInclusiveTotalFractions');
  const minimumPositionInclusiveTotalPolynomials = getMergedPolynomialConstraintValues(left, right, 'minimumPositionInclusiveTotalPolynomials');
  const excludedPosition = excludedPositions.length === 1 ? excludedPositions[0]! : undefined;
  const includedPositionFromLastOffsets = getMergedIncludedPositionFromLastOffsets(left, right);

  const sharedConstraints: SupportedStepPositionPlan = {
    ...(position === undefined ? {} : { position }),
    ...(positionTotalConstraint === undefined
      ? {}
      : positionTotalConstraint.quadraticNumerator === 0
        && positionTotalConstraint.linearNumerator > 0
        && positionTotalConstraint.constantNumerator % positionTotalConstraint.denominator === 0
        ? {
            positionTotalDivisor: positionTotalConstraint.denominator,
            ...(positionTotalConstraint.linearNumerator === 1 ? {} : { positionTotalNumerator: positionTotalConstraint.linearNumerator }),
            ...((positionTotalConstraint.constantNumerator / positionTotalConstraint.denominator) === 0 ? {} : { positionTotalOffset: positionTotalConstraint.constantNumerator / positionTotalConstraint.denominator }),
          }
        : {
            positionTotalPolynomialDenominator: positionTotalConstraint.denominator,
            positionTotalPolynomialQuadraticNumerator: positionTotalConstraint.quadraticNumerator,
            ...(positionTotalConstraint.linearNumerator === 0 ? {} : { positionTotalPolynomialLinearNumerator: positionTotalConstraint.linearNumerator }),
            ...(positionTotalConstraint.constantNumerator === 0 ? {} : { positionTotalPolynomialConstantNumerator: positionTotalConstraint.constantNumerator }),
          }),
    ...(positionFromLastOffset === undefined ? {} : { positionFromLastOffset }),
    ...(left.minimumPosition === undefined && right.minimumPosition === undefined
      ? {}
      : { minimumPosition: Math.max(left.minimumPosition ?? 1, right.minimumPosition ?? 1) }),
    ...(left.maximumPosition === undefined && right.maximumPosition === undefined
      ? {}
      : {
          maximumPosition: Math.min(
            left.maximumPosition ?? Number.POSITIVE_INFINITY,
            right.maximumPosition ?? Number.POSITIVE_INFINITY,
          ),
        }),
    ...(left.maximumPositionFromLastOffset === undefined && right.maximumPositionFromLastOffset === undefined
      ? {}
      : {
          maximumPositionFromLastOffset: Math.max(
            left.maximumPositionFromLastOffset ?? 0,
            right.maximumPositionFromLastOffset ?? 0,
          ),
        }),
    ...(excludedPositions.length === 0
      ? {}
      : excludedPosition !== undefined
        ? { excludedPosition }
        : { excludedPositions }),
    ...(excludedPositionTotalDivisors.length === 0 ? {} : { excludedPositionTotalDivisors }),
    ...(excludedPositionTotalDivisorOffsets.length === 0 ? {} : { excludedPositionTotalDivisorOffsets }),
    ...(excludedPositionTotalFractions.length === 0 ? {} : { excludedPositionTotalFractions }),
    ...(excludedPositionTotalPolynomials.length === 0 ? {} : { excludedPositionTotalPolynomials }),
    ...(maximumPositionExclusiveTotalDivisors.length === 0 ? {} : { maximumPositionExclusiveTotalDivisors }),
    ...(maximumPositionExclusiveTotalDivisorOffsets.length === 0 ? {} : { maximumPositionExclusiveTotalDivisorOffsets }),
    ...(maximumPositionExclusiveTotalFractions.length === 0 ? {} : { maximumPositionExclusiveTotalFractions }),
    ...(maximumPositionExclusiveTotalPolynomials.length === 0 ? {} : { maximumPositionExclusiveTotalPolynomials }),
    ...(maximumPositionInclusiveTotalDivisors.length === 0 ? {} : { maximumPositionInclusiveTotalDivisors }),
    ...(maximumPositionInclusiveTotalDivisorOffsets.length === 0 ? {} : { maximumPositionInclusiveTotalDivisorOffsets }),
    ...(maximumPositionInclusiveTotalFractions.length === 0 ? {} : { maximumPositionInclusiveTotalFractions }),
    ...(maximumPositionInclusiveTotalPolynomials.length === 0 ? {} : { maximumPositionInclusiveTotalPolynomials }),
    ...(minimumPositionExclusiveTotalDivisors.length === 0 ? {} : { minimumPositionExclusiveTotalDivisors }),
    ...(minimumPositionExclusiveTotalDivisorOffsets.length === 0 ? {} : { minimumPositionExclusiveTotalDivisorOffsets }),
    ...(minimumPositionExclusiveTotalFractions.length === 0 ? {} : { minimumPositionExclusiveTotalFractions }),
    ...(minimumPositionExclusiveTotalPolynomials.length === 0 ? {} : { minimumPositionExclusiveTotalPolynomials }),
    ...(minimumPositionInclusiveTotalDivisors.length === 0 ? {} : { minimumPositionInclusiveTotalDivisors }),
    ...(minimumPositionInclusiveTotalDivisorOffsets.length === 0 ? {} : { minimumPositionInclusiveTotalDivisorOffsets }),
    ...(minimumPositionInclusiveTotalFractions.length === 0 ? {} : { minimumPositionInclusiveTotalFractions }),
    ...(minimumPositionInclusiveTotalPolynomials.length === 0 ? {} : { minimumPositionInclusiveTotalPolynomials }),
    ...(includedPositionFromLastOffsets === undefined ? {} : { includedPositionFromLastOffsets }),
  };

  const mergedModuloPlan = mergeSupportedStepPositionModuloPlans(left, right);
  if (mergedModuloPlan === undefined) {
    return undefined;
  }

  if (mergedModuloPlan.alternatives === undefined) {
    return {
      ...sharedConstraints,
      ...mergedModuloPlan,
    };
  }

  return {
    alternatives: mergedModuloPlan.alternatives.map((alternative) => ({
      ...sharedConstraints,
      ...alternative,
    })),
  };
}

function mergeSupportedStepPositionModuloPlans(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): SupportedStepPositionPlan | undefined {
  const leftHasModulo = left.positionModuloDivisor !== undefined || left.positionModuloRemainder !== undefined;
  const rightHasModulo = right.positionModuloDivisor !== undefined || right.positionModuloRemainder !== undefined;

  if (!leftHasModulo && !rightHasModulo) {
    return {};
  }

  if (!leftHasModulo) {
    return {
      ...(right.positionModuloDivisor === undefined ? {} : { positionModuloDivisor: right.positionModuloDivisor }),
      ...(right.positionModuloRemainder === undefined ? {} : { positionModuloRemainder: right.positionModuloRemainder }),
    };
  }

  if (!rightHasModulo) {
    return {
      ...(left.positionModuloDivisor === undefined ? {} : { positionModuloDivisor: left.positionModuloDivisor }),
      ...(left.positionModuloRemainder === undefined ? {} : { positionModuloRemainder: left.positionModuloRemainder }),
    };
  }

  if (
    left.positionModuloDivisor === undefined
    || left.positionModuloRemainder === undefined
    || right.positionModuloDivisor === undefined
    || right.positionModuloRemainder === undefined
  ) {
    return undefined;
  }

  const moduloDivisor = getLeastCommonMultiple(left.positionModuloDivisor, right.positionModuloDivisor);
  const alternatives: SupportedStepPositionPlan[] = [];

  for (let remainder = 0; remainder < moduloDivisor; remainder += 1) {
    if (
      remainder % left.positionModuloDivisor === left.positionModuloRemainder
      && remainder % right.positionModuloDivisor === right.positionModuloRemainder
    ) {
      alternatives.push({
        positionModuloDivisor: moduloDivisor,
        positionModuloRemainder: remainder,
      });
    }
  }

  if (alternatives.length === 0) {
    return { maximumPosition: 0 };
  }

  return alternatives.length === 1 ? alternatives[0] : { alternatives };
}

function getLeastCommonMultiple(left: number, right: number): number {
  return (left / getGreatestCommonDivisor(left, right)) * right;
}

function getGreatestCommonDivisor(left: number, right: number): number {
  let dividend = left;
  let divisor = right;

  while (divisor !== 0) {
    const remainder = dividend % divisor;
    dividend = divisor;
    divisor = remainder;
  }

  return dividend;
}

function unionSupportedStepPositionPlans(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): SupportedStepPositionPlan | undefined {
  const leftAlternatives = getSupportedStepPositionAlternatives(left);
  const rightAlternatives = getSupportedStepPositionAlternatives(right);
  if (leftAlternatives === undefined || rightAlternatives === undefined) {
    return undefined;
  }

  return {
    alternatives: [...leftAlternatives, ...rightAlternatives],
  };
}

function getSupportedStepPositionAlternatives(
  plan: SupportedStepPositionPlan,
): readonly SupportedStepPositionPlan[] | undefined {
  return plan.alternatives ?? [plan];
}

function getMergedExcludedPositions(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): number[] {
  return [...new Set([
    ...(left.excludedPosition === undefined ? [] : [left.excludedPosition]),
    ...(left.excludedPositions ?? []),
    ...(right.excludedPosition === undefined ? [] : [right.excludedPosition]),
    ...(right.excludedPositions ?? []),
  ])].sort((first, second) => first - second);
}

function getMergedIncludedPositionFromLastOffsets(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): readonly number[] | undefined {
  if (left.includedPositionFromLastOffsets === undefined) {
    return right.includedPositionFromLastOffsets;
  }

  if (right.includedPositionFromLastOffsets === undefined) {
    return left.includedPositionFromLastOffsets;
  }

  return left.includedPositionFromLastOffsets.filter((offset) => right.includedPositionFromLastOffsets?.includes(offset));
}

function getMergedExcludedPositionTotalDivisors(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): number[] {
  return [...new Set([
    ...(left.excludedPositionTotalDivisors ?? []),
    ...(right.excludedPositionTotalDivisors ?? []),
  ])].sort((first, second) => first - second);
}

function getMergedExcludedPositionTotalDivisorOffsets(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): { readonly divisor: number; readonly offset: number }[] {
  return [...new Map(
    [
      ...(left.excludedPositionTotalDivisorOffsets ?? []),
      ...(right.excludedPositionTotalDivisorOffsets ?? []),
    ].map((value) => [`${value.divisor}:${value.offset}`, value] as const),
  ).values()].sort((first, second) => first.divisor - second.divisor || first.offset - second.offset);
}

function getMergedExcludedPositionTotalFractions(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): { readonly denominator: number; readonly numerator: number; readonly offset: number }[] {
  return [...new Map(
    [
      ...(left.excludedPositionTotalFractions ?? []),
      ...(right.excludedPositionTotalFractions ?? []),
    ].map((value) => [`${value.denominator}:${value.numerator}:${value.offset}`, value] as const),
  ).values()].sort(
    (first, second) => first.denominator - second.denominator || first.numerator - second.numerator || first.offset - second.offset,
  );
}

function getMergedExcludedPositionTotalPolynomials(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): { readonly denominator: number; readonly quadraticNumerator: number; readonly linearNumerator: number; readonly constantNumerator: number }[] {
  return [...new Map(
    [
      ...(left.excludedPositionTotalPolynomials ?? []),
      ...(right.excludedPositionTotalPolynomials ?? []),
    ].map((value) => [`${value.denominator}:${value.quadraticNumerator}:${value.linearNumerator}:${value.constantNumerator}`, value] as const),
  ).values()].sort(
    (first, second) => first.denominator - second.denominator
      || first.quadraticNumerator - second.quadraticNumerator
      || first.linearNumerator - second.linearNumerator
      || first.constantNumerator - second.constantNumerator,
  );
}

function getMergedDivisorConstraintValues(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
  key:
    | 'maximumPositionExclusiveTotalDivisors'
    | 'maximumPositionInclusiveTotalDivisors'
    | 'minimumPositionExclusiveTotalDivisors'
    | 'minimumPositionInclusiveTotalDivisors',
): number[] {
  return [...new Set([
    ...(left[key] ?? []),
    ...(right[key] ?? []),
  ])].sort((first, second) => first - second);
}

function getMergedDivisorOffsetConstraintValues(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
  key:
    | 'maximumPositionExclusiveTotalDivisorOffsets'
    | 'maximumPositionInclusiveTotalDivisorOffsets'
    | 'minimumPositionExclusiveTotalDivisorOffsets'
    | 'minimumPositionInclusiveTotalDivisorOffsets',
): { readonly divisor: number; readonly offset: number }[] {
  return [...new Map(
    [
      ...(left[key] ?? []),
      ...(right[key] ?? []),
    ].map((value) => [`${value.divisor}:${value.offset}`, value] as const),
  ).values()].sort((first, second) => first.divisor - second.divisor || first.offset - second.offset);
}

function getMergedFractionConstraintValues(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
  key:
    | 'maximumPositionExclusiveTotalFractions'
    | 'maximumPositionInclusiveTotalFractions'
    | 'minimumPositionExclusiveTotalFractions'
    | 'minimumPositionInclusiveTotalFractions',
): { readonly denominator: number; readonly numerator: number; readonly offset: number }[] {
  return [...new Map(
    [
      ...(left[key] ?? []),
      ...(right[key] ?? []),
    ].map((value) => [`${value.denominator}:${value.numerator}:${value.offset}`, value] as const),
  ).values()].sort(
    (first, second) => first.denominator - second.denominator || first.numerator - second.numerator || first.offset - second.offset,
  );
}

function getMergedPolynomialConstraintValues(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
  key:
    | 'maximumPositionExclusiveTotalPolynomials'
    | 'maximumPositionInclusiveTotalPolynomials'
    | 'minimumPositionExclusiveTotalPolynomials'
    | 'minimumPositionInclusiveTotalPolynomials',
): { readonly denominator: number; readonly quadraticNumerator: number; readonly linearNumerator: number; readonly constantNumerator: number }[] {
  return [...new Map(
    [
      ...(left[key] ?? []),
      ...(right[key] ?? []),
    ].map((value) => [`${value.denominator}:${value.quadraticNumerator}:${value.linearNumerator}:${value.constantNumerator}`, value] as const),
  ).values()].sort(
    (first, second) => first.denominator - second.denominator
      || first.quadraticNumerator - second.quadraticNumerator
      || first.linearNumerator - second.linearNumerator
      || first.constantNumerator - second.constantNumerator,
  );
}

function getMergedExactPosition(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): number | 'last' | undefined {
  if (left.position === undefined) {
    return right.position;
  }

  if (right.position === undefined) {
    return left.position;
  }

  return left.position === right.position ? left.position : undefined;
}

function getMergedPositionFromLastOffset(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): number | undefined {
  if (left.positionFromLastOffset === undefined) {
    return right.positionFromLastOffset;
  }

  if (right.positionFromLastOffset === undefined) {
    return left.positionFromLastOffset;
  }

  return left.positionFromLastOffset === right.positionFromLastOffset ? left.positionFromLastOffset : undefined;
}

function getPositionTotalConstraint(
  plan: SupportedStepPositionPlan,
): SupportedLastDivisorPolynomialValue | undefined {
  if (plan.positionTotalPolynomialDenominator !== undefined) {
    return {
      denominator: plan.positionTotalPolynomialDenominator,
      quadraticNumerator: plan.positionTotalPolynomialQuadraticNumerator ?? 0,
      linearNumerator: plan.positionTotalPolynomialLinearNumerator ?? 0,
      constantNumerator: plan.positionTotalPolynomialConstantNumerator ?? 0,
    };
  }

  if (plan.positionTotalDivisor === undefined) {
    return undefined;
  }

  return {
    denominator: plan.positionTotalDivisor,
    quadraticNumerator: 0,
    linearNumerator: plan.positionTotalNumerator ?? 1,
    constantNumerator: (plan.positionTotalOffset ?? 0) * plan.positionTotalDivisor,
  };
}

function getMergedPositionTotalConstraint(
  left: SupportedStepPositionPlan,
  right: SupportedStepPositionPlan,
): SupportedLastDivisorPolynomialValue | undefined {
  const leftConstraint = getPositionTotalConstraint(left);
  if (leftConstraint === undefined) {
    return getPositionTotalConstraint(right);
  }

  const rightConstraint = getPositionTotalConstraint(right);
  if (rightConstraint === undefined) {
    return leftConstraint;
  }

  return leftConstraint.denominator === rightConstraint.denominator
    && leftConstraint.quadraticNumerator === rightConstraint.quadraticNumerator
    && leftConstraint.linearNumerator === rightConstraint.linearNumerator
    && leftConstraint.constantNumerator === rightConstraint.constantNumerator
    ? leftConstraint
    : undefined;
}