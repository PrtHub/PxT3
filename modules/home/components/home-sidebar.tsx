"use client";

import React, { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import MainSection from "./main-section";
import SidebarFooterSection from "./sidebar-footer";

const HomeSidebar = () => {
  const { state } = useSidebar();
  
  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar-collapsed', state === 'collapsed' ? 'true' : 'false');
    
    return () => {
      document.documentElement.removeAttribute('data-sidebar-collapsed');
    };
  }, [state]);
  
  return (
    <Sidebar
      collapsible="icon"
      className="bg-background w-[14.5rem] border-none group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:w-0 transition-all duration-300 ease-in-out flex flex-col"
    >
      <SidebarContent className="bg-background ">
        <MainSection />
      </SidebarContent> 

      <SidebarFooter className="p-4 bg-background group-data-[collapsible=icon]:bg-background group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out">
        <SidebarFooterSection />
      </SidebarFooter>
    </Sidebar>
  );
};

export default HomeSidebar;
