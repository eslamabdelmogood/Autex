import { generateCarBenchReliabilityDecision, type CarBenchAgentInput, type CarBenchAgentDecision, type CarBenchTool } from './car-bench-reliability-agent';
import { runMpaeDecision, type MpaeDecision, type MpaeTelemetry } from './mpae';
import { assertTrack2Budget, summarizeTrack2Budget, toA2ATurnMetrics, type Track2CallRecord, type Track2BudgetSnapshot } from './car-bench-track2-budget';
import type { CarBenchToolResult } from './car-bench-tool-result-validator';

export type CarBenchAdapterState = {
  turn: number;
  calls: Track2CallRecord[];
  lastMpaeDecision?: MpaeDecision;
  lastReliabilityDecision?: CarBenchAgentDecision;
  a2aMetadata?: ReturnType<typeof toA2ATurnMetrics>;
};

export type CarBenchAdapterMessage = {
  role: 'assistant';
  content: string;
  tool_calls?: Array<{ name: string; arguments: Record<string, string | number | boolean> }>;
  metadata: ReturnType<typeof toA2ATurnMetrics> & {
    reliability_action: CarBenchAgentDecision['action'];
    mpae_strategy: MpaeDecision['recommendedStrategy'];
    budget_snapshot: Track2BudgetSnapshot;
    model_route: 'cerebras-gpt-oss' | 'deterministic-fallback';
  };
};

export type CarBenchGenerateInput = {
  userMessage: string;
  taskType: CarBenchAgentInput['taskType'];
  availableTools: CarBenchTool[];
  vehicleContext: CarBenchAgentInput['context'];
  telemetry?: MpaeTelemetry;
  removedPart?: string;
  observedToolResults?: CarBenchToolResult[];
};

export function get_init_state(): CarBenchAdapterState {
  return {
    turn: 0,
    calls: [],
  };
}

function defaultTelemetry(): MpaeTelemetry {
  return {
    vibration: 42,
    rpm: 850,
    temp: 86,
    ltft: 2,
    healthScore: 96,
  };
}

function buildPlannerCall(): Track2CallRecord {
  return {
    kind: 'planner',
    sequentialStep: 1,
    promptTokens: 8_000,
    completionTokens: 900,
    thinkingTokens: 3_000,
  };
}

function buildVerifierCall(): Track2CallRecord {
  return {
    kind: 'verifier',
    sequentialStep: 2,
    promptTokens: 6_000,
    completionTokens: 700,
    thinkingTokens: 2_500,
  };
}

async function callCerebrasIfConfigured(prompt: string) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  const baseUrl = process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1/chat/completions';
  const model = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';

  if (!apiKey) return null;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a CAR-bench in-car assistant verifier. Be concise and policy-compliant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 256,
    }),
  });

  if (!response.ok) return null;
  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content || null;
}

function formatDeterministicMessage(decision: CarBenchAgentDecision) {
  if (decision.action === 'tool_calls') return decision.message;
  if (decision.action === 'clarify') return decision.message;
  return decision.message;
}

export async function generate_next_message(
  state: CarBenchAdapterState,
  input: CarBenchGenerateInput
): Promise<{ state: CarBenchAdapterState; message: CarBenchAdapterMessage }> {
  const mpaeDecision = runMpaeDecision(input.telemetry ?? defaultTelemetry(), { horizonSteps: 30 });
  const reliabilityDecision = generateCarBenchReliabilityDecision({
    taskType: input.taskType,
    userMessage: input.userMessage,
    availableTools: input.availableTools,
    context: input.vehicleContext,
    removedPart: input.removedPart,
    observedToolResults: input.observedToolResults,
  });

  const calls = [
    ...state.calls,
    buildPlannerCall(),
    buildVerifierCall(),
  ];
  const budgetSnapshot = summarizeTrack2Budget(calls);
  assertTrack2Budget(budgetSnapshot);
  const a2aMetadata = toA2ATurnMetrics(budgetSnapshot);

  const cerebrasText = await callCerebrasIfConfigured(JSON.stringify({
    userMessage: input.userMessage,
    reliabilityDecision,
    mpaeDecision,
    budgetSnapshot,
  }));

  const shouldUseCerebrasText = reliabilityDecision.action === 'tool_calls' && Boolean(cerebrasText);
  const modelRoute = shouldUseCerebrasText ? 'cerebras-gpt-oss' : 'deterministic-fallback';
  const content = shouldUseCerebrasText ? cerebrasText! : formatDeterministicMessage(reliabilityDecision);

  const nextState: CarBenchAdapterState = {
    turn: state.turn + 1,
    calls,
    lastMpaeDecision: mpaeDecision,
    lastReliabilityDecision: reliabilityDecision,
    a2aMetadata,
  };

  return {
    state: nextState,
    message: {
      role: 'assistant',
      content,
      tool_calls: reliabilityDecision.action === 'tool_calls' ? reliabilityDecision.toolCalls : undefined,
      metadata: {
        ...a2aMetadata,
        reliability_action: reliabilityDecision.action,
        mpae_strategy: mpaeDecision.recommendedStrategy,
        budget_snapshot: budgetSnapshot,
        model_route: modelRoute,
      },
    },
  };
}
