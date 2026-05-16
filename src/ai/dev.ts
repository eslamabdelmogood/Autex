import { config } from 'dotenv';
config();

import '@/ai/flows/generate-anomaly-explanation.ts';
import '@/ai/flows/detect-and-classify-anomalies.ts';
import '@/ai/flows/diagnostic-chat-flow.ts';
