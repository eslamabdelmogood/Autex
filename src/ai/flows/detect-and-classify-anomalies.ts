'use server';
/**
 * @fileOverview A Genkit flow for detecting and classifying anomalies in automotive engine data.
 *
 * - detectAndClassifyAnomalies - A function that handles the anomaly detection process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAndClassifyAnomaliesInputSchema = z.object({
  sensorId: z.string().describe('The unique identifier for the vehicle sensor.'),
  value: z.number().describe('The current reading from the sensor.'),
  timestamp: z.number().describe('The Unix timestamp of the sensor reading.'),
  machineId:
    z.string().optional().describe('Optional: The VIN or Vehicle ID.'),
  historicalContext:
    z.array(z.object({value: z.number(), timestamp: z.number()}))
      .optional()
      .describe('Optional: Recent historical readings for context to detect trends.'),
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
  isAnomaly: z.boolean().describe('True if an anomaly is detected.'),
  anomalyType:
    z.string()
      .optional()
      .describe(
        'The type of anomaly (e.g., "misfire", "overheating", "fuel trim drift").'
      ),
  classification:
    z.string()
      .optional()
      .describe(
        'A classification of the potential mechanical issue (e.g., "spark plug failure", "coolant leak").'
      ),
  severity:
    z.enum(['low', 'medium', 'high', 'critical', 'none'])
      .describe(
        'The severity of the issue.'
      ),
  recommendation:
    z.string()
      .optional()
      .describe(
        'A recommended action (e.g., "Stop vehicle immediately", "Service required soon").'
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
  prompt: `You are an expert automotive diagnostic technician AI. Your task is to analyze real-time engine sensor data.\n\nCurrent Sensor Reading:\n- Sensor: {{{sensorId}}}\n- Value: {{{value}}}\n- Timestamp: {{{timestamp}}}\n\n{{#if machineId}}\nVehicle VIN: {{{machineId}}}\n{{/if}}\n\nAnalyze if the reading represents a vehicle malfunction or an unusual pattern.\nIf an anomaly is detected:\n1. Set 'isAnomaly' to true.\n2. Identify 'anomalyType' (e.g., "Ignition Misfire", "Lean Fuel Mix", "Coolant Over-temp").\n3. Provide a 'classification' (e.g., "Worn Spark Plugs", "Oxygen Sensor Failure").\n4. Assign a 'severity' (low to critical).\n5. Offer a concise 'recommendation'.\n\nIf normal, set isAnomaly to false and severity to "none".`,
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
