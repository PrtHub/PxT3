"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SidebarFooterSection = () => {
  const { data: session } = useSession();

  const Image = session?.user?.image;

  if (!Image) {
    throw new Error("No Image");
  }

  if (!session) {
    return (
      <Link href="/auth">
        <Button
          variant="ghost"
          className="w-full h-10 justify-start gap-2 cursor-pointer hover:bg-gradient-to-br hover:from-zinc-800 hover:to-zinc-900 "
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
          src={Image}
          alt={session.user?.name || "User"}
        />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity duration-500 ease-in-out">
        <p className="text-sm font-medium whitespace-nowrap">
          {session.user?.name || "User"}
        </p>
        <p className="text-xs text-gray-400 whitespace-nowrap">
          {session.user?.email?.split("@")[0] || "Free"}
        </p>
      </div>
    </div>
  );
};

export default SidebarFooterSection;
