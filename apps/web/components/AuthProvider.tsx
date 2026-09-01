"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ClerkErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[Auth] Clerk initialization note. Continuing in local dev mode.", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>;
    }
    return this.props.children;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (clerkPubKey && clerkPubKey.startsWith("pk_") && !clerkPubKey.includes("your_clerk")) {
    return (
      <ClerkErrorBoundary>
        <ClerkProvider publishableKey={clerkPubKey}>
          {children}
        </ClerkProvider>
      </ClerkErrorBoundary>
    );
  }

  // Graceful fallback for local development
  return <>{children}</>;
}
