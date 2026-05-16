
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
import { DiagnosticChat } from './diagnostic-chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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
  Terminal,
  BrainCircuit,
  Database,
  Loader2
} from 'lucide-react';
import { detectAndClassifyAnomalies, DetectAndClassifyAnomaliesOutput } from '@/ai/flows/detect-and-classify-anomalies';
import { generateAnomalyExplanation, AnomalyExplanationOutput } from '@/ai/flows/generate-anomaly-explanation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, limit, doc } from 'firebase/firestore';
import { useCollection, useDoc } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { VoiceBriefingButton } from './voice-briefing-button';

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
  trace?: any;
  part_details?: {
    id: string;
    location: string;
    stock: number;
  };
};

type AiLogEntry = {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'brain' | 'hardware' | 'error';
};

function TypedLogEntry({ log }: { log: AiLogEntry }) {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < log.message.length) {
        setDisplayedMessage((prev) => prev + log.message.charAt(index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, Math.floor(Math.random() * 30) + 10); // Random speed between 10-40ms

    return () => clearInterval(interval);
  }, [log.message]);

  const colorClass = log.type === 'error' ? 'text-destructive' :
                    log.type === 'brain' ? 'text-yellow-400' :
                    log.type === 'hardware' ? 'text-emerald-500' :
                    'text-muted-foreground';

  return (
    <div className="flex gap-2 leading-tight mb-1">
      <span className="text-muted-foreground shrink-0 opacity-50">
        [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
      </span>
      <span className={`${colorClass} font-mono`}>
        {log.type === 'brain' && <BrainCircuit className="inline h-2.5 w-2.5 mr-1" />}
        {log.type === 'hardware' && <Zap className="inline h-2.5 w-2.5 mr-1" />}
        {displayedMessage}
        {isTyping && <span className="animate-pulse ml-0.5 border-l-2 border-current">&nbsp;</span>}
      </span>
    </div>
  );
}

const EDGE_BUFFER_SIZE = 100;
const MIN_AI_INTERVAL = 30000;

export function MonitoringDashboard() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [aiLogs, setAiLogs] = useState<AiLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [thresholds, setThresholds] = useState({ min: 20, max: 80 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inferenceCount, setInferenceCount] = useState(0);
  const [lastFaultType, setLastFaultType] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  
  const [currentVibration, setCurrentVibration] = useState<number | null>(null);
  const [rpm, setRpm] = useState(0);
  const [temp, setTemp] = useState(0);
  const [healthScore, setHealthScore] = useState(100);
  
  const classifierRef = useRef<any>(null);
  const vibrationBuffer = useRef<number[]>([]);
  const lastAiCallTimestamp = useRef(0);
  const logScrollRef = useRef<HTMLDivElement>(null);
  
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'autex-logo');

  const addAiLog = useCallback((message: string, type: AiLogEntry['type'] = 'info') => {
    setAiLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message,
      type
    }, ...prev].slice(0, 50));
  }, []);

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
          addAiLog("Edge AI Engine (Local) initialized and standing by.", 'hardware');
        }
      } catch (err) {
        console.error("Failed to load edge model:", err);
      }
    };
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [addAiLog]);

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
      const tempPenalty = Math.max(0, (temp - 95) * 1.5);
      const newScore = Math.max(0, Math.min(100, 100 - vibPenalty - tempPenalty));
      setHealthScore(Math.round(newScore));
    }
  }, [currentVibration, temp]);

  const handleNewReading = useCallback(async (value: number) => {
    const timestamp = Date.now();
    setCurrentVibration(value);
    
    const newRpm = 1200 + (Math.random() - 0.5) * 100;
    const newTemp = 85 + (value * 0.1) + (Math.random() * 2);
    setRpm(newRpm);
    setTemp(newTemp);

    if (db) {
      addDoc(collection(db, 'readings'), {
        sensorId: 'OBD-VIB-01',
        value,
        rpm: newRpm,
        temp: newTemp,
        timestamp,
        machineId: 'VIN-AUTEX-001'
      });
    }

    vibrationBuffer.current.push(value);
    if (vibrationBuffer.current.length >= EDGE_BUFFER_SIZE) {
      if (classifierRef.current) {
        try {
          addAiLog("Running Edge AI classification on sensor buffer...", 'hardware');
          const results = classifierRef.current.classify(vibrationBuffer.current);
          setInferenceCount(prev => prev + 1);
          
          if (results.classification && results.classification.misfire > 0.8) {
            addAiLog("Edge AI DETECTED: Engine Misfire (High Confidence)", 'error');
            setLastFaultType("Engine Misfire");
            const now = Date.now();
            if (now - lastAiCallTimestamp.current > MIN_AI_INTERVAL) {
              setIsAnalyzing(true);
              lastAiCallTimestamp.current = now;
              addAiLog("Cloud AI Strategist: Reasoning through misfire event...", 'brain');
              const explanationResult = await generateAnomalyExplanation({
                vibrationValue: value,
                anomalyDetails: "Engine Misfire detected by Edge Engine",
                machineType: 'V8 Performance Engine'
              });
              addAiLog(`AI Recommendation: ${explanationResult.recommendation.substring(0, 40)}...`, 'brain');
              setAlerts(prev => [{
                isAnomaly: true,
                anomalyType: "Misfire (Edge AI)",
                classification: "Ignition Malfunction",
                severity: "high",
                recommendation: explanationResult.recommendation,
                id: crypto.randomUUID(),
                timestamp,
                advice: explanationResult.recommendation,
                part_details: explanationResult.part_details,
                trace: { results, explanationResult }
              }, ...prev]);
              setIsAnalyzing(false);
            }
          } else {
            addAiLog("Edge AI Result: Pattern Nominal.", 'hardware');
          }
        } catch (err) {
          addAiLog("Edge AI Error: Classification failed.", 'error');
        }
      }
      vibrationBuffer.current = [];
    }

    if (value > thresholds.max || value < thresholds.min) {
      const now = Date.now();
      if (now - lastAiCallTimestamp.current > MIN_AI_INTERVAL) {
        setIsAnalyzing(true);
        lastAiCallTimestamp.current = now;
        addAiLog(`Sensor Alert: Value ${value.toFixed(1)} outside thresholds. Invoking Reasoning Agent...`, 'brain');
        try {
          const detectionResult = await detectAndClassifyAnomalies({
            sensorId: 'OBD-RPM-01',
            value,
            timestamp,
            thresholds,
            historicalContext: allReadings.slice(-5)
          });
          if (detectionResult.isAnomaly) {
            addAiLog(`Anomaly Classified: ${detectionResult.anomalyType}. Severity: ${detectionResult.severity}`, 'brain');
            const explanationResult = await generateAnomalyExplanation({
              vibrationValue: value,
              anomalyDetails: detectionResult.anomalyType || 'Engine Instability',
              machineType: 'Vehicle Engine'
            });
            addAiLog("Consulting Inventory Tool for corrective parts...", 'brain');
            setAlerts(prev => [{
              ...detectionResult,
              id: crypto.randomUUID(),
              timestamp,
              advice: explanationResult.recommendation,
              part_details: explanationResult.part_details,
              trace: { detectionResult, explanationResult }
            }, ...prev]);
          }
        } catch (error) {
          addAiLog("Cloud AI Error: Reasoning flow failed.", 'error');
        }
        finally { setIsAnalyzing(false); }
      }
    }
  }, [allReadings, thresholds, db, addAiLog]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const translations = {
    en: {
      title: "Autex Automotive",
      monitor: "Engine Monitor",
      alerts: "Diagnostic Alerts",
      insights: "Vehicle Insights",
      proof: "Condition Proof",
      reports: "Service Logs",
      settings: "OBD Config",
      greenBox: "Precision Mode - Connect Green Box",
      greenBoxActive: "Green Box Active - High-Res Telemetry",
      greenBoxTeaser: "Coming soon... Increase diagnostic accuracy to 99.9% with 1ms real-time processing via the Green Box OBD-II bridge.",
      advancedAnalysis: "Adv. Telemetry",
      edgeActive: "Vehicle Edge AI Active",
      localSyncs: "Edge Inferences",
      fault: "Fault",
      commandCenter: "Vehicle Command Center",
      briefing: "Listen to Briefing",
      briefing_text: `Vehicle Health Briefing. Your current health score is ${healthScore} percent. The engine is running at ${Math.round(rpm)} RPM with a temperature of ${Math.round(temp)} degrees Celsius. There are ${alerts.length} active alerts in the system.`,
      ai_log: "AI Agent Activity Log"
    },
    ar: {
      title: "أوتيكس للسيارات",
      monitor: "مراقب المحرك",
      alerts: "تنبيهات التشخيص",
      insights: "بصيرة المركبة",
      proof: "إثبات الحالة",
      reports: "سجلات الخدمة",
      settings: "إعدادات OBD",
      greenBox: "وضع الدقة - اربط الصندوق الأخضر",
      greenBoxActive: "الصندوق الأخضر نشط - تفعيل القياس العالي",
      greenBoxTeaser: "قريباً... ارفع دقة التشخيص إلى 99.9% مع معالجة 1 ملي ثانية عبر جسر الصندوق الأخضر.",
      advancedAnalysis: "قياس متقدم",
      edgeActive: "الذكاء الاصطناعي للمركبة نشط",
      localSyncs: "استدلالات الحافة",
      fault: "خلل",
      commandCenter: "مركز قيادة المركبة",
      briefing: "استمع للملخص",
      briefing_text: `ملخص صحة المركبة. درجة الصحة الحالية هي ${healthScore} بالمائة. يعمل المحرك بسرعة ${Math.round(rpm)} دورة في الدقيقة مع درجة حرارة ${Math.round(temp)} درجة مئوية. يوجد ${alerts.length} تنبيهات نشطة في النظام.`,
      ai_log: "سجل نشاط وكيل الذكاء الاصطناعي"
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
                    alt="Autex Logo" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover invert opacity-80"
                    data-ai-hint="automotive logo"
                  />
                </div>
              )}
              <h1 className="text-lg md:text-xl font-bold tracking-tight">{t.title}</h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <VoiceBriefingButton 
                text={t.briefing_text} 
                language={language} 
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2 border-accent/20 hover:bg-accent/10 text-accent h-8"
                showLabel
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 transition-all ${hasGreenBox ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-muted-foreground/40 opacity-50 grayscale'}`}
                    >
                      <Cpu className={`h-5 w-5 ${hasGreenBox ? 'animate-pulse' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] p-3 text-[10px] md:text-xs">
                    <p className="font-bold mb-1">{hasGreenBox ? t.greenBoxActive : t.greenBox}</p>
                    {!hasGreenBox && <p className="text-muted-foreground leading-snug">{t.greenBoxTeaser}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" size="icon" onClick={toggleLanguage} className="h-9 w-9 text-muted-foreground hover:text-accent">
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
                  <div className="lg:col-span-2 space-y-6">
                    <LiveSensorChart readings={allReadings} thresholds={thresholds} inferenceCount={inferenceCount} lastFaultType={lastFaultType} language={language} />
                    
                    {/* AI Activity Log Panel */}
                    <Card className="border-border bg-black/40 font-mono text-[10px] md:text-xs">
                      <CardHeader className="py-2 px-4 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-3 w-3 text-accent" />
                          <span className="font-bold uppercase tracking-widest text-muted-foreground">{t.ai_log}</span>
                        </div>
                        {isAnalyzing && (
                          <div className="flex items-center gap-2">
                            <BrainCircuit className="h-3 w-3 text-yellow-400 animate-pulse" />
                            <span className="text-[9px] text-yellow-400 animate-pulse">REASONING...</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-40 p-3" ref={logScrollRef}>
                          <div className="space-y-1">
                            {aiLogs.length === 0 && <p className="text-muted-foreground/30 italic">No activity recorded yet...</p>}
                            {aiLogs.map(log => (
                              <TypedLogEntry key={log.id} log={log} />
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="lg:col-span-1">
                    <AlertList alerts={alerts.slice(0, 5)} language={language} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts"><AlertList alerts={alerts} language={language} /></TabsContent>
              <TabsContent value="insights"><MaintenanceInsights readings={allReadings} alerts={alerts} language={language} /></TabsContent>
              <TabsContent value="certificate"><HealthCertificate healthScore={healthScore} machineId="VIN-AUTEX-001" language={language} /></TabsContent>
              <TabsContent value="reports" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <ReportUploader />
                  <div className="lg:col-span-2"><ReportList /></div>
                </div>
              </TabsContent>
              <TabsContent value="settings"><ThresholdSettings thresholds={thresholds} onUpdate={setThresholds} /></TabsContent>
            </Tabs>
          </main>
          
          {/* Floating Chat Agent */}
          <DiagnosticChat 
            currentSensors={{
              rpm,
              vibration: currentVibration || 0,
              temp,
              healthScore
            }} 
            language={language}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
