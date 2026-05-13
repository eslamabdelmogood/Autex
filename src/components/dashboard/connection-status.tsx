
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Link as LinkIcon, Unlink, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStatusProps {
  isConnected: boolean;
  onToggleConnection: (connected: boolean) => void;
  onNewReading: (value: number) => void;
  language?: 'en' | 'ar';
}

export function ConnectionStatus({ isConnected, onToggleConnection, onNewReading, language = 'en' }: ConnectionStatusProps) {
  const [port, setPort] = useState<any>(null);
  const readerRef = useRef<any>(null);
  const { toast } = useToast();

  const translations = {
    en: {
      hardware: "HARDWARE ACTIVE",
      simulated: "SIMULATED",
      standby: "STANDBY",
      test: "Test Anomaly",
      stop: "Stop",
      connect: "Connect"
    },
    ar: {
      hardware: "الجهاز متصل",
      simulated: "محاكاة",
      standby: "وضع الاستعداد",
      test: "اختبار خلل",
      stop: "إيقاف",
      connect: "اتصال"
    }
  };

  const t = translations[language];

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
    } catch (err: any) {
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
    if (readerRef.current) await readerRef.current.cancel();
    if (port) try { await port.close(); } catch (e) {}
    setPort(null);
    onToggleConnection(false);
  };

  const triggerAnomaly = () => {
    const fakeVibration = Math.floor(Math.random() * (110 - 85 + 1)) + 85;
    onNewReading(fakeVibration);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && !port) {
      interval = setInterval(() => {
        const base = 45;
        const noise = (Math.random() - 0.5) * 10;
        onNewReading(base + noise);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isConnected, port, onNewReading]);

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1 px-3 text-[10px] md:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {port ? t.hardware : t.simulated}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-[10px] md:text-xs">
            <WifiOff className="h-3.5 w-3.5" />
            {t.standby}
          </Badge>
        )}
      </div>
      
      {isConnected && (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 md:gap-2 h-8 text-[10px] md:text-xs border-accent/30 hover:bg-accent/10 text-accent"
          onClick={triggerAnomaly}
        >
          <FlaskConical className="h-3 md:h-4 w-3 md:w-4" />
          <span className="hidden xs:inline">{t.test}</span>
        </Button>
      )}

      {isConnected ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 md:gap-2 h-8 text-[10px] md:text-xs border-destructive/50 hover:bg-destructive/10 text-destructive"
          onClick={disconnectSerial}
        >
          <Unlink className="h-3 md:h-4 w-3 md:w-4" />
          {t.stop}
        </Button>
      ) : (
        <Button 
          variant="default" 
          size="sm" 
          className="gap-1 md:gap-2 h-8 text-[10px] md:text-xs bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={connectSerial}
        >
          <LinkIcon className="h-3 md:h-4 w-3 md:w-4" />
          {t.connect}
        </Button>
      )}
    </div>
  );
}
