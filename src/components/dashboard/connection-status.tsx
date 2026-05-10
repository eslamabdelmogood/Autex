
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Link as LinkIcon, Unlink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStatusProps {
  isConnected: boolean;
  onToggleConnection: (connected: boolean) => void;
  onNewReading: (value: number) => void;
}

export function ConnectionStatus({ isConnected, onToggleConnection, onNewReading }: ConnectionStatusProps) {
  const [port, setPort] = useState<any>(null);
  const readerRef = useRef<any>(null);
  const { toast } = useToast();

  const connectSerial = async () => {
    if (!('serial' in navigator)) {
      toast({
        variant: "destructive",
        title: "Browser Unsupported",
        description: "Your browser does not support the Web Serial API. Try Chrome or Edge.",
      });
      return;
    }

    try {
      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      setPort(selectedPort);
      onToggleConnection(true);
      
      readFromPort(selectedPort);
      
      toast({
        title: "Hardware Connected",
        description: "Receiving live telemetry from Serial Port.",
      });
    } catch (err: any) {
      console.error("Serial connection failed:", err);
      
      // Handle the Permissions Policy error specifically
      if (err.name === 'SecurityError') {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Browser policy blocked Serial access. Try opening this app in a new tab or installing it as a PWA.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: err.message || "Could not establish link with serial device.",
        });
      }
      
      // If hardware fails, we can optionally trigger simulation so the user can still see the app working
      onToggleConnection(true);
    }
  };

  const readFromPort = async (selectedPort: any) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = selectedPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const numericValue = parseFloat(value.trim());
          if (!isNaN(numericValue)) {
            onNewReading(numericValue);
          }
        }
      }
    } catch (error) {
      console.error("Read error:", error);
    } finally {
      reader.releaseLock();
    }
  };

  const disconnectSerial = async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
    }
    if (port) {
      try {
        await port.close();
      } catch (e) {
        console.error("Error closing port:", e);
      }
    }
    setPort(null);
    onToggleConnection(false);
    toast({
      title: "Device Disconnected",
      description: "Sensor stream has been stopped.",
    });
  };

  // Simulated fallback for development or if hardware is blocked
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && !port) {
      interval = setInterval(() => {
        const base = 45;
        const noise = (Math.random() - 0.5) * 10;
        // Occasional anomaly to test AI logic
        const anomalyTrigger = Math.random() > 0.95 ? 40 * Math.random() : 0;
        onNewReading(base + noise + anomalyTrigger);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isConnected, port, onNewReading]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1 px-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {port ? 'HARDWARE ACTIVE' : 'SIMULATED'}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5 py-1 px-3">
            <WifiOff className="h-3.5 w-3.5" />
            STANDBY
          </Badge>
        )}
      </div>
      
      {isConnected ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-destructive/50 hover:bg-destructive/10 text-destructive"
          onClick={disconnectSerial}
        >
          <Unlink className="h-4 w-4" />
          Stop Stream
        </Button>
      ) : (
        <Button 
          variant="default" 
          size="sm" 
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={connectSerial}
        >
          <LinkIcon className="h-4 w-4" />
          Connect Device
        </Button>
      )}
    </div>
  );
}
