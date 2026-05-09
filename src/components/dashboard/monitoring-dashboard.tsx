"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [thresholds, setThresholds] = useState({ min: 20, max: 80 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleNewReading = useCallback(async (value: number) => {
    const timestamp = Date.now();
    const newReading = { timestamp, value };
    
    setReadings(prev => [...prev.slice(-49), newReading]);

    // Simple heuristic or threshold check to trigger AI analysis
    if (value > thresholds.max || value < thresholds.min) {
      setIsAnalyzing(true);
      try {
        const detectionResult = await detectAndClassifyAnomalies({
          sensorId: 'vibration-01',
          value,
          timestamp,
          thresholds,
          historicalContext: readings.slice(-5)
        });

        if (detectionResult.isAnomaly) {
          const explanation = await generateAnomalyExplanation({
            anomalyDetails: detectionResult.anomalyType || 'Unknown pattern',
            currentSensorReadings: { vibration: value },
            machineType: 'CNC Milling Machine',
            operationalContext: 'High-speed finishing pass',
            historicalDataSummary: `Last 5 readings: ${readings.slice(-5).map(r => r.value).join(', ')}`
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
            title: `Anomaly Detected: ${detectionResult.anomalyType}`,
            description: `Severity: ${detectionResult.severity.toUpperCase()}. ${explanation.recommendedImmediateAction}`,
          });
        }
      } catch (error) {
        console.error("AI Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [readings, thresholds, toast]);

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
            <KpiCards readings={readings} isAnalyzing={isAnalyzing} activeAlertsCount={alerts.filter(a => a.severity !== 'none').length} />

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
                <LiveSensorChart readings={readings} thresholds={thresholds} />
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
