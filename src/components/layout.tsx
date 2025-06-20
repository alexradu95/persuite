"use client";

import Link from "next/link";
import { PiggyBank, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthContext } from "@/components/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCopilotChat, useCopilotReadable } from "@copilotkit/react-core";
import { usePathname } from "next/navigation";
import { useCopilotChatSuggestions } from "@copilotkit/react-ui";

interface LayoutProps {
  children: React.ReactNode;
}


export function LayoutComponent({ children }: LayoutProps) {
  const { currentUser } = useAuthContext();
  const pathname = usePathname();
  console.log("pathname", pathname.split("/")[1]);
  useCopilotReadable({
    description: "The current page where the user is",
    value: pathname.split("/")[1] == "" ? "wealth" : pathname.split("/")[1],
  });
  useCopilotChatSuggestions({
    instructions: `
      You have access to where the user is in the app from copilotkit readables.
      The user is using a wealth management application. Suggest prompts related to wealth management like:
      - "Update my stock investments to $30,000"
      - "Show me my crypto portfolio breakdown" 
      - "What's my total net worth?"
      - "Increase my savings account by $5,000"
      - "Add a new ETF investment"
      - "Enable staking for my Ethereum"
      - "Analyze my portfolio allocation"
      - "What percentage of my wealth is in crypto?"
      - "Show me my investment performance"
      - "Update my bank deposit interest rates"
    `,
    minSuggestions: 3,
    maxSuggestions: 3,
  });

  const { setMessages, reloadMessages } = useCopilotChat();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-16 flex-col items-center space-y-8 border-r bg-gray-900 py-4">
        <Link href="/wealth" className="flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-white" />
        </Link>
        <nav className="flex flex-1 flex-col items-center space-y-6">
          <NavItem href="/wealth" icon={PiggyBank} label="Wealth Management" />
        </nav>
        <div className="flex flex-col items-center space-y-4">
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <h1 className="text-2xl font-bold">Wealth Management - Hello, {currentUser.name}</h1>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-800 hover:text-white",
              "transition-colors duration-200"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
