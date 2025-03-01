import { CopilotKit, CopilotKitProvider } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useEffect, useState } from "react";
import "@copilotkit/react-ui/styles.css";

interface CopilotWrapperProps {
  children: React.ReactNode;
}

// Initialize the CopilotKit instance
const copilot = new CopilotKit({
  baseUrl: "/api",
  // Configure retry and error handling
  networkRequestConfig: {
    retryCount: 3,
    retryDelay: 1000,
    shouldRetry: (error: any) => {
      return error.status === 429 || error.status >= 500;
    }
  }
});

export default function CopilotWrapper({ children }: CopilotWrapperProps) {
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Fetch CSRF token on mount
  useEffect(() => {
    fetch("/api/csrf-token")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  return (
    <CopilotKitProvider
      copilotKit={copilot}
      headers={{
        "CSRF-Token": csrfToken,
      }}
    >
      <div className="relative">
        {children}
        <CopilotSidebar 
          defaultOpen={false}
          className="fixed bottom-20 right-4 z-50"
        />
      </div>
    </CopilotKitProvider>
  );
}