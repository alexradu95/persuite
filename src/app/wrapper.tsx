"use client";
import { LayoutComponent } from "@/components/layout";
import "./globals.css";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { CopilotPopup } from "@copilotkit/react-ui";
import CopilotContext from "@/components/copilot-context";
import { useAuthContext } from "@/components/auth-context";

export function CopilotKitWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthContext();

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      showDevConsole={false}
      properties={{
        userId: currentUser?.id,
      }}
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
  );
}
