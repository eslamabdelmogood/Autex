
"use client";

import Image from "next/image";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  ShieldAlert, 
  Zap, 
  Database,
  TrendingUp,
  ShieldCheck,
  FileText,
  Cpu
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface DashboardSidebarProps {
  language?: 'en' | 'ar';
  hasGreenBox?: boolean;
}

export function DashboardSidebar({ language = 'en', hasGreenBox = false }: DashboardSidebarProps) {
  const logo = PlaceHolderImages.find(img => img.id === 'black-dragon-logo');

  const translations = {
    en: {
      brand: "BLACK DRAGON",
      core: "Core Operations",
      command: "Command Center",
      incident: "Incident Log",
      roi: "ROI Insights",
      compliance: "Compliance",
      proof: "Proof of Condition",
      manuals: "Archived Manuals",
      ledger: "System Ledger",
      connectivity: "Connectivity",
      cloud: "Cloud Sync Active",
      config: "Configuration",
      greenBox: "Green Box: Offline",
      greenBoxActive: "Green Box: Online"
    },
    ar: {
      brand: "التنين الأسود",
      core: "العمليات الأساسية",
      command: "مركز القيادة",
      incident: "سجل الحوادث",
      roi: "رؤى العائد",
      compliance: "الامتثال",
      proof: "إثبات الحالة",
      manuals: "الأرشيف التقني",
      ledger: "دفتر النظام",
      connectivity: "الاتصال",
      cloud: "مزامنة سحابية نشطة",
      config: "الإعدادات",
      greenBox: "الصندوق الأخضر: متوقف",
      greenBoxActive: "الصندوق الأخضر: نشط"
    }
  };

  const t = translations[language];

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          {logo && (
            <div className="relative h-8 w-8 min-w-[32px] overflow-hidden rounded-md bg-black">
              <Image 
                src={logo.imageUrl} 
                alt="Black Dragon Logo" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover invert opacity-80"
                data-ai-hint={logo.imageHint}
              />
            </div>
          )}
          <span className="font-black text-lg group-data-[collapsible=icon]:hidden tracking-tighter whitespace-nowrap">{t.brand}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.core}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip={t.command}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="font-medium">{t.command}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t.incident}>
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <span className="font-medium">{t.incident}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t.roi}>
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="font-medium">{t.roi}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.compliance}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={t.proof}>
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{t.proof}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t.manuals}>
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{t.manuals}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t.ledger}>
                  <History className="h-4 w-4" />
                  <span className="font-medium">{t.ledger}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.connectivity}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={hasGreenBox ? t.greenBoxActive : t.greenBox}>
                  <Cpu className={`h-4 w-4 ${hasGreenBox ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                  <span className={`font-medium ${hasGreenBox ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                    {hasGreenBox ? t.greenBoxActive : t.greenBox}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t.cloud}>
                  <Database className="h-4 w-4" />
                  <span className="font-medium text-xs">{t.cloud}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t.config}>
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">{t.config}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
