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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <EmployeePermissionsProvider>
            <SelectedGymBrandProvider>
              <AppGymSelectorProvider>
                <RouterProvider router={appRouter} />
              </AppGymSelectorProvider>
            </SelectedGymBrandProvider>
          </EmployeePermissionsProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
