"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { usePathname } from "next/navigation";
import { useCopilotChatSuggestions } from "@copilotkit/react-ui";
import { AppLayout } from "./layout/AppLayout";

interface LayoutProps {
  children: React.ReactNode;
}

export function LayoutComponent({ children }: LayoutProps) {
  const pathname = usePathname();
  const currentPage = pathname.split("/")[1] || "income";
  
  useCopilotReadable({
    description: "The current page where the user is",
    value: currentPage,
  });
  
  try {
    useCopilotChatSuggestions([
      "Add a work day for today with 8 hours at €37/hour",
      "Show me this month's total earnings", 
      "What's my average hourly rate?",
      "Calculate my projected monthly income"
    ]);
  } catch (error) {
    console.warn('Chat suggestions failed to load:', error);
  }

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
