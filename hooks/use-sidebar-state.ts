"use client";

import { useEffect, useState } from "react";

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Initial check
    const checkSidebarState = () => {
      const sidebar = document.getElementById("home-sidebar");
      if (sidebar) {
        // Check if the sidebar has the collapsed state
        const isCurrentlyCollapsed = sidebar.getAttribute("data-state") === "collapsed" || 
                                    sidebar.getAttribute("data-collapsible") === "icon";
        setIsCollapsed(isCurrentlyCollapsed);
      }
    };

    // Check immediately
    checkSidebarState();

    // Set up a mutation observer to watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && 
            (mutation.attributeName === "data-state" || mutation.attributeName === "data-collapsible")) {
          checkSidebarState();
        }
      });
    });

    const sidebar = document.getElementById("home-sidebar");
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return isCollapsed;
}