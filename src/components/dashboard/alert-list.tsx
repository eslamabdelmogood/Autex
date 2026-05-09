"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnomalyAlert } from './monitoring-dashboard';
import { AlertTriangle, CheckCircle2, Info, ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertListProps {
  alerts: AnomalyAlert[];
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-transparent">
        <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mb-4" />
        <CardTitle className="text-muted-foreground font-medium">No active alerts detected</CardTitle>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          The machine is operating within safe parameters. All sensor streams are stable.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Active Incident Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="flex flex-col divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                      alert.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-accent/20 text-accent'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{alert.anomalyType}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                    {alert.severity}
                  </Badge>
                </div>

                <div className="ml-11 mt-3 space-y-3">
                  {alert.explanation && (
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs leading-relaxed text-foreground/90">
                        <span className="font-semibold block mb-1">AI Reasoning:</span>
                        {alert.explanation.explanation}
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        <p className="text-xs">
                          <span className="text-accent font-medium">Recommended Action:</span>
                          <span className="ml-1 text-muted-foreground">{alert.explanation.recommendedImmediateAction}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {alert.classification && (
                      <Badge variant="outline" className="bg-background/50 text-[10px] font-normal">
                        Malfunction: {alert.classification}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
