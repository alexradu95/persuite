import type { Metadata } from "next";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import { LayoutComponent } from "@/components/layout";
import CopilotContext from "@/components/copilot-context";

export const metadata: Metadata = {
  title: "Working Days Tracker",
  description: "Track your working days and income with AI assistance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          showDevConsole={false}
        >
          <LayoutComponent>
            <CopilotContext>{children}</CopilotContext>
          </LayoutComponent>
          <CopilotPopup
            defaultOpen={true}
            instructions={
              "You are assisting the user as best as you can. Answer in the best way possible given the data you have."
            }
            labels={{
              title: "Working Days Assistant",
              initial: "Hi, I'm your Working Days Copilot. I can help you track your work days, calculate earnings, manage your schedule, and analyze your income data. How can I assist you today?",
            }}
          />
        </CopilotKit>
      </body>
    </html>
  );
}
