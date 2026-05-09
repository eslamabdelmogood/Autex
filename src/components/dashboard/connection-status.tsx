"use client";

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Link as LinkIcon, Unlink } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  onToggleConnection: (connected: boolean) => void;
  onNewReading: (value: number) => void;
}

export function ConnectionStatus({ isConnected, onToggleConnection, onNewReading }: ConnectionStatusProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = async () => {
    // In a real environment, we'd use navigator.serial.requestPort() here.
    // Since we're in a browser demo/scaffold, we'll simulate the data stream
    // but check for Web Serial support for production readiness.
    
    if (typeof window !== 'undefined' && 'serial' in navigator) {
      console.log("Web Serial is supported. Attempting to connect...");
      // Implementation for real serial would go here
    }

    onToggleConnection(true);
  };

  const stopMonitoring = () => {
    onToggleConnection(false);
  };

  useEffect(() => {
    if (isConnected) {
      intervalRef.current = setInterval(() => {
        // Generate random industrial sensor-like data (e.g., vibration m/s^2)
        // Usually around 40-50, spikes to 90+ are anomalies
        const base = 45;
        const noise = (Math.random() - 0.5) * 10;
        const anomalyTrigger = Math.random() > 0.95 ? 40 * Math.random() : 0;
        onNewReading(base + noise + anomalyTrigger);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected, onNewReading]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1 px-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            CONNECTED
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5 py-1 px-3">
            <WifiOff className="h-3.5 w-3.5" />
            DISCONNECTED
          </Badge>
        )}
      </div>
      
      {isConnected ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-destructive/50 hover:bg-destructive/10 text-destructive"
          onClick={stopMonitoring}
        >
          <Unlink className="h-4 w-4" />
          Disconnect
        </Button>
      ) : (
        <Button 
          variant="default" 
          size="sm" 
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={startMonitoring}
        >
          <LinkIcon className="h-4 w-4" />
          Connect Machine
        </Button>
      )}
    </div>
  );
}
