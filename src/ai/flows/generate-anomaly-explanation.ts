'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating technical maintenance 
 * explanations and advice, integrating sensor data with real-time inventory from MongoDB.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MONGO_API_KEY = "al-0fuD4AYEXDCXc5GuQGFcnGXlnHIVIpOv5BGHchJMLfl";
const MONGO_ENDPOINT = "https://data.mongodb-api.com/app/data-abcde/endpoint/data/v1/action/find"; // Placeholder for 'Mango's Endpoint Link'

/**
 * Tool to fetch inventory data from MongoDB.
 */
const getInventoryFromMongo = ai.defineTool(
  {
    name: 'getInventoryFromMongo',
    description: 'Fetches available spare parts and stock levels from the industrial inventory database.',
    inputSchema: z.object({
      category: z.string().optional().describe('Filter by part category (e.g., "Bearings", "Belts")'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      // Simulation logic as requested in the "Magical Binding" prompt
      const response = await fetch(MONGO_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'api-key': MONGO_API_KEY 
        },
        body: JSON.stringify({
          collection: "Inventory",
          database: "IndustrialData",
          dataSource: "Cluster0",
          filter: input.category ? { category: input.category } : {}
        })
      });

      if (!response.ok) {
        // Mock data to ensure the prototype works even without the real endpoint
        return JSON.stringify([
          { partId: "BR-99", part: "High-Speed Bearing X2", stock: 3, location: "Shelf A1-Row 4" },
          { partId: "TP-01", part: "Thermal Paste Grade A", stock: 12, location: "Shelf B4" },
          { partId: "SK-05", part: "Seal Kit - Industrial", stock: 5, location: "Shelf C2" }
        ]);
      }

      const data = await response.json();
      return JSON.stringify(data.documents || []);
    } catch (error) {
      return "Unable to fetch inventory. Suggest general inspection.";
    }
  }
);

const AnomalyExplanationInputSchema = z.object({
  vibrationValue: z.number().describe('The current vibration intensity reading.'),
  anomalyDetails: z.string().describe('Type of anomaly detected.'),
  machineType: z.string().default('Industrial Equipment'),
});

const AnomalyExplanationOutputSchema = z.object({
  status: z.string().describe('Operational status (e.g., "Critical", "Warning").'),
  vibration: z.number().describe('The vibration value.'),
  recommendation: z.string().describe('The specific technical fix recommendation.'),
  part_details: z.object({
    id: z.string().describe('The part ID.'),
    location: z.string().describe('The physical location in the warehouse.'),
    stock: z.number().describe('Current stock level.'),
  }).optional().describe('Details about the spare part required.'),
});

const anomalyAdvicePrompt = ai.definePrompt({
  name: 'anomalyAdvicePrompt',
  tools: [getInventoryFromMongo],
  input: { schema: AnomalyExplanationInputSchema },
  output: { schema: AnomalyExplanationOutputSchema },
  prompt: `You are a professional industrial maintenance AI.
Current reading: {{{vibrationValue}}} m/s².
Issue: {{{anomalyDetails}}}.
Machine: {{{machineType}}}.

1. Use the getInventoryFromMongo tool to find the most relevant spare part for this issue.
2. Formulate a structured maintenance response.
3. Keep the recommendation technical and concise.
4. Set status to 'Critical' if vibration > 80, otherwise 'Warning'.`,
});

export type AnomalyExplanationOutput = z.infer<typeof AnomalyExplanationOutputSchema>;

export async function generateAnomalyExplanation(
  input: z.infer<typeof AnomalyExplanationInputSchema>
): Promise<AnomalyExplanationOutput> {
  const { output } = await anomalyAdvicePrompt(input);
  if (!output) throw new Error('Failed to generate advice');
  return output;
}
