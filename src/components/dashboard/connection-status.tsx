"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Link as LinkIcon, Unlink, FlaskConical, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
      connect: "Connect",
      mobile_tip: "Mobile Connection Guide",
      mobile_desc: "To connect hardware to your smartphone:",
      mobile_steps: [
        "Android: Use an OTG adapter and Chrome browser.",
        "iOS: Direct USB serial is restricted. Use 'Simulated Mode' to view synced 'Black Box' data from your laptop hub.",
        "Ensure your cable is high-quality and set to 9600 baud."
      ]
    },
    ar: {
      hardware: "الجهاز متصل",
      simulated: "محاكاة",
      standby: "وضع الاستعداد",
      test: "اختبار خلل",
      stop: "إيقاف",
      connect: "اتصال",
      mobile_tip: "دليل اتصال الهاتف",
      mobile_desc: "لتوصيل الأجهزة بهاتفك الذكي:",
      mobile_steps: [
        "أندرويد: استخدم محول OTG ومتصفح كروم.",
        "آيفون: اتصال USB المباشر مقيد. استخدم 'وضع المحاكاة' لعرض بيانات 'الصندوق الأسود' المتزامنة من الكمبيوتر المحمول.",
        "تأكد من أن الكابل عالي الجودة ومعدل سرعة 9600."
      ]
    }
  };

  const t = translations[language];

  const connectSerial = async () => {
    if (!('serial' in navigator)) {
      toast({
        variant: "destructive",
        title: "Serial Not Supported",
        description: "Your device/browser doesn't support Web Serial. Click the info icon for mobile tips.",
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
        title: "Hardware Linked",
        description: "Black Dragon is now receiving live telemetry.",
      });
    } catch (err: any) {
      console.error("Connection failed:", err);
      if (err.name !== 'NotFoundError') {
        onToggleConnection(true);
      }
    }
  };

  const readFromPort = async (selectedPort: any) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = selectedPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            const numericValue = parseFloat(line.trim());
            if (!isNaN(numericValue)) {
              onNewReading(numericValue);
            }
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
      try {
        await readerRef.current.cancel();
      } catch (e) {}
    }
    if (port) {
      try {
        await port.close();
      } catch (e) {}
    }
    setPort(null);
    onToggleConnection(false);
    toast({
      title: "Hardware Disconnected",
      description: "Returning to standby mode.",
    });
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
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-accent">
            <Info className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-accent" />
              {t.mobile_tip}
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/80">
              {t.mobile_desc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {t.mobile_steps.map((step, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 font-bold text-[10px]">
                  {i + 1}
                </div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
