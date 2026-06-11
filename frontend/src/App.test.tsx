import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider } from "./authContext";
import { ToastProvider } from "./components/Toast";

describe("Login", () => {
  it("shows login screen by default", () => {
    const router = createMemoryRouter([{ path: "/login", element: <LoginPage /> }], {
      initialEntries: ["/login"],
    });

    render(
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    );

    expect(screen.getByText("Witaj ponownie")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zaloguj się" })).toBeTruthy();
  });
});
