import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
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
import { isGoogleAuthEnabled } from "./components/GoogleSignInButton";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function AppProviders({ children }: { children: React.ReactNode }) {
  const content = (
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
  );

  if (isGoogleAuthEnabled() && googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
  }

  return content;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  </React.StrictMode>
);
