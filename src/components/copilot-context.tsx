"use client";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

export enum Page {
  Income = "income",
}

export enum IncomePageOperations {
  AddWorkDay = "add-work-day",
  EditWorkDay = "edit-work-day",
  DeleteWorkDay = "delete-work-day",
  ViewMonthlyReport = "view-monthly-report",
}

// A component dedicated to adding readables/actions that are global to the app.
const CopilotContext = ({ children }: { children: React.ReactNode }) => {

  const pathname = usePathname();

  useCopilotReadable({
    description:
      "The available pages and operations, as well as the current page",
    value: {
      pages: Object.values(Page),
      operations: {
        [Page.Income]: Object.values(IncomePageOperations),
      },
      currentPage: pathname.split("/").pop() as Page,
    },
  });

  // This action is a generic "fits all" action
  // It's meant to allow the LLM to navigate to a page where an operation is available or probably available, and possibly activate the operation there.
  // It is tired to the readable above, and requires that operations are implemented in their respective pages.
  // The LLM here will redirect the user to a different page, and set an `operation` query param to notify the page of the requested action
  // For example, you can find `change-pin` in the cards page, which is activated when `operation=change-pin` query param is sent
  useCopilotAction({
    name: "navigateToPageAndPerform",
    description: `
            Navigate to the income page to perform working days operations:
            - Income page: Adding work days, editing hourly rates, viewing monthly income reports, calculating earnings
        `,
    parameters: [
      {
        name: "page",
        type: "string",
        description: "The page in which to perform the operation",
        required: true,
        enum: ["/income", "/"],
      },
      {
        name: "operation",
        type: "string",
        description:
          "The operation to perform. Use operation code from available operations per page. If the operation is unavailable, do not pass it",
        required: false,
      },
      {
        name: "operationAvailable",
        type: "boolean",
        description: "Flag if the operation is available",
        required: true,
      },
    ],
    followUp: false,
    renderAndWait: ({ args, handler }) => {
      const { page, operation, operationAvailable } = args;

      return (
        <div className="flex items-center justify-center space-x-4 rounded-lg bg-white p-4">
          <div>Navigate to {page}?</div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const operationParams = `?operation=${operation}`;
              if (typeof window !== 'undefined') {
                window.location.href = `${page!.toLowerCase()}${
                  operationAvailable ? operationParams : ""
                }`;
              }
              handler?.(page!);
            }}
            aria-label="Confirm Navigation"
            className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
          >
            Yes
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handler?.("cancelled")}
            aria-label="Cancel Navigation"
            className="h-12 w-12 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30 dark:hover:text-gray-300"
          >
            No
          </Button>
        </div>
      );
    },
  });

  return children;
};

export default CopilotContext;
