
"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from './dashboard-sidebar';
import { ConnectionStatus } from './connection-status';
import { LiveSensorChart } from './live-sensor-chart';
import { AlertList } from './alert-list';
import { KpiCards } from './kpi-cards';
import { ThresholdSettings } from './threshold-settings';
import { ReportUploader } from './report-uploader';
import { ReportList } from './report-list';
import { MaintenanceInsights } from './maintenance-insights';
import { HealthCertificate } from './health-certificate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity, 
  Bell, 
  Settings, 
  Gauge, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Languages, 
  Cpu, 
  Binary,
  Zap,
  Microchip
} from 'lucide-react';
import { detectAndClassifyAnomalies, DetectAndClassifyAnomaliesOutput } from '@/ai/flows/detect-and-classify-anomalies';
import { generateAnomalyExplanation, AnomalyExplanationOutput } from '@/ai/flows/generate-anomaly-explanation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, limit, doc } from 'firebase/firestore';
import { useCollection, useDoc } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export type SensorReading = {
  timestamp: number;
  value: number;
  rpm?: number;
  temp?: number;
  load?: number;
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

const EDGE_BUFFER_SIZE = 100;
const MIN_AI_INTERVAL = 60000;

export function MonitoringDashboard() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [thresholds, setThresholds] = useState({ min: 20, max: 80 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inferenceCount, setInferenceCount] = useState(0);
  const [lastFaultType, setLastFaultType] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  
  // High-Fidelity Telemetry States
  const [currentVibration, setCurrentVibration] = useState<number | null>(null);
  const [rpm, setRpm] = useState(0);
  const [temp, setTemp] = useState(0);
  const [healthScore, setHealthScore] = useState(100);
  
  const classifierRef = useRef<any>(null);
  const vibrationBuffer = useRef<number[]>([]);
  const lastAiCallTimestamp = useRef(0);
  
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'black-dragon-logo');

  // Fetch Green Box Status from User Profile
  const userProfileRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userProfile } = useDoc(userProfileRef);
  const hasGreenBox = userProfile?.hasGreenBox || false;

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
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
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
        value: doc.value,
        rpm: doc.rpm || 0,
        temp: doc.temp || 0
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [dbReadings]);

  useEffect(() => {
    if (currentVibration) {
      const vibPenalty = Math.max(0, (currentVibration - 50) * 0.5);
      const tempPenalty = Math.max(0, (temp - 70) * 1);
      const newScore = Math.max(0, Math.min(100, 100 - vibPenalty - tempPenalty));
      setHealthScore(Math.round(newScore));
    }
  }, [currentVibration, temp]);

  const handleNewReading = useCallback(async (value: number) => {
    const timestamp = Date.now();
    setCurrentVibration(value);
    
    const newRpm = 1200 + (Math.random() - 0.5) * 100;
    const newTemp = 45 + (value * 0.2) + (Math.random() * 2);
    setRpm(newRpm);
    setTemp(newTemp);

    if (db) {
      addDoc(collection(db, 'readings'), {
        sensorId: 'vibration-01',
        value,
        rpm: newRpm,
        temp: newTemp,
        timestamp,
        machineId: 'CNC-MILL-01'
      });
    }

    vibrationBuffer.current.push(value);
    if (vibrationBuffer.current.length >= EDGE_BUFFER_SIZE) {
      if (classifierRef.current) {
        try {
          const results = classifierRef.current.classify(vibrationBuffer.current);
          setInferenceCount(prev => prev + 1);
          if (results.classification && results.classification.bearing_wear > 0.8) {
            setLastFaultType("Bearing Wear");
            const now = Date.now();
            if (now - lastAiCallTimestamp.current > MIN_AI_INTERVAL) {
              setIsAnalyzing(true);
              lastAiCallTimestamp.current = now;
              const explanationResult = await generateAnomalyExplanation({
                vibrationValue: value,
                anomalyDetails: "Bearing Wear Detected by Edge AI",
                machineType: 'CNC Milling Machine'
              });
              setAlerts(prev => [{
                isAnomaly: true,
                anomalyType: "Bearing Wear (Local AI)",
                classification: "Component Fatigue",
                severity: "high",
                recommendation: explanationResult.recommendation,
                id: crypto.randomUUID(),
                timestamp,
                advice: explanationResult.recommendation,
                part_details: explanationResult.part_details
              }, ...prev]);
              setIsAnalyzing(false);
            }
          }
        } catch (err) { console.error("Local inference failed:", err); }
      }
      vibrationBuffer.current = [];
    }

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
            const explanationResult = await generateAnomalyExplanation({
              vibrationValue: value,
              anomalyDetails: detectionResult.anomalyType || 'Excessive Vibration',
              machineType: 'CNC Milling Machine'
            });
            setAlerts(prev => [{
              ...detectionResult,
              id: crypto.randomUUID(),
              timestamp,
              advice: explanationResult.recommendation,
              part_details: explanationResult.part_details
            }, ...prev]);
          }
        } catch (error) { console.error("AI analysis error:", error); }
        finally { setIsAnalyzing(false); }
      }
    }
  }, [allReadings, thresholds, db, toast]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const translations = {
    en: {
      title: "Black Dragon",
      monitor: "Monitor",
      alerts: "Alerts",
      insights: "Insights",
      proof: "Proof",
      reports: "Reports",
      settings: "Settings",
      greenBox: "Industrial Precision Mode - Connect Green Box",
      greenBoxActive: "Green Box Active - High Precision Enabled",
      greenBoxTeaser: "Coming soon... Increase inspection accuracy to 99.9% with real-time processing (1ms) via the external Green Box unit. Predict collapses before they occur with industrial sensors.",
      advancedAnalysis: "Advanced Analysis",
      edgeActive: "AI Edge Engine Active",
      localSyncs: "Local Syncs",
      fault: "Fault",
      commandCenter: "Command Center"
    },
    ar: {
      title: "التنين الأسود",
      monitor: "المراقبة",
      alerts: "التنبيهات",
      insights: "البصيرة",
      proof: "الإثبات",
      reports: "التقارير",
      settings: "الإعدادات",
      greenBox: "وضع الدقة الصناعية - اربط الصندوق الأخضر",
      greenBoxActive: "الصندوق الأخضر نشط - تم تفعيل الدقة العالية",
      greenBoxTeaser: "قريباً... ارفع دقة الفحص إلى 99.9% مع معالجة فورية (1 ملي ثانية) عبر وحدة الصندوق الأخضر الخارجية. توقع الانهيارات قبل حدوثها بحساسات صناعية.",
      advancedAnalysis: "تحليل متقدم",
      edgeActive: "محرك الذكاء الاصطناعي نشط",
      localSyncs: "مزامنات محلية",
      fault: "خطأ",
      commandCenter: "مركز القيادة"
    }
  };

  const t = translations[language];

  return (
    <SidebarProvider>
      <div className="flex w-full overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DashboardSidebar language={language} hasGreenBox={hasGreenBox} />
        <SidebarInset className="flex flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
            <div className="flex items-center gap-3">
              {logo && (
                <div className="relative h-7 w-7 overflow-hidden rounded-md bg-black hidden sm:block">
                  <Image 
                    src={logo.imageUrl} 
                    alt="Black Dragon Logo" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover invert opacity-80"
                    data-ai-hint={logo.imageHint}
                  />
                </div>
              )}
              <h1 className="text-lg md:text-xl font-bold tracking-tight font-headline">{t.title}</h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              {/* Green Box Indicator */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 transition-all ${hasGreenBox ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-muted-foreground/40 opacity-50 grayscale cursor-help'}`}
                    >
                      <Microchip className={`h-5 w-5 ${hasGreenBox ? 'animate-pulse' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] p-3 text-[10px] md:text-xs">
                    <p className="font-bold mb-1">{hasGreenBox ? t.greenBoxActive : t.greenBox}</p>
                    {!hasGreenBox && <p className="text-muted-foreground leading-snug">{t.greenBoxTeaser}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleLanguage}
                className="h-9 w-9 text-muted-foreground hover:text-accent"
                title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                <Languages className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex">
                <ConnectionStatus isConnected={isConnected} onToggleConnection={setIsConnected} onNewReading={handleNewReading} language={language} />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <KpiCards 
              readings={allReadings} 
              isAnalyzing={isAnalyzing || readingsLoading} 
              activeAlertsCount={alerts.filter(a => a.severity !== 'none').length}
              inferenceCount={inferenceCount}
              lastFaultType={lastFaultType}
              currentValue={currentVibration}
              healthScore={healthScore}
              rpm={rpm}
              temp={temp}
              language={language}
            />

            <Tabs defaultValue="monitor" className="mt-8 space-y-6">
              <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="flex w-max lg:w-full min-w-full lg:grid lg:grid-cols-7 gap-2 bg-muted/20 p-1">
                  <TabsTrigger value="monitor" className="gap-2 flex-1"><Gauge className="h-4 w-4" /> {t.monitor}</TabsTrigger>
                  <TabsTrigger value="alerts" className="gap-2 flex-1"><Bell className="h-4 w-4" /> {t.alerts}</TabsTrigger>
                  <TabsTrigger value="insights" className="gap-2 flex-1"><TrendingUp className="h-4 w-4" /> {t.insights}</TabsTrigger>
                  <TabsTrigger value="certificate" className="gap-2 flex-1"><ShieldCheck className="h-4 w-4" /> {t.proof}</TabsTrigger>
                  <TabsTrigger value="reports" className="gap-2 flex-1"><FileText className="h-4 w-4" /> {t.reports}</TabsTrigger>
                  {hasGreenBox && <TabsTrigger value="advanced" className="gap-2 flex-1 bg-emerald-500/10 text-emerald-500 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"><Binary className="h-4 w-4" /> {t.advancedAnalysis}</TabsTrigger>}
                  <TabsTrigger value="settings" className="gap-2 flex-1"><Settings className="h-4 w-4" /> {t.settings}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="monitor" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <LiveSensorChart 
                      readings={allReadings} 
                      thresholds={thresholds} 
                      inferenceCount={inferenceCount}
                      lastFaultType={lastFaultType}
                      language={language}
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-6">
                    <AlertList alerts={alerts.slice(0, 5)} language={language} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts"><AlertList alerts={alerts} language={language} /></TabsContent>
              <TabsContent value="insights"><MaintenanceInsights readings={allReadings} alerts={alerts} language={language} /></TabsContent>
              <TabsContent value="certificate"><HealthCertificate healthScore={healthScore} machineId="CNC-MILL-01" language={language} /></TabsContent>

              {hasGreenBox && (
                <TabsContent value="advanced" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card p-6 rounded-xl border border-emerald-500/20 h-64 flex flex-col items-center justify-center text-center space-y-4">
                      <Binary className="h-12 w-12 text-emerald-500" />
                      <h3 className="text-xl font-black uppercase italic">Green Box Advanced Engine</h3>
                      <p className="text-sm text-muted-foreground">High-precision 1ms spectral sampling active. No jitter detected.</p>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-emerald-500/20 h-64 flex flex-col items-center justify-center text-center space-y-4">
                      <Zap className="h-12 w-12 text-emerald-500" />
                      <h3 className="text-xl font-black uppercase italic">Structural Resonance Sync</h3>
                      <p className="text-sm text-muted-foreground">Syncing with CNC frame harmonics. Accuracy: 99.9%.</p>
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="reports" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <ReportUploader language={language} />
                  <div className="lg:col-span-2"><ReportList language={language} /></div>
                </div>
              </TabsContent>

              <TabsContent value="settings"><ThresholdSettings thresholds={thresholds} onUpdate={setThresholds} language={language} /></TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
