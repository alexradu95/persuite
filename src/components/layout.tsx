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
  
  useCopilotChatSuggestions({
    instructions: `
      The user is using a personal finance suite with multiple apps. Suggest prompts based on current page:
      
      For Income tracking:
      - "Add a work day for today with 8 hours at €37/hour"
      - "Show me this month's total earnings"
      - "What's my average hourly rate?"
      - "Add work days for all weekdays this month"
      - "Calculate my projected monthly income"
      - "Show me free days available for work"
      
      For Wealth tracking:
      - "Add a new investment asset"
      - "Show me my current net worth"
      - "Track my portfolio performance"
      - "Add a new bank account"
      - "Calculate my asset allocation"
      - "Show my wealth growth over time"
    `,
    minSuggestions: 3,
    maxSuggestions: 4,
  });

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
