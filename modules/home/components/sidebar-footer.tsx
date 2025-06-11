"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SidebarFooterSection = () => {
  const { user, isLoading, isAuthenticated } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-2 w-full">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/auth" className="w-full">
        <Button
          variant="ghost"
          className={cn(
            "w-full h-10 justify-start gap-2 cursor-pointer",
            "hover:bg-gradient-to-br hover:from-zinc-800 hover:to-zinc-900"
          )}
        >
          <LogIn className="h-4 w-4" />
          <span className="">Login</span>
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 group-data-[collapsible=icon]:opacity-0 transition-opacity duration-500 ease-in-out">
        <AvatarImage
          src={user?.image ?? ""}
          alt={user?.name || "User"}
        />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity duration-500 ease-in-out">
        <p className="text-sm font-medium whitespace-nowrap">
          {user?.name || "User"}
        </p>
        <p className="text-xs text-gray-400 whitespace-nowrap">
          {user?.email?.split("@")[0] || "Free"}
        </p>
      </div>
    </div>
  );
};

export default SidebarFooterSection;
