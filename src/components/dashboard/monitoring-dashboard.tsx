
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from './dashboard-sidebar';
import { ConnectionStatus } from './connection-status';
import { LiveSensorChart } from './live-sensor-chart';
import { AlertList } from './alert-list';
import { KpiCards } from './kpi-cards';
import { ThresholdSettings } from './threshold-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Bell, Settings, Gauge } from 'lucide-react';
import { detectAndClassifyAnomalies, DetectAndClassifyAnomaliesOutput } from '@/ai/flows/detect-and-classify-anomalies';
import { generateAnomalyExplanation, AnomalyExplanationOutput } from '@/ai/flows/generate-anomaly-explanation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, query, orderBy, limit } from 'firebase/firestore';

export type SensorReading = {
  timestamp: number;
  value: number;
};

export type AnomalyAlert = DetectAndClassifyAnomaliesOutput & {
  id: string;
  timestamp: number;
  explanation?: AnomalyExplanationOutput;
};

export function MonitoringDashboard() {
  const [localReadings, setLocalReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [thresholds, setThresholds] = useState({ min: 20, max: 80 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const db = useFirestore();
  const { toast } = useToast();

  // Fetch recent historical readings from Firebase
  const readingsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'readings'), orderBy('timestamp', 'desc'), limit(50));
  }, [db]);

  const { data: dbReadings, loading: readingsLoading } = useCollection(readingsQuery);

  // Merge DB readings with local state for the chart
  const allReadings = useMemo(() => {
    const historical = (dbReadings || []).map(doc => ({
      timestamp: doc.timestamp,
      value: doc.value
    })).sort((a, b) => a.timestamp - b.timestamp);
    
    return historical;
  }, [dbReadings]);

  const handleNewReading = useCallback(async (value: number) => {
    const timestamp = Date.now();
    const readingData = {
      sensorId: 'vibration-01',
      value,
      timestamp,
      machineId: 'CNC-MILL-01'
    };

    // 1. Persist to Firebase
    if (db) {
      addDoc(collection(db, 'readings'), readingData);
    }

    // 2. Anomaly Detection
    if (value > thresholds.max || value < thresholds.min) {
      setIsAnalyzing(true);
      try {
        const detectionResult = await detectAndClassifyAnomalies({
          sensorId: 'vibration-01',
          value,
          timestamp,
          thresholds,
          historicalContext: allReadings.slice(-5)
        });

        if (detectionResult.isAnomaly) {
          const explanation = await generateAnomalyExplanation({
            anomalyDetails: detectionResult.anomalyType || 'Unknown pattern',
            currentSensorReadings: { vibration: value },
            machineType: 'CNC Milling Machine',
            operationalContext: 'High-speed finishing pass',
            historicalDataSummary: `Recent variance detected: ${allReadings.slice(-5).map(r => r.value.toFixed(1)).join(', ')}`
          });

          const newAlert: AnomalyAlert = {
            ...detectionResult,
            id: crypto.randomUUID(),
            timestamp,
            explanation
          };

          setAlerts(prev => [newAlert, ...prev]);
          
          toast({
            variant: "destructive",
            title: `CRITICAL: ${detectionResult.anomalyType}`,
            description: explanation.recommendedImmediateAction,
          });
        }
      } catch (error) {
        console.error("AI Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [allReadings, thresholds, db, toast]);

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
            />

            <Tabs defaultValue="monitor" className="mt-8 space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="monitor" className="gap-2">
                  <Gauge className="h-4 w-4" /> Monitor
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <Bell className="h-4 w-4" /> Alerts
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
