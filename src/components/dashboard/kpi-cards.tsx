"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SensorReading } from './monitoring-dashboard';
import { TrendingUp, TrendingDown, ShieldAlert, Cpu, Loader2, BrainCircuit, Activity } from 'lucide-react';

interface KpiCardsProps {
  readings: SensorReading[];
  isAnalyzing: boolean;
  activeAlertsCount: number;
  inferenceCount: number;
  lastFaultType: string | null;
  currentValue?: number | null;
}

export function KpiCards({ readings, isAnalyzing, activeAlertsCount, inferenceCount, lastFaultType, currentValue }: KpiCardsProps) {
  const lastValue = currentValue ?? (readings.length > 0 ? readings[readings.length - 1].value : 0);
  const avgValue = readings.length > 0 
    ? readings.reduce((acc, curr) => acc + curr.value, 0) / readings.length 
    : 0;

  const trend = readings.length > 1 
    ? lastValue >= readings[readings.length - 2].value ? 'up' : 'down'
    : 'neutral';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <Card className="bg-card/40 border-border">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Vibration</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-headline">{lastValue.toFixed(1)}</h3>
              <span className="text-xs text-muted-foreground">m/s²</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl bg-accent/10 ${trend === 'up' ? 'text-accent' : 'text-emerald-500'}`}>
            {trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Edge AI Inferences</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-headline">{inferenceCount}</h3>
              <span className="text-xs text-muted-foreground">Local</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <BrainCircuit className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Alerts</p>
            <h3 className={`text-2xl font-bold font-headline ${activeAlertsCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {activeAlertsCount}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${activeAlertsCount > 0 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted/10 text-muted-foreground'}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Detection</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-sm font-bold font-headline truncate max-w-[120px] ${lastFaultType ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {lastFaultType || "None"}
              </h3>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary-foreground">
            <Activity className="h-5 w-5 text-accent" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border relative overflow-hidden">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cloud AI Status</p>
            <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Guard Active"
              )}
            </h3>
          </div>
          <div className="h-8 w-24 bg-accent/10 rounded-lg flex items-center justify-center">
             <div className="flex gap-1">
               <div className={`h-4 w-1 bg-accent rounded-full ${isAnalyzing ? 'animate-bounce' : ''}`} />
               <div className={`h-6 w-1 bg-accent/80 rounded-full ${isAnalyzing ? 'animate-bounce delay-75' : ''}`} />
               <div className={`h-3 w-1 bg-accent/60 rounded-full ${isAnalyzing ? 'animate-bounce delay-150' : ''}`} />
               <div className={`h-5 w-1 bg-accent/40 rounded-full ${isAnalyzing ? 'animate-bounce delay-300' : ''}`} />
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
