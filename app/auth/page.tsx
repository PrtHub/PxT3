"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

const LoginPage = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center p-4">
      <div className="w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-white">
            Welcome to{" "}
            <span className="font-silkscreen text-white text-2xl">
              pxt.chat
            </span>
          </h1>
          <p className="text-zinc-400 font-medium">
            Sign in below to continue your conversation with AI
          </p>
        </div>

        <div>
          <Button
            className="w-full max-w-xs bg-gradient-to-r from-button to-button/90 text-black py-6 text-base font-medium rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.01] cursor-pointer  gap-2"
            size="lg"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <FcGoogle className="size-4" />
            <span>Continue with Google</span>
          </Button>
        </div>

        <p className="text-sm text-zinc-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>

        <Button
          variant="ghost"
          size="lg"
          asChild
          className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
