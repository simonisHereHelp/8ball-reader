"use client";

import { SessionProvider } from "next-auth/react";

export function NextAuthSessionProvider(props: { children: any }) {
  return <SessionProvider>{props.children}</SessionProvider>;
}
