"use client";

import Link from "next/link";
import { CreditCard, LayoutDashboard, PiggyBank } from "lucide-react";

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
    value: pathname.split("/")[1] == "" ? "cards" : pathname.split("/")[1],
  });
  useCopilotChatSuggestions({
    instructions: `
      You have access to where the user is in the app from copilotkit readables.
        -if the user is on the cards page,
          suggest actions/information in this page related to credit cards, transactions or policies.
          Use specific items or "all items", for example:
          "Show all transactions of Marketing department" or "Tell me how much I spent on my Mastercard"
          If the user has permission to e.g. add credit card, then you can suggest to add a new card.
          Do the same for other actions.
        -if the user is on the dashboard page,
          suggest prompts like "describe current view" so that you can provide a summary of the current view.
          you can also suggest prompts like "show me the recent transactions", "list all policies" or "show me the team".
        -if the user is on the wealth page,
          suggest prompts related to wealth management like "Update my stock investments to $30,000", "Show me my crypto portfolio breakdown", "What's my total net worth?", or "Increase my savings account by $5,000".
          You can also suggest analysis prompts like "Analyze my portfolio allocation" or "What percentage of my wealth is in crypto?".
    `,
    minSuggestions: 3,
    maxSuggestions: 3,
    // className:
    //   currentUser.role === MemberRole.Admin
    //     ? "bg-purple-500 prefix-arrow text-xs p-1 rounded-sm text-white"
    //     : undefined,
  });

  const { setMessages, reloadMessages } = useCopilotChat();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-16 flex-col items-center space-y-8 border-r bg-gray-900 py-4">
        <Link href="/" className="flex items-center justify-center">
          <LayoutDashboard className="h-8 w-8 text-white" />
        </Link>
        <nav className="flex flex-1 flex-col items-center space-y-6">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/" icon={CreditCard} label="Credit Cards" />
          <NavItem href="/wealth" icon={PiggyBank} label="Wealth Management" />
        </nav>
        <div className="flex flex-col items-center space-y-4">
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <h1 className="text-2xl font-bold">Hello, {currentUser.name}</h1>
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
