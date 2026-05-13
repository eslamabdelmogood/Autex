
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SensorReading } from './monitoring-dashboard';
import { ShieldAlert, BrainCircuit, Zap, Thermometer, ShieldCheck } from 'lucide-react';

interface KpiCardsProps {
  readings: SensorReading[];
  isAnalyzing: boolean;
  activeAlertsCount: number;
  inferenceCount: number;
  lastFaultType: string | null;
  currentValue?: number | null;
  healthScore: number;
  rpm: number;
  temp: number;
  language?: 'en' | 'ar';
}

export function KpiCards({ 
  readings, 
  isAnalyzing, 
  activeAlertsCount, 
  inferenceCount, 
  lastFaultType, 
  currentValue,
  healthScore,
  rpm,
  temp,
  language = 'en'
}: KpiCardsProps) {
  const translations = {
    en: {
      health: "Health (HPI)",
      rpm: "Engine RPM",
      temp: "System Temp",
      alerts: "Active Alerts",
      edge: "Edge Analysis",
      runs: "Runs",
      celsius: "Celsius",
      unit_rpm: "RPM"
    },
    ar: {
      health: "الصحة (HPI)",
      rpm: "دوران المحرك",
      temp: "حرارة النظام",
      alerts: "تنبيهات نشطة",
      edge: "تحليل الحافة",
      runs: "عمليات",
      celsius: "سيليزية",
      unit_rpm: "دورة"
    }
  };

  const t = translations[language];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* HPI - Health Performance Index */}
      <Card className="bg-card/40 border-accent/20 relative overflow-hidden group">
        <div className={`absolute inset-0 opacity-5 bg-gradient-to-br from-accent to-transparent transition-opacity ${healthScore < 80 ? 'from-destructive' : ''}`} />
        <CardContent className="p-4 md:p-5 flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.health}</p>
            <div className="flex items-baseline gap-1">
              <h3 className={`text-2xl md:text-3xl font-black ${healthScore > 90 ? 'text-emerald-500' : healthScore > 70 ? 'text-accent' : 'text-destructive'}`}>
                {healthScore}%
              </h3>
            </div>
          </div>
          <ShieldCheck className={`h-6 md:h-8 w-6 md:w-8 ${healthScore > 90 ? 'text-emerald-500' : healthScore > 70 ? 'text-accent' : 'text-destructive'} opacity-40`} />
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border">
        <CardContent className="p-4 md:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.rpm}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-xl md:text-2xl font-bold font-mono">{Math.round(rpm)}</h3>
              <span className="text-[10px] text-muted-foreground uppercase">{t.unit_rpm}</span>
            </div>
          </div>
          <Zap className="h-5 md:h-6 w-5 md:w-6 text-accent/50" />
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border">
        <CardContent className="p-4 md:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.temp}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-xl md:text-2xl font-bold font-mono">{temp.toFixed(1)}°</h3>
              <span className="text-[10px] text-muted-foreground uppercase">{t.celsius}</span>
            </div>
          </div>
          <Thermometer className="h-5 md:h-6 w-5 md:w-6 text-orange-500/50" />
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border">
        <CardContent className="p-4 md:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.alerts}</p>
            <h3 className={`text-xl md:text-2xl font-bold ${activeAlertsCount > 0 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
              {activeAlertsCount}
            </h3>
          </div>
          <ShieldAlert className={`h-5 md:h-6 w-5 md:w-6 ${activeAlertsCount > 0 ? 'text-destructive' : 'text-muted-foreground/30'}`} />
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border">
        <CardContent className="p-4 md:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.edge}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-500">{inferenceCount}</h3>
              <span className="text-[10px] text-muted-foreground uppercase">{t.runs}</span>
            </div>
          </div>
          <BrainCircuit className="h-5 md:h-6 w-5 md:w-6 text-emerald-500/50" />
        </CardContent>
      </Card>
    </div>
  );
}
