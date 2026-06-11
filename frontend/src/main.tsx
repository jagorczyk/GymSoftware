import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { appRouter } from "./appRouter";
import { AuthProvider } from "./authContext";
import { ToastProvider } from "./components/Toast";
import { EmployeePermissionsProvider } from "./employeePermissionsContext";
import { SelectedGymBrandProvider } from "./selectedGymBrandContext";
import { AppGymSelectorProvider } from "./appGymSelectorContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <EmployeePermissionsProvider>
          <SelectedGymBrandProvider>
            <AppGymSelectorProvider>
              <RouterProvider router={appRouter} />
            </AppGymSelectorProvider>
          </SelectedGymBrandProvider>
        </EmployeePermissionsProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
