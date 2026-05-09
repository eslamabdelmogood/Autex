"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { SensorReading } from './monitoring-dashboard';

interface LiveSensorChartProps {
  readings: SensorReading[];
  thresholds: { min: number; max: number };
}

export function LiveSensorChart({ readings, thresholds }: LiveSensorChartProps) {
  const chartData = readings.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: parseFloat(r.value.toFixed(2))
  }));

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-headline">Live Vibration Analysis</CardTitle>
          <CardDescription>Real-time streaming telemetry from Sensor ID: VIB-001</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              hide={chartData.length < 5} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }} 
              fontSize={11}
            />
            <YAxis 
              domain={[0, 120]} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }} 
              fontSize={11}
              unit="m/s²"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <ReferenceLine y={thresholds.max} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'MAX', position: 'right', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
            <ReferenceLine y={thresholds.min} stroke="hsl(var(--accent))" strokeDasharray="5 5" label={{ value: 'MIN', position: 'right', fill: 'hsl(var(--accent))', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
