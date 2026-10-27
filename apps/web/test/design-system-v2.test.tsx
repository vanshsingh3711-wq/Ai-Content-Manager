import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Tooltip,
  Drawer,
  Dialog,
  Kbd,
  Tabs,
  TabPanel,
  ProgressRing,
  EmptyState,
  ToastProvider,
  useToast,
} from "../components/ui";
import { Sparkles } from "lucide-react";

describe("Design System V2 UI Primitives", () => {
  describe("Button Component", () => {
    it("renders children and handles click events", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole("button", { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("displays loading spinner and sets aria-busy", () => {
      render(
        <Button isLoading loadingText="Generating...">
          Generate Video
        </Button>
      );

      const btn = screen.getByRole("button");
      expect(btn).toHaveAttribute("aria-busy", "true");
      expect(btn).toBeDisabled();
      expect(screen.getByText("Generating...")).toBeInTheDocument();
    });

    it("renders with custom variants and icons", () => {
      render(
        <Button
          variant="accent"
          size="sm"
          leftIcon={<Sparkles data-testid="sparkle" />}
        >
          AI Magic
        </Button>
      );

      expect(screen.getByTestId("sparkle")).toBeInTheDocument();
      expect(screen.getByText("AI Magic")).toBeInTheDocument();
    });
  });

  describe("Card Component", () => {
    it("renders card with header, content, and footer", () => {
      render(
        <Card glow="violet">
          <CardHeader
            title="Recent Video"
            description="Created 5m ago"
            action={<span data-testid="status">Done</span>}
          />
          <CardContent>
            <p>Main body content</p>
          </CardContent>
          <CardFooter>
            <Button size="xs">Edit</Button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText("Recent Video")).toBeInTheDocument();
      expect(screen.getByText("Created 5m ago")).toBeInTheDocument();
      expect(screen.getByText("Main body content")).toBeInTheDocument();
      expect(screen.getByTestId("status")).toBeInTheDocument();
    });
  });

  describe("Badge Component", () => {
    it("renders badge with appropriate variant styling", () => {
      render(<Badge variant="done">Completed</Badge>);
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("renders rendering status with pulsing dot", () => {
      const { container } = render(
        <Badge variant="rendering">Transcribing</Badge>
      );
      const dot = container.querySelector(".animate-pulse");
      expect(dot).toBeInTheDocument();
    });
  });

  describe("Tooltip Component", () => {
    it("shows content on hover and hides on mouse leave", async () => {
      vi.useFakeTimers();
      render(
        <Tooltip content="Help text" delayMs={50}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText("Hover me");
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(60);
      });

      expect(screen.getByRole("tooltip")).toHaveTextContent("Help text");

      fireEvent.mouseLeave(trigger);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe("Drawer Component", () => {
    it("renders when open and responds to close button and escape key", () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <Drawer
          isOpen={true}
          onClose={handleClose}
          title="Video Inspector"
          description="Detailed metadata"
        >
          <div>Inspector Panel Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Video Inspector")).toBeInTheDocument();
      expect(screen.getByText("Inspector Panel Content")).toBeInTheDocument();

      // Escape key closes drawer
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalled();

      // Does not render when isOpen is false
      rerender(
        <Drawer isOpen={false} onClose={handleClose} title="Video Inspector">
          <div>Content</div>
        </Drawer>
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Dialog Component", () => {
    it("renders confirmation dialog and triggers onConfirm", () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      render(
        <Dialog
          isOpen={true}
          onClose={handleClose}
          title="Delete Video?"
          description="This action cannot be undone."
          confirmText="Yes, delete"
          confirmVariant="danger"
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText("Delete Video?")).toBeInTheDocument();
      expect(
        screen.getByText("This action cannot be undone.")
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /yes, delete/i });
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("Kbd Component", () => {
    it("splits compound shortcut into key elements", () => {
      render(<Kbd shortcut="Cmd+K" />);
      expect(screen.getByText("⌘")).toBeInTheDocument();
      expect(screen.getByText("K")).toBeInTheDocument();
    });
  });

  describe("Tabs Component", () => {
    it("allows switching tabs and updates aria-selected", () => {
      const handleChange = vi.fn();
      const tabs = [
        { id: "overview", label: "Overview" },
        { id: "timeline", label: "Timeline" },
      ];

      render(
        <div>
          <Tabs tabs={tabs} activeTab="overview" onChange={handleChange} />
          <TabPanel id="overview" activeTab="overview">
            Overview Panel
          </TabPanel>
          <TabPanel id="timeline" activeTab="overview">
            Timeline Panel
          </TabPanel>
        </div>
      );

      const overviewTab = screen.getByRole("tab", { name: "Overview" });
      const timelineTab = screen.getByRole("tab", { name: "Timeline" });

      expect(overviewTab).toHaveAttribute("aria-selected", "true");
      expect(timelineTab).toHaveAttribute("aria-selected", "false");
      expect(screen.getByText("Overview Panel")).toBeInTheDocument();
      expect(screen.queryByText("Timeline Panel")).not.toBeInTheDocument();

      fireEvent.click(timelineTab);
      expect(handleChange).toHaveBeenCalledWith("timeline");
    });
  });

  describe("ProgressRing Component", () => {
    it("renders progress percentage and aria values", () => {
      render(<ProgressRing progress={65} showValue />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "65");
      expect(progressbar).toHaveAttribute("aria-valuemin", "0");
      expect(progressbar).toHaveAttribute("aria-valuemax", "100");
      expect(screen.getByText("65%")).toBeInTheDocument();
    });
  });

  describe("EmptyState Component", () => {
    it("renders icon, title, description, and triggers primary action", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          icon={Sparkles}
          title="No Videos Created"
          description="Start your first AI video creation project."
          actionText="Create Video"
          onAction={handleAction}
        />
      );

      expect(screen.getByText("No Videos Created")).toBeInTheDocument();
      expect(
        screen.getByText("Start your first AI video creation project.")
      ).toBeInTheDocument();

      const btn = screen.getByRole("button", { name: "Create Video" });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("Toast Notification System", () => {
    function TestConsumer() {
      const { success, error } = useToast();
      return (
        <div>
          <button onClick={() => success("Video Rendered", "Available in library")}>
            Trigger Success
          </button>
          <button onClick={() => error("Render Failed", "Insufficient credits")}>
            Trigger Error
          </button>
        </div>
      );
    }

    it("displays toast notification when triggered", () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Trigger Success"));
      expect(screen.getByText("Video Rendered")).toBeInTheDocument();
      expect(screen.getByText("Available in library")).toBeInTheDocument();
    });
  });
});
