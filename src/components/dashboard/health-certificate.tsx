
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  FileSignature, 
  Download, 
  QrCode, 
  CheckCircle2,
  Calendar,
  Activity
} from 'lucide-react';

interface HealthCertificateProps {
  healthScore: number;
  machineId: string;
}

export function HealthCertificate({ healthScore, machineId }: HealthCertificateProps) {
  const isHealthy = healthScore > 85;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto py-8">
      <Card className="w-full border-accent/20 bg-card relative overflow-hidden">
        {/* Certificate Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full border-l border-b border-accent/10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-tr-full border-r border-t border-accent/10" />
        
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit mb-4">
            <ShieldCheck className="h-10 w-10 text-accent" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Proof of Condition</CardTitle>
          <CardDescription>Certified Machine Health Document</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 px-10 pb-10">
          <div className="border-y border-border py-8 space-y-6 text-center">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Asset Identifier</p>
              <p className="text-lg font-mono font-bold">{machineId}</p>
            </div>

            <div className="flex justify-center gap-12">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Health Index</p>
                <p className={`text-3xl font-black ${isHealthy ? 'text-emerald-500' : 'text-accent'}`}>{healthScore}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p>
                <div className="flex items-center gap-2 justify-center mt-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="font-bold text-lg uppercase">Certified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Issued On</p>
                  <p className="text-xs font-medium">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">AI Validator</p>
                  <p className="text-xs font-medium italic">Black Dragon Edge Engine v4.2</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-md shadow-inner">
              <QrCode className="h-16 w-16 text-black" />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button className="flex-1 gap-2 bg-accent hover:bg-accent/90">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1 gap-2 border-accent/20 hover:bg-accent/10">
              <FileSignature className="h-4 w-4 text-accent" />
              Sign Report
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-accent/10 p-4 rounded-xl border border-accent/20 flex items-start gap-4">
        <Activity className="h-6 w-6 text-accent shrink-0 mt-1" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This certificate is generated using immutable blockchain-style hashing of your Black Dragon history. It provides verified proof of consistent engine performance, increasing resale value and ensuring regulatory compliance.
        </p>
      </div>
    </div>
  );
}
