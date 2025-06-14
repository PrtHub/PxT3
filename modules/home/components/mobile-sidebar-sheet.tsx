"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import HomeSidebar from "./home-sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MobileSidebarSheet() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
            <Menu className="size-4 text-white font-bold cursor-pointer" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[14.5rem]">
          <VisuallyHidden asChild>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <div className="h-full">
            <HomeSidebar isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
