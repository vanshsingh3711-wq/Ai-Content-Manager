import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  PathSelector,
  LivePreviewFrame,
  ScriptEditor,
  ConfigPanel,
  TemplateGallery,
  PRESET_TEMPLATES,
  ReviewSummary,
} from "../components/create";
import CreateWizardPage from "../app/dashboard/create/page.tsx";
import { ToastProvider } from "../components/ui";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

describe("Phase 4: Create Flow Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PathSelector Component", () => {
    it("renders all four creation paths and triggers selection callback", () => {
      const handleSelect = vi.fn();
      render(<PathSelector selectedPath="faceless" onSelect={handleSelect} />);

      expect(screen.getByText("Faceless AI Video")).toBeInTheDocument();
      expect(screen.getByText("Upload & Enhance Footage")).toBeInTheDocument();
      expect(screen.getByText("Viral Presets Gallery")).toBeInTheDocument();
      expect(screen.getByText("From Article or URL")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Upload & Enhance Footage"));
      expect(handleSelect).toHaveBeenCalledWith("upload");
    });
  });

  describe("LivePreviewFrame Component", () => {
    it("renders phone bezel with safe zones and calculated metrics", () => {
      render(
        <LivePreviewFrame
          aspectRatio="9:16"
          videoStyle="educational"
          captionPreset="tiktok_yellow"
          estimatedSeconds={45}
          sampleCaption="EVERY TWELVE YEAR OLD CAN MASTER THIS"
        />
      );

      expect(screen.getByText("Live Safe-Zone Preview")).toBeInTheDocument();
      expect(screen.getByText("~45s")).toBeInTheDocument();
      expect(screen.getByText("AI MOTION GRAPHICS")).toBeInTheDocument();
      expect(screen.getByText("SAFE DOCK")).toBeInTheDocument();
    });

    it("renders 16:9 monitor frame when landscape is selected", () => {
      render(
        <LivePreviewFrame
          aspectRatio="16:9"
          videoStyle="cinematic"
          captionPreset="modern_clean"
          estimatedSeconds={120}
        />
      );

      expect(screen.getByText("16:9 DESKTOP")).toBeInTheDocument();
      expect(screen.getByText("YOUTUBE SAFE")).toBeInTheDocument();
    });
  });

  describe("ScriptEditor Component", () => {
    it("computes word count, duration, and appends hook presets", () => {
      const handleTitleChange = vi.fn();
      const handleScriptChange = vi.fn();

      render(
        <ScriptEditor
          title="Feynman Short"
          onTitleChange={handleTitleChange}
          script="This is a test script with eight words total."
          onScriptChange={handleScriptChange}
        />
      );

      expect(screen.getByText(/9 words/)).toBeInTheDocument();
      expect(screen.getByText(/~5s audio/)).toBeInTheDocument();

      // Click a hook preset
      fireEvent.click(screen.getByText("Feynman Simplicity"));
      expect(handleScriptChange).toHaveBeenCalledWith(
        expect.stringContaining("If you can't explain this to a 12-year-old")
      );
    });
  });

  describe("ConfigPanel Component", () => {
    it("allows switching aspect ratios and toggling AI directing modules", () => {
      const handleRatioChange = vi.fn();
      const handleStyleChange = vi.fn();
      const handlePresetChange = vi.fn();
      const handleToggleAi = vi.fn();

      render(
        <ConfigPanel
          aspectRatio="9:16"
          onAspectRatioChange={handleRatioChange}
          videoStyle="educational"
          onVideoStyleChange={handleStyleChange}
          captionPreset="tiktok_yellow"
          onCaptionPresetChange={handlePresetChange}
          aiFeatures={{
            faceTracking: true,
            trimSilences: true,
            autoBroll: true,
            transitionSfx: true,
          }}
          onToggleAiFeature={handleToggleAi}
        />
      );

      // Select 16:9 Landscape
      fireEvent.click(screen.getByText("16:9 Landscape"));
      expect(handleRatioChange).toHaveBeenCalledWith("16:9");

      // Toggle silence trimming
      fireEvent.click(screen.getByText("Speech Silence Pruning"));
      expect(handleToggleAi).toHaveBeenCalledWith("trimSilences");
    });
  });

  describe("TemplateGallery Component", () => {
    it("renders pre-engineered templates and triggers selection", () => {
      const handleSelect = vi.fn();
      render(
        <TemplateGallery
          selectedTemplateId="feynman_short"
          onSelectTemplate={handleSelect}
        />
      );

      expect(screen.getByText("Educational Feynman Short")).toBeInTheDocument();
      expect(screen.getByText("Finance & Wealth Deep Dive")).toBeInTheDocument();
      expect(screen.getByText("High-Speed AI Tech Reel")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Finance & Wealth Deep Dive"));
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: "finance_explainer" })
      );
    });
  });

  describe("ReviewSummary Component", () => {
    it("displays configuration summary and triggers launch production", () => {
      const handleLaunch = vi.fn();
      const handleBack = vi.fn();

      render(
        <ReviewSummary
          title="Mastering Feynman"
          creationPath="faceless"
          aspectRatio="9:16"
          videoStyle="educational"
          captionPreset="tiktok_yellow"
          estimatedSeconds={42}
          wordCount={105}
          aiModulesCount={4}
          isGenerating={false}
          onLaunch={handleLaunch}
          onBack={handleBack}
        />
      );

      expect(screen.getByText("Mastering Feynman")).toBeInTheDocument();
      expect(screen.getByText("9:16")).toBeInTheDocument();
      expect(screen.getByText("educational")).toBeInTheDocument();
      expect(screen.getByText("4 Active")).toBeInTheDocument();

      const launchBtn = screen.getByRole("button", {
        name: /launch video production/i,
      });
      fireEvent.click(launchBtn);
      expect(handleLaunch).toHaveBeenCalledTimes(1);

      const backBtn = screen.getByRole("button", { name: /back to edit/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("CreateWizardPage Integration", () => {
    it("steps through wizard from path selection to configure and review", () => {
      render(
        <ToastProvider>
          <CreateWizardPage />
        </ToastProvider>
      );

      // Step 1: Path Selection
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /configure faceless video/i })
      ).toBeInTheDocument();

      // Proceed to Step 2
      fireEvent.click(
        screen.getByRole("button", { name: /configure faceless video/i })
      );
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      expect(screen.getByText("Live Safe-Zone Preview")).toBeInTheDocument();

      // Proceed to Step 3
      fireEvent.click(
        screen.getByRole("button", { name: /continue to review/i })
      );
      expect(screen.getAllByText(/Step 3 of 3/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Review Video Configuration")).toBeInTheDocument();
    });
  });
});
