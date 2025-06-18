"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Loader2,
  Mail,
  ArrowLeft,
  Settings,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import type { User } from "next-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface UserWithStats extends User {
  chatCount: number;
  messageCount: number;
  createdAt: Date;
}

interface ProfileViewProps {
  profileId: string;
}

const ProfileView = ({ profileId }: ProfileViewProps) => {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: userData } = trpc.auth.getUserWithChatsAndMessages.useQuery(
    { userId: profileId },
    {
      enabled: !!user?.id && user.id === profileId,
      select: (data) => ({
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
      }),
    }
  ) as { data: UserWithStats | undefined };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({
        redirect: false,
        callbackUrl: "/auth",
      });
      router.replace("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2 text-center">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-36 mx-auto" />
            </div>
          </div>
          <div className="space-y-4 pt-6 border-t border-border">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto h-screen max-w-md space-y-6 text-center flex items-center justify-center flex-col">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need to be signed in to view this page
          </p>
        </div>
        <Button asChild className="w-full bg-gradient-to-r from-button to-button/90 text-black py-6 text-base font-medium rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.01] cursor-pointer  gap-2">
          <Link href="/auth" className="flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign In
          </Link>
        </Button>
      </div>
    );
  }

  if (user.id !== profileId) {
    return (
      <div className="container mx-auto p-6 max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-muted-foreground">
            You can only view your own profile
          </p>
        </div>
        <Button asChild className="w-full">
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to My Profile
          </Link>
        </Button>
      </div>
    );
  }

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <Button
        variant="ghost"
        asChild
        className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to chat</span>
        </Link>
      </Button>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/10 to-muted/20" />

        <div className="px-6 pb-6 relative">
          <div className="relative -mt-16 mb-6">
            <div className="relative inline-block">
              <Avatar className="h-32 w-32 border-4 border-background">
                {user.image ? (
                  <AvatarImage
                    src={user.image}
                    alt={user.name || "User"}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <AvatarFallback className="bg-muted text-3xl font-medium">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              {user.email?.includes("@gmail.com") && (
                <div className="absolute -bottom-2 -right-2 bg-button text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                  Google
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name || "User"}
            </h1>
            <div className="flex items-center text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {userData?.chatCount ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Chats</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {userData?.messageCount ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Messages</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {userData?.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                    })
                  : "--"}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Member since</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Tooltip >
              <TooltipTrigger className="w-full">
                <Button className="w-full" asChild>
                  <Link
                    href="#"
                    className="flex items-center justify-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="">Account Settings</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Not implemented yet</span>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              className={cn(
                "w-full cursor-pointer",
                "text-destructive hover:bg-destructive/10 hover:text-destructive",
                "border-destructive/20",
                "transition-colors duration-200",
                "flex items-center justify-center gap-2"
              )}
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
