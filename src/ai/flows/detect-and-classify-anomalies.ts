'use server';
/**
 * @fileOverview A Genkit flow for detecting and classifying anomalies in industrial sensor data.
 *
 * - detectAndClassifyAnomalies - A function that handles the anomaly detection and classification process.
 * - DetectAndClassifyAnomaliesInput - The input type for the detectAndClassifyAnomalies function.
 * - DetectAndClassifyAnomaliesOutput - The return type for the detectAndClassifyAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAndClassifyAnomaliesInputSchema = z.object({
  sensorId: z.string().describe('The unique identifier for the sensor.'),
  value: z.number().describe('The current reading from the sensor.'),
  timestamp: z.number().describe('The Unix timestamp of the sensor reading.'),
  machineId:
    z.string().optional().describe('Optional: The identifier of the machine associated with the sensor.'),
  historicalContext:
    z.array(z.object({value: z.number(), timestamp: z.number()}))
      .optional()
      .describe('Optional: Recent historical readings for context to detect trends or deviations.'),
  thresholds:
    z.object({
      min: z.number().optional().describe('Minimum acceptable value.'),
      max: z.number().optional().describe('Maximum acceptable value.'),
    })
      .optional()
      .describe('Optional: Configured thresholds for the sensor value.'),
});
export type DetectAndClassifyAnomaliesInput = z.infer<typeof DetectAndClassifyAnomaliesInputSchema>;

const DetectAndClassifyAnomaliesOutputSchema = z.object({
  isAnomaly: z.boolean().describe('True if an anomaly is detected, false otherwise.'),
  anomalyType:
    z.string()
      .optional()
      .describe(
        'The type of anomaly detected (e.g., "high vibration", "temperature spike", "pressure drop", "unusual pattern"). Only present if isAnomaly is true.'
      ),
  classification:
    z.string()
      .optional()
      .describe(
        'A classification of the potential equipment malfunction (e.g., "bearing wear", "overheating", "seal leak", "normal operation"). Only present if isAnomaly is true.'
      ),
  severity:
    z.enum(['low', 'medium', 'high', 'critical', 'none'])
      .describe(
        'The severity of the anomaly. "none" if no anomaly is detected.'
      ),
  recommendation:
    z.string()
      .optional()
      .describe(
        'A recommended action based on the anomaly (e.g., "inspect bearing", "check cooling system", "schedule maintenance within 24 hours"). Only present if isAnomaly is true.'
      ),
});
export type DetectAndClassifyAnomaliesOutput = z.infer<typeof DetectAndClassifyAnomaliesOutputSchema>;

export async function detectAndClassifyAnomalies(
  input: DetectAndClassifyAnomaliesInput
): Promise<DetectAndClassifyAnomaliesOutput> {
  return detectAndClassifyAnomaliesFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: {schema: DetectAndClassifyAnomaliesInputSchema},
  output: {schema: DetectAndClassifyAnomaliesOutputSchema},
  prompt: `You are an expert industrial maintenance technician and an AI anomaly detection system. Your task is to analyze real-time sensor data from industrial machinery.\n\nCurrent Sensor Reading:\n- Sensor ID: {{{sensorId}}}\n- Value: {{{value}}}\n- Timestamp: {{{timestamp}}}\n\n{{#if machineId}}\nMachine ID: {{{machineId}}}\n{{/if}}\n\n{{#if thresholds.min}}\nMinimum acceptable value: {{{thresholds.min}}}\n{{/if}}\n{{#if thresholds.max}}\nMaximum acceptable value: {{{thresholds.max}}}\n{{/if}}\n\n{{#if historicalContext}}\nHistorical Context (last few readings):\n{{#each historicalContext}}\n- Value: {{{value}}}, Timestamp: {{{timestamp}}}\n{{/each}}\n{{/if}}\n\nAnalyze the current sensor reading in the context of any provided historical data and configured thresholds.\nDetermine if the current reading represents an anomaly or an unusual pattern that might indicate an emerging issue with the machinery.\nIf an anomaly is detected:\n1. Set 'isAnomaly' to true.\n2. Identify the 'anomalyType' (e.g., "high vibration", "temperature spike", "pressure drop", "unusual pattern").\n3. Provide a 'classification' of the potential equipment malfunction (e.g., "bearing wear", "overheating", "seal leak").\n4. Assign a 'severity' (low, medium, high, critical) based on the deviation and potential impact.\n5. Offer a concise 'recommendation' for corrective action.\n\nIf no anomaly is detected:\n1. Set 'isAnomaly' to false.\n2. Set 'severity' to "none".\n3. Do not provide 'anomalyType', 'classification', or 'recommendation'.\n\nRemember to be precise and concise. Do not include any conversational text outside of the JSON output.`,
});

const detectAndClassifyAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAndClassifyAnomaliesFlow',
    inputSchema: DetectAndClassifyAnomaliesInputSchema,
    outputSchema: DetectAndClassifyAnomaliesOutputSchema,
  },
  async (input) => {
    const {output} = await anomalyDetectionPrompt(input);
    return output!;
  }
);
