import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { appRouter } from "./appRouter";
import { AuthProvider } from "./authContext";
import { ThemeProvider } from "./ThemeContext";
import { ToastProvider } from "./components/Toast";
import { EmployeePermissionsProvider } from "./employeePermissionsContext";
import { SelectedGymBrandProvider } from "./selectedGymBrandContext";
import { AppGymSelectorProvider } from "./appGymSelectorContext";
import { WebSocketProvider } from "./WebSocketContext";
import { TenantProvider } from "./tenantContext";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { GoogleAuthProvider } from "./components/GoogleAuthProvider";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <GoogleAuthProvider>
        <AuthProvider>
          <TenantProvider>
            <WebSocketProvider>
              <ThemeProvider>
                <ToastProvider>
                  <EmployeePermissionsProvider>
                    <SelectedGymBrandProvider>
                      <AppGymSelectorProvider>
                        {children}
                        <CookieConsentBanner />
                      </AppGymSelectorProvider>
                    </SelectedGymBrandProvider>
                  </EmployeePermissionsProvider>
                </ToastProvider>
              </ThemeProvider>
            </WebSocketProvider>
          </TenantProvider>
        </AuthProvider>
      </GoogleAuthProvider>
    </AppErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  </React.StrictMode>
);
