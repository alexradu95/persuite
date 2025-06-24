import type { Metadata } from "next";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { CopilotKitWrapper } from "./wrapper";

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
          <CopilotKitWrapper>{children}</CopilotKitWrapper>
      </body>
    </html>
  );
}
