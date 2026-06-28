export type CarBenchTaskType = 'base' | 'hallucination' | 'disambiguation';

export type CarBenchTool = {
  name: string;
  requiredParameters?: string[];
};

export type CarBenchVehicleContext = {
  weatherChecked?: boolean;
  weatherCondition?: string;
  userConfirmedWeatherRisk?: boolean;
  sunshadePosition?: number;
  sunroofPosition?: number;
  preferredSunroofPercentage?: number;
};

export type CarBenchAgentInput = {
  taskType: CarBenchTaskType;
  userMessage: string;
  availableTools: CarBenchTool[];
  context: CarBenchVehicleContext;
  removedPart?: string;
};

export type CarBenchToolCall = {
  name: string;
  arguments: Record<string, string | number | boolean>;
};

export type CarBenchAgentDecision = {
  action: 'tool_calls' | 'clarify' | 'refuse_or_defer';
  toolCalls: CarBenchToolCall[];
  message: string;
  reliabilityNotes: string[];
};

function hasTool(tools: CarBenchTool[], name: string) {
  return tools.some((tool) => tool.name === name);
}

function isRainy(condition?: string) {
  return Boolean(condition?.toLowerCase().includes('rain'));
}

function includesSunroofIntent(message: string) {
  return /sunroof|fresh air|roof/i.test(message);
}

function extractPercentage(message: string) {
  const percentMatch = message.match(/(\d{1,3})\s*%/);
  if (!percentMatch) return undefined;

  const percentage = Number(percentMatch[1]);
  if (!Number.isFinite(percentage)) return undefined;
  return Math.max(0, Math.min(100, percentage));
}

function canCallSunshade(tools: CarBenchTool[]) {
  return hasTool(tools, 'open_close_sunshade');
}

function canCallSunroof(tools: CarBenchTool[]) {
  return hasTool(tools, 'open_close_sunroof');
}

function needsSunshadeBeforeSunroof(context: CarBenchVehicleContext) {
  return (context.sunshadePosition ?? 0) < 100;
}

export function generateCarBenchReliabilityDecision(input: CarBenchAgentInput): CarBenchAgentDecision {
  const notes: string[] = [];
  const message = input.userMessage;

  if (!includesSunroofIntent(message)) {
    return {
      action: 'clarify',
      toolCalls: [],
      message: 'I need a clearer vehicle-control request before taking action.',
      reliabilityNotes: ['No supported sunroof intent detected.'],
    };
  }

  if (!hasTool(input.availableTools, 'get_sunroof_and_sunshade_position')) {
    return {
      action: 'refuse_or_defer',
      toolCalls: [],
      message: 'I cannot safely operate the sunroof because I cannot inspect the current sunroof and sunshade positions.',
      reliabilityNotes: ['Required observation tool is unavailable.'],
    };
  }

  if (!input.context.weatherChecked && hasTool(input.availableTools, 'get_weather')) {
    notes.push('Weather must be checked before opening the sunroof.');
    return {
      action: 'tool_calls',
      toolCalls: [{ name: 'get_weather', arguments: { reason: 'sunroof_policy_check' } }],
      message: 'I will check the weather first before opening the sunroof.',
      reliabilityNotes: notes,
    };
  }

  if (!input.context.weatherChecked && !hasTool(input.availableTools, 'get_weather')) {
    return {
      action: 'refuse_or_defer',
      toolCalls: [],
      message: 'I cannot safely open the sunroof because the required weather-check capability is unavailable.',
      reliabilityNotes: ['Weather policy cannot be satisfied without get_weather.'],
    };
  }

  if (isRainy(input.context.weatherCondition) && !input.context.userConfirmedWeatherRisk) {
    return {
      action: 'clarify',
      toolCalls: [],
      message: 'It appears rainy. Please confirm that you still want the sunroof opened despite the weather risk.',
      reliabilityNotes: ['Rain risk requires explicit confirmation before action.'],
    };
  }

  const requestedPercentage = extractPercentage(message);
  const targetPercentage = requestedPercentage ?? input.context.preferredSunroofPercentage;

  if (targetPercentage === undefined) {
    return {
      action: 'clarify',
      toolCalls: [],
      message: 'What percentage would you like the sunroof opened to?',
      reliabilityNotes: ['No percentage supplied and no internal preference available.'],
    };
  }

  if (!canCallSunroof(input.availableTools)) {
    return {
      action: 'refuse_or_defer',
      toolCalls: [],
      message: 'I cannot open the sunroof because the sunroof-control tool is unavailable.',
      reliabilityNotes: ['Required sunroof action tool is unavailable.'],
    };
  }

  if (needsSunshadeBeforeSunroof(input.context) && !canCallSunshade(input.availableTools)) {
    return {
      action: 'refuse_or_defer',
      toolCalls: [],
      message: 'I cannot safely open the sunroof because the sunshade must be fully opened first, but that tool is unavailable.',
      reliabilityNotes: ['Avoided hallucinating unsupported sunshade action.'],
    };
  }

  const toolCalls: CarBenchToolCall[] = [];
  if (needsSunshadeBeforeSunroof(input.context)) {
    toolCalls.push({ name: 'open_close_sunshade', arguments: { percentage: 100 } });
    notes.push('Sunshade is opened fully before sunroof to satisfy policy.');
  }

  toolCalls.push({ name: 'open_close_sunroof', arguments: { percentage: targetPercentage } });
  notes.push(`Sunroof target resolved to ${targetPercentage}%.`);

  return {
    action: 'tool_calls',
    toolCalls,
    message: `I can safely open the sunroof to ${targetPercentage}%.`,
    reliabilityNotes: notes,
  };
}
