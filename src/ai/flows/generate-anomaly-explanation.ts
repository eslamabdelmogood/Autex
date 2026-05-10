'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating technical maintenance 
 * explanations and advice, integrating sensor data with inventory context.
 *
 * - generateAnomalyExplanation - A function that handles the anomaly explanation process.
 * - AnomalyExplanationInput - The input type for the generateAnomalyExplanation function.
 * - AnomalyExplanationOutput - The return type for the generateAnomalyExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnomalyExplanationInputSchema = z.object({
  anomalyDetails: z
    .string()
    .describe('A brief, human-readable description of the anomaly detected.'),
  currentSensorReadings: z
    .record(z.any())
    .describe('An object containing current sensor readings relevant to the anomaly.'),
  machineType: z
    .string()
    .describe('The type or name of the machine where the anomaly was detected.'),
  operationalContext: z
    .string()
    .describe('A brief description of the machine\'s current operational state.'),
  inventoryData: z
    .string()
    .optional()
    .describe('Contextual information about spare parts availability (e.g., Stock from inventory).'),
  historicalDataSummary: z
    .string()
    .optional()
    .describe('An optional summary of recent historical data relevant to the anomaly.'),
});
export type AnomalyExplanationInput = z.infer<typeof AnomalyExplanationInputSchema>;

const AnomalyExplanationOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      'A concise, human-readable explanation of the detected unusual pattern.'
    ),
  potentialRootCauses: z
    .array(z.string())
    .describe('A list of potential root causes for the anomaly.'),
  likelyImpact: z
    .string()
    .describe(
      'Describes the likely impact of this anomaly on machine operation.'
    ),
  recommendedImmediateAction: z
    .string()
    .describe('Suggests immediate actions, including parts to check or replace based on inventory.'),
});
export type AnomalyExplanationOutput = z.infer<typeof AnomalyExplanationOutputSchema>;

export async function generateAnomalyExplanation(
  input: AnomalyExplanationInput
): Promise<AnomalyExplanationOutput> {
  return anomalyExplanationFlow(input);
}

const anomalyExplanationPrompt = ai.definePrompt({
  name: 'anomalyExplanationPrompt',
  input: {schema: AnomalyExplanationInputSchema},
  output: {schema: AnomalyExplanationOutputSchema},
  prompt: `You are an expert industrial maintenance technician and diagnostic AI. 

Analyze the following machine data and provide a clear explanation and maintenance strategy.

MACHINE INFO:
- Type: {{{machineType}}}
- Operational Context: {{{operationalContext}}}
- Anomaly Detected: {{{anomalyDetails}}}
- Current Readings: {{{json currentSensorReadings}}}

{{#if inventoryData}}
INVENTORY CONTEXT:
{{{inventoryData}}}
{{/if}}

{{#if historicalDataSummary}}
HISTORY: 
{{{historicalDataSummary}}}
{{/if}}

Please generate a technical breakdown. If inventory data is provided, incorporate it into your 'recommendedImmediateAction' (e.g., "Replace part X, which is available at Location Y").`,
});

const anomalyExplanationFlow = ai.defineFlow(
  {
    name: 'anomalyExplanationFlow',
    inputSchema: AnomalyExplanationInputSchema,
    outputSchema: AnomalyExplanationOutputSchema,
  },
  async input => {
    const {output} = await anomalyExplanationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate anomaly explanation.');
    }
    return output;
  }
);
