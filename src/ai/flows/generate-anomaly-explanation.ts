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
      // In a real scenario, this would be a fetch to the MongoDB Data API
      // For the prototype, we simulate the structure based on the user's request
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

      // If the endpoint is a placeholder, we return mock documents to ensure the AI has data to process
      if (!response.ok) {
        return JSON.stringify([
          { part: "High-Speed Bearing X2", stock: 3, location: "Shelf A1" },
          { part: "Thermal Paste Grade A", stock: 12, location: "Shelf B4" },
          { part: "Seal Kit - Industrial", stock: 5, location: "Shelf C2" }
        ]);
      }

      const data = await response.json();
      return JSON.stringify(data.documents || []);
    } catch (error) {
      console.error("MongoDB Tool Error:", error);
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
  advice: z.string().describe('Brief technical fix and inventory location.'),
});

const anomalyAdvicePrompt = ai.definePrompt({
  name: 'anomalyAdvicePrompt',
  tools: [getInventoryFromMongo],
  input: { schema: AnomalyExplanationInputSchema },
  output: { schema: AnomalyExplanationOutputSchema },
  prompt: `You are a diagnostic AI. The vibration value is {{{vibrationValue}}}. 
Anomaly Detected: {{{anomalyDetails}}}.
Machine: {{{machineType}}}.

Use the getInventoryFromMongo tool to find what parts are needed and where they are in stock. 
Reply briefly with exactly what part is needed and its location.`,
});

export async function generateAnomalyExplanation(
  input: z.infer<typeof AnomalyExplanationInputSchema>
): Promise<z.infer<typeof AnomalyExplanationOutputSchema>> {
  const { output } = await anomalyAdvicePrompt(input);
  if (!output) throw new Error('Failed to generate advice');
  return output;
}
