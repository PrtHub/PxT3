import { auth } from "@/auth";
import { SessionProvider as NextAuthProvider } from "next-auth/react";

export async function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return <NextAuthProvider session={session}>{children}</NextAuthProvider>;
}
