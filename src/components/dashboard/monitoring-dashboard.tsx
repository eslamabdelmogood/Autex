
"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from './dashboard-sidebar';
import { ConnectionStatus } from './connection-status';
import { LiveSensorChart } from './live-sensor-chart';
import { AlertList } from './alert-list';
import { KpiCards } from './kpi-cards';
import { ThresholdSettings } from './threshold-settings';
import { ReportUploader } from './report-uploader';
import { ReportList } from './report-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Bell, Settings, Gauge, FileText } from 'lucide-react';
import { detectAndClassifyAnomalies, DetectAndClassifyAnomaliesOutput } from '@/ai/flows/detect-and-classify-anomalies';
import { generateAnomalyExplanation, AnomalyExplanationOutput } from '@/ai/flows/generate-anomaly-explanation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase';

export type SensorReading = {
  timestamp: number;
  value: number;
};

export type AnomalyAlert = DetectAndClassifyAnomaliesOutput & {
  id: string;
  timestamp: number;
  advice?: string;
  part_details?: {
    id: string;
    location: string;
    stock: number;
  };
};

const MAX_RETRIES = 3;
const EDGE_BUFFER_SIZE = 100;
const MIN_AI_INTERVAL = 60000; // One minute between each Gemini call

export function MonitoringDashboard() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [thresholds, setThresholds] = useState({ min: 20, max: 80 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inferenceCount, setInferenceCount] = useState(0);
  const [lastFaultType, setLastFaultType] = useState<string | null>(null);
  
  const retryCount = useRef(0);
  const isOfflineMode = useRef(false);
  const classifierRef = useRef<any>(null);
  const vibrationBuffer = useRef<number[]>([]);
  const lastAiCallTimestamp = useRef(0);
  
  const db = useFirestore();
  const { toast } = useToast();

  // Load Edge Impulse Model
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/edge-impulse-standalone.js';
    script.async = true;
    script.onload = async () => {
      try {
        if ((window as any).EdgeImpulseClassifier) {
          const classifier = new (window as any).EdgeImpulseClassifier();
          await classifier.init();
          classifierRef.current = classifier;
          console.log("✅ Edge Impulse Model Loaded!");
        }
      } catch (err) {
        console.error("❌ Failed to initialize Edge Impulse classifier:", err);
      }
    };
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const readingsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'readings'), orderBy('timestamp', 'desc'), limit(50));
  }, [db]);

  const { data: dbReadings, loading: readingsLoading } = useCollection(readingsQuery);

  const allReadings = useMemo(() => {
    return (dbReadings || [])
      .map(doc => ({
        timestamp: typeof doc.timestamp === 'number' ? doc.timestamp : Date.now(),
        value: doc.value
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [dbReadings]);

  const sendToOneM2M = useCallback(async (vibrationValue: number) => {
    if (isOfflineMode.current) return;
    const url = 'http://localhost:8080/~/mn-cse/mn-name/Vibration_Sensor';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'X-M2M-Origin': 'admin:admin',
          'Content-Type': 'application/json;ty=4',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          "m2m:cin": {
            "con": vibrationValue.toString(),
            "lbl": ["vibration-analysis"]
          }
        })
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        retryCount.current = 0;
      } else {
        throw new Error('Response not OK');
      }
    } catch (error) {
      retryCount.current++;
      if (retryCount.current >= MAX_RETRIES) {
        isOfflineMode.current = true;
        console.warn("🚀 System switching to 'Edge Survival Mode'. oneM2M background sync paused.");
      }
    }
  }, []);

  const handleNewReading = useCallback(async (value: number) => {
    const timestamp = Date.now();
    
    // 1. standard oneM2M sync
    sendToOneM2M(value);

    // 2. Cloud persistence
    if (db) {
      addDoc(collection(db, 'readings'), {
        sensorId: 'vibration-01',
        value,
        timestamp,
        machineId: 'CNC-MILL-01'
      });
    }

    // 3. Local Edge Inference with Buffering
    vibrationBuffer.current.push(value);
    
    if (vibrationBuffer.current.length >= EDGE_BUFFER_SIZE) {
      if (classifierRef.current) {
        try {
          const results = classifierRef.current.classify(vibrationBuffer.current);
          setInferenceCount(prev => prev + 1);
          console.log("Edge Inference Result:", results.classification);
          
          // If a fault is detected with high confidence (e.g., Bearing Wear > 0.8)
          if (results.classification && results.classification.bearing_wear > 0.8) {
            setLastFaultType("Bearing Wear");
            const now = Date.now();
            
            if (now - lastAiCallTimestamp.current > MIN_AI_INTERVAL) {
              console.log("🚀 Edge AI detected fault. Escalating to Gemini for maintenance plan...");
              setIsAnalyzing(true);
              lastAiCallTimestamp.current = now;

              const explanationResult = await generateAnomalyExplanation({
                vibrationValue: value,
                anomalyDetails: "Bearing Wear Detected by Edge AI",
                machineType: 'CNC Milling Machine'
              });

              const newAlert: AnomalyAlert = {
                isAnomaly: true,
                anomalyType: "Bearing Wear (Local AI)",
                classification: "Component Fatigue",
                severity: "high",
                recommendation: explanationResult.recommendation,
                id: crypto.randomUUID(),
                timestamp,
                advice: explanationResult.recommendation,
                part_details: explanationResult.part_details
              };

              setAlerts(prev => [newAlert, ...prev]);
              toast({
                variant: "destructive",
                title: "EDGE AI ALERT: Bearing Wear",
                description: explanationResult.recommendation,
              });
              setIsAnalyzing(false);
            } else {
              console.log("🛡️ Edge AI is handling monitoring. Cloud AI is on standby to save quota.");
              
              const localAlert: AnomalyAlert = {
                isAnomaly: true,
                anomalyType: "Bearing Wear (Local Edge AI)",
                classification: "Pending Technical Audit",
                severity: "high",
                recommendation: "Edge AI is handling monitoring. Cloud AI is on standby to save resources.",
                id: crypto.randomUUID(),
                timestamp,
                advice: "Machine exhibiting patterns of bearing fatigue. Cooldown active for Cloud diagnostics."
              };
              
              setAlerts(prev => [localAlert, ...prev]);
              toast({
                title: "Local Edge AI Detection",
                description: "Bearing Wear (High Confidence). Cloud AI is on standby.",
              });
            }
          }
        } catch (err) {
          console.error("Local inference failed:", err);
        }
      }
      // Reset buffer after inference or reaching limit
      vibrationBuffer.current = [];
    }

    // 4. Threshold Trigger Logic (Cloud AI Fallback/Verification)
    if (value > thresholds.max || value < thresholds.min) {
      const now = Date.now();
      if (now - lastAiCallTimestamp.current > MIN_AI_INTERVAL) {
        setIsAnalyzing(true);
        lastAiCallTimestamp.current = now;
        try {
          const detectionResult = await detectAndClassifyAnomalies({
            sensorId: 'vibration-01',
            value,
            timestamp,
            thresholds,
            historicalContext: allReadings.slice(-5)
          });

          if (detectionResult.isAnomaly) {
            const explanationResult: AnomalyExplanationOutput = await generateAnomalyExplanation({
              vibrationValue: value,
              anomalyDetails: detectionResult.anomalyType || 'Excessive Vibration',
              machineType: 'CNC Milling Machine'
            });

            const newAlert: AnomalyAlert = {
              ...detectionResult,
              id: crypto.randomUUID(),
              timestamp,
              advice: explanationResult.recommendation,
              part_details: explanationResult.part_details
            };

            setAlerts(prev => [newAlert, ...prev]);
            toast({
              variant: "destructive",
              title: `${explanationResult.status.toUpperCase()}: ${detectionResult.anomalyType}`,
              description: explanationResult.recommendation,
            });
          }
        } catch (error) {
          console.error("An error occurred during AI analysis:", error);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        console.log("🛡️ High vibration detected. Cooldown active for Cloud AI.");
      }
    }
  }, [allReadings, thresholds, db, toast, sendToOneM2M]);

  return (
    <SidebarProvider>
      <div className="flex w-full overflow-hidden">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
            <div className="flex items-center gap-2">
              <Activity className="text-accent h-6 w-6" />
              <h1 className="text-xl font-bold tracking-tight font-headline">Industrial Sentinel</h1>
            </div>
            <ConnectionStatus 
              isConnected={isConnected} 
              onToggleConnection={setIsConnected} 
              onNewReading={handleNewReading} 
            />
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            <KpiCards 
              readings={allReadings} 
              isAnalyzing={isAnalyzing || readingsLoading} 
              activeAlertsCount={alerts.filter(a => a.severity !== 'none').length}
              inferenceCount={inferenceCount}
            />

            <Tabs defaultValue="monitor" className="mt-8 space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                <TabsTrigger value="monitor" className="gap-2">
                  <Gauge className="h-4 w-4" /> Monitor
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <Bell className="h-4 w-4" /> Alerts
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <FileText className="h-4 w-4" /> Reports
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" /> Thresholds
                </TabsTrigger>
              </TabsList>

              <TabsContent value="monitor" className="space-y-6">
                <LiveSensorChart readings={allReadings} thresholds={thresholds} />
              </TabsContent>

              <TabsContent value="alerts">
                <AlertList alerts={alerts} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <ReportUploader />
                  </div>
                  <div className="lg:col-span-2">
                    <ReportList />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <ThresholdSettings thresholds={thresholds} onUpdate={setThresholds} />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
