import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DashboardLayout from "../app/dashboard/layout.tsx";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock VideoUploadModal to keep test lightweight
vi.mock("@/components/VideoUploadModal", () => ({
  VideoUploadModal: () => <div data-testid="upload-modal" />,
}));

describe("Phase 2: Navigation & Dashboard Layout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders pinned sidebar with all primary navigation labels", () => {
    render(
      <DashboardLayout>
        <div>Dashboard Child Page</div>
      </DashboardLayout>
    );

    // Primary navigation items within sidebar
    const sidebar = screen.getByLabelText("Main Navigation");
    expect(screen.getAllByText("Overview")[0]).toBeInTheDocument();
    expect(screen.getByText("Create Video")).toBeInTheDocument();
    expect(screen.getByText("Studio Editor")).toBeInTheDocument();
    expect(screen.getByText("Videos Library")).toBeInTheDocument();
    expect(screen.getByText("Queue & Jobs")).toBeInTheDocument();
    expect(screen.getByText("Publish & Socials")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();

    // Verify main landmark with id="main-content"
    const mainLandmark = screen.getByRole("main");
    expect(mainLandmark).toHaveAttribute("id", "main-content");
    expect(screen.getByText("Dashboard Child Page")).toBeInTheDocument();
  });

  it("allows toggling sidebar collapse and saves preference in localStorage", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const toggleBtn = screen.getByLabelText("Collapse sidebar");
    fireEvent.click(toggleBtn);

    expect(localStorage.getItem("ai-director-sidebar-pinned")).toBe("false");
    expect(screen.getByLabelText("Pin sidebar")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Pin sidebar"));
    expect(localStorage.getItem("ai-director-sidebar-pinned")).toBe("true");
  });

  it("opens CommandPalette when clicking the search pill in the top bar", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const searchPill = screen.getByText(
      /search actions, videos, or templates/i
    );
    fireEvent.click(searchPill);

    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
  });

  it("renders mobile bottom navigation bar with quick action links", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const mobileNav = screen.getByLabelText("Mobile Navigation");
    expect(mobileNav).toBeInTheDocument();
    expect(screen.getByLabelText("Create new video")).toBeInTheDocument();
  });
});
