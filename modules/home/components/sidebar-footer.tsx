"use client"

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'

const SidebarFooterSection = () => {
  return (
    <div className="flex items-center gap-3 ">
    <Avatar className="h-8 w-8 group-data-[collapsible=icon]:opacity-0 transition-opacity duration-500 ease-in-out">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="">
      <p className="text-sm font-medium whitespace-nowrap group-data-[collapsible=icon]:opacity-0 transition-opacity duration-500 ease-in-out">Pritam Ghosh</p>
      <p className="text-xs text-gray-400 whitespace-nowrap group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out">Free</p>
    </div>
  </div>
  )
}

export default SidebarFooterSection