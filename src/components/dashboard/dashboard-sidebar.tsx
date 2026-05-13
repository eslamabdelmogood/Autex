
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
  FileText
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function DashboardSidebar() {
  const logo = PlaceHolderImages.find(img => img.id === 'black-dragon-logo');

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="h-16 flex items-center justify-center border-b">
        <div className="flex items-center gap-3">
          {logo && (
            <div className="relative h-8 w-8 overflow-hidden rounded-md bg-black">
              <Image 
                src={logo.imageUrl} 
                alt="Black Dragon Logo" 
                fill 
                className="object-cover invert opacity-80"
                data-ai-hint={logo.imageHint}
              />
            </div>
          )}
          <span className="font-black text-xl group-data-[collapsible=icon]:hidden tracking-tighter">BLACK DRAGON</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Core Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Live Dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="font-medium">Command Center</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Alert Management">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Incident Log</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Historical Analytics">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="font-medium">ROI Insights</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Compliance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Health Certificates">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">Proof of Condition</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Document Repository">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Archived Manuals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Black Box Audit">
                  <History className="h-4 w-4" />
                  <span className="font-medium">System Ledger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Connectivity</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Firebase Cloud">
                  <Database className="h-4 w-4" />
                  <span className="font-medium text-xs">Cloud Sync Active</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="System Settings">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Configuration</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
