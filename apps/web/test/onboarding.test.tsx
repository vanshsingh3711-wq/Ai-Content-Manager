import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  OnboardingBanner,
  OnboardingTourModal,
  TOUR_STEPS,
} from "../components/dashboard/OnboardingTour";
import { EmptyState } from "../components/ui/EmptyState";
import { Film } from "lucide-react";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Phase 9: Onboarding & First-Run Experience", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
  });

  it("renders OnboardingBanner for new users and handles tour trigger", () => {
    const onStartTour = vi.fn();
    render(<OnboardingBanner onStartTour={onStartTour} />);

    expect(screen.getByText("Welcome to AI Director!")).toBeInTheDocument();
    expect(
      screen.getByText(/Create high-retention educational shorts/i)
    ).toBeInTheDocument();

    const tourBtn = screen.getByRole("button", { name: /take quick tour/i });
    fireEvent.click(tourBtn);
    expect(onStartTour).toHaveBeenCalledTimes(1);
  });

  it("allows dismissing OnboardingBanner and saves choice in localStorage", () => {
    const { rerender } = render(<OnboardingBanner onStartTour={vi.fn()} />);

    const dismissBtn = screen.getByLabelText("Dismiss welcome banner");
    fireEvent.click(dismissBtn);

    expect(localStorage.getItem("ai-director-onboarding-completed")).toBe("true");
    expect(screen.queryByText("Welcome to AI Director!")).not.toBeInTheDocument();

    // Rerendering with saved preference should keep it hidden
    rerender(<OnboardingBanner onStartTour={vi.fn()} />);
    expect(screen.queryByText("Welcome to AI Director!")).not.toBeInTheDocument();
  });

  it("navigates through OnboardingTourModal steps and controls", () => {
    const onClose = vi.fn();
    render(<OnboardingTourModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Product Tour" })).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument();

    // Advance to Step 2
    const nextBtn = screen.getByRole("button", { name: "Next" });
    fireEvent.click(nextBtn);
    expect(screen.getByText(TOUR_STEPS[1].title)).toBeInTheDocument();

    // Regress to Step 1
    const prevBtn = screen.getByRole("button", { name: "Previous" });
    fireEvent.click(prevBtn);
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument();

    // Advance using keyboard ArrowRight
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(TOUR_STEPS[1].title)).toBeInTheDocument();

    // Regress using keyboard ArrowLeft
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument();

    // Jump via step dot
    const step3Dot = screen.getByLabelText("Go to tour step 3");
    fireEvent.click(step3Dot);
    expect(screen.getByText(TOUR_STEPS[2].title)).toBeInTheDocument();

    // Close on Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("completes the tour on the final step and routes to creation", () => {
    const onClose = vi.fn();
    render(<OnboardingTourModal isOpen={true} onClose={onClose} />);

    // Jump to last step (step 5)
    const step5Dot = screen.getByLabelText("Go to tour step 5");
    fireEvent.click(step5Dot);
    expect(screen.getByText(TOUR_STEPS[4].title)).toBeInTheDocument();

    // Click "Start Creating"
    const startBtn = screen.getByRole("button", { name: /start creating/i });
    fireEvent.click(startBtn);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/create");
    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem("ai-director-onboarding-completed")).toBe("true");
  });
});

describe("Phase 9: Contextual Empty States", () => {
  it("renders EmptyState component with icons, descriptions, and action callbacks", () => {
    const onAction = vi.fn();
    const onSecondary = vi.fn();

    render(
      <EmptyState
        icon={Film}
        title="No videos in your library yet"
        description="Start by creating an educational short or tech reel."
        actionText="Create First Video"
        onAction={onAction}
        secondaryActionText="Browse Templates"
        onSecondaryAction={onSecondary}
      />
    );

    expect(screen.getByText("No videos in your library yet")).toBeInTheDocument();
    expect(
      screen.getByText("Start by creating an educational short or tech reel.")
    ).toBeInTheDocument();

    const actionBtn = screen.getByRole("button", { name: "Create First Video" });
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalledTimes(1);

    const secondaryBtn = screen.getByRole("button", { name: "Browse Templates" });
    fireEvent.click(secondaryBtn);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });
});
