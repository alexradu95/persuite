"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { usePathname } from "next/navigation";
import { useCopilotChatSuggestions } from "@copilotkit/react-ui";

interface LayoutProps {
  children: React.ReactNode;
}

export function LayoutComponent({ children }: LayoutProps) {
  const pathname = usePathname();
  
  useCopilotReadable({
    description: "The current page where the user is",
    value: pathname.split("/")[1] == "" ? "income" : pathname.split("/")[1],
  });
  
  useCopilotChatSuggestions({
    instructions: `
      The user is using a working days tracking application. Suggest prompts for income/working days management:
      - "Add a work day for today with 8 hours at €37/hour"
      - "Show me this month's total earnings"
      - "What's my average hourly rate?"
      - "Add work days for all weekdays this month"
      - "Calculate my projected monthly income"
      - "Show me free days available for work"
    `,
    minSuggestions: 3,
    maxSuggestions: 3,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h1 className="text-2xl font-bold">Working Days Tracker - Hello</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
