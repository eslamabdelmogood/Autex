
"use client";

import React, { useState, useCallback, useMemo, useRef } from 'react';
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

export function MonitoringDashboard() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [thresholds, setThresholds] = useState({ min: 20, max: 80 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const retryCount = useRef(0);
  const isOfflineMode = useRef(false);
  
  const db = useFirestore();
  const { toast } = useToast();

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
      }
    }
  }, []);

  const handleNewReading = useCallback(async (value: number) => {
    const timestamp = Date.now();
    sendToOneM2M(value);
    if (db) {
      addDoc(collection(db, 'readings'), {
        sensorId: 'vibration-01',
        value,
        timestamp,
        machineId: 'CNC-MILL-01'
      });
    }

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
