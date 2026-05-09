'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating clear, human-readable explanations
 * of detected machine anomalies, including potential root causes, likely impact,
 * and recommended immediate actions for maintenance technicians.
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
    .describe('A brief description of the machine\u0027s current operational state or activity.'),
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
      'Describes the likely impact of this anomaly on machine operation and overall production.'
    ),
  recommendedImmediateAction: z
    .string()
    .describe('Suggests immediate actions the technician should consider.'),
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
  prompt: `You are an expert industrial maintenance technician and diagnostic AI. Your task is to analyze machine anomaly data and provide a clear, human-readable explanation for maintenance technicians.

Based on the following information, generate an explanation of the detected unusual pattern, including its potential root causes, likely impact on machine operation, and recommended immediate actions.

Machine Type: {{{machineType}}}
Operational Context: {{{operationalContext}}}
Anomaly Details: {{{anomalyDetails}}}
Current Sensor Readings: {{{json currentSensorReadings}}}
{{#if historicalDataSummary}}Historical Data Summary: {{{historicalDataSummary}}}{{/if}}

Please provide your response in the following JSON format as described by the output schema.`,
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
