import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  RESOURCE_CATALOG,
  createOperationFromResource,
} from "../lib/library/resource-registry";
import { GraphicCanvasRenderer } from "../components/editor/GraphicCanvasRenderer";
import { InspectorPanel } from "../components/editor/InspectorPanel";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { EditorContext } from "../lib/ai/editor-context";
import { GraphicElement, TimelineProject } from "../lib/timeline-types";

describe("Customizable Motion Graphics Templates & Inspector Suite", () => {
  beforeEach(() => {
    useTimelineStore.setState({
      selectedItem: null,
      playheadTime: 0,
    });
  });

  describe("1. Resource Catalog Motion Graphics Registration", () => {
    const requiredTemplates = [
      { id: "mg-chart-reveal", compId: "chart-reveal", name: "Rising Growth Chart" },
      { id: "mg-animated-counter", compId: "animated_counter", name: "Animated Counter" },
      { id: "mg-animated-kpi", compId: "animated_kpi", name: "Animated KPI Card" },
      { id: "mg-hero-reveal", compId: "hero_reveal", name: "Hero Reveal Headline" },
      { id: "mg-lower-third", compId: "lower-third", name: "Modern Lower Third" },
      { id: "mg-subscribe-badge", compId: "subscribe-badge", name: "Subscribe & Bell Callout" },
      { id: "mg-before-after", compId: "before-after", name: "Before & After Split" },
      { id: "mg-countdown-timer", compId: "countdown-timer", name: "Countdown Timer Widget" },
      { id: "mg-review-card", compId: "review-card", name: "5-Star Review Card" },
      { id: "mg-social-handles", compId: "social-handles", name: "Social Handles Badge" },
      { id: "mg-progress-bar", compId: "cooked-progress", name: "Completion Progress Bar" },
      { id: "mg-social-post", compId: "cooked-social-post", name: "Viral Tweet / Social Card" },
      { id: "mg-quote-reveal", compId: "quote-reveal", name: "Cinematic Quote Card" },
      { id: "mg-notes-checklist", compId: "cooked-notes", name: "Action Items Checklist" },
      { id: "mg-app-screen-upload", compId: "app-screen-upload", name: "App Screen Video Upload" },
      { id: "mg-animated-arrow", compId: "animated-arrow", name: "Directional Attention Pointer" },
      { id: "mg-pop-up-badge", compId: "pop-up-badge", name: "Callout Pill Badge" },
      { id: "mg-kinetic-text", compId: "kinetic-text", name: "Kinetic Headline Stagger" },
      { id: "mg-icon-reveal", compId: "icon-reveal", name: "Glowing Concept Icon" },
      { id: "mg-cooked-chat", compId: "cooked-chat", name: "Direct Message Dialogue" },
      { id: "mg-cooked-flow", compId: "cooked-flow", name: "Connected Workflow Pipeline" },
    ];

    it.each(requiredTemplates)(
      "registers $name ($id) with valid parameters and defaults",
      ({ id, compId, name }) => {
        const item = RESOURCE_CATALOG.find((r) => r.id === id);
        expect(item).toBeDefined();
        expect(item?.type).toBe("motion_graphic");
        expect(item?.name).toBe(name);
        expect(item?.defaultProps?.compositionId).toBe(compId);
        expect(item?.parameters).toBeDefined();
        expect(item?.parameters?.length).toBeGreaterThan(0);
        // Ensure every motion graphic defines accentColor
        const hasColor =
          item?.parameters?.some((p) => p.name === "accentColor" || p.name === "buttonColor" || p.name === "fillColor") ||
          item?.defaultProps?.accentColor;
        expect(hasColor).toBeTruthy();
      }
    );

    it("creates add_element operation with resourceId attached", () => {
      const lowerThirdRes = RESOURCE_CATALOG.find((r) => r.id === "mg-lower-third");
      expect(lowerThirdRes).toBeDefined();

      const result = createOperationFromResource(lowerThirdRes!, {
        timestamp: 2.0,
        duration: 4.0,
      });

      expect(result.success).toBe(true);
      expect(result.operation?.type).toBe("add_element");
      if (result.operation && result.operation.type === "add_element") {
        expect(result.operation.track).toBe("graphic");
        expect(result.operation.element.compositionId).toBe("lower-third");
        expect((result.operation.element.props as any)?.resourceId).toBe("mg-lower-third");
        expect((result.operation.element.props as any)?.name).toBe("Alex Rivera");
      }
    });
  });

  describe("2. GraphicCanvasRenderer Custom Live Rendering", () => {
    it("renders custom lower third with speaker name, job title, and social handle", () => {
      const mockLowerThird: GraphicElement = {
        id: "lt-1",
        name: "Modern Lower Third",
        compositionId: "lower-third",
        props: {
          name: "Dr. Evelyn Reed",
          title: "Quantum AI Researcher",
          handle: "@evelyn_quantum",
          accentColor: "#06b6d4",
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockLowerThird} playheadTime={1.0} />);

      expect(screen.getByText("Dr. Evelyn Reed")).toBeInTheDocument();
      expect(screen.getByText("Quantum AI Researcher")).toBeInTheDocument();
      expect(screen.getByText("@evelyn_quantum")).toBeInTheDocument();
    });

    it("renders custom subscribe badge with channel name, sub count, and button text", () => {
      const mockSubscribe: GraphicElement = {
        id: "sub-1",
        name: "Subscribe & Bell Callout",
        compositionId: "subscribe-badge",
        props: {
          channelName: "Tech Insider",
          subCount: "3.4M",
          buttonText: "JOIN NOW",
          buttonColor: "#2563eb",
          showBell: true,
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockSubscribe} playheadTime={1.0} />);

      expect(screen.getByText("Tech Insider")).toBeInTheDocument();
      expect(screen.getByText("3.4M subscribers")).toBeInTheDocument();
      expect(screen.getByText("JOIN NOW")).toBeInTheDocument();
      expect(screen.getByText("🔔")).toBeInTheDocument();
    });

    it("renders custom before & after split card with contrasting items", () => {
      const mockBeforeAfter: GraphicElement = {
        id: "ba-1",
        name: "Before & After Split",
        compositionId: "before-after",
        props: {
          beforeLabel: "LEGACY METHOD",
          beforeText: "Manual frame-by-frame cuts",
          afterLabel: "AI ACCELERATED",
          afterText: "One-click automated rendering",
          accentColor: "#10b981",
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockBeforeAfter} playheadTime={1.0} />);

      expect(screen.getByText("✕ LEGACY METHOD")).toBeInTheDocument();
      expect(screen.getByText("Manual frame-by-frame cuts")).toBeInTheDocument();
      expect(screen.getByText("✓ AI ACCELERATED")).toBeInTheDocument();
      expect(screen.getByText("One-click automated rendering")).toBeInTheDocument();
    });

    it("renders custom countdown timer widget with remaining seconds and custom label", () => {
      const mockTimer: GraphicElement = {
        id: "timer-1",
        name: "Countdown Timer Widget",
        compositionId: "countdown-timer",
        props: {
          seconds: 10,
          label: "FLASH SALE ENDS",
          accentColor: "#f43f5e",
        },
        start: 0,
        end: 10,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockTimer} playheadTime={3.0} />);

      expect(screen.getByText("FLASH SALE ENDS")).toBeInTheDocument();
      // At playhead 3s of 10s -> 7s remaining
      expect(screen.getByText("0:07")).toBeInTheDocument();
      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });

    it("renders custom 5-star review card with reviewer name, badge, and quote", () => {
      const mockReview: GraphicElement = {
        id: "rev-1",
        name: "5-Star Review Card",
        compositionId: "review-card",
        props: {
          author: "Marcus Vance",
          role: "Top 1% Creator",
          rating: 5,
          review: "This motion graphic suite completely leveled up our videos!",
          accentColor: "#fbbf24",
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockReview} playheadTime={1.0} />);

      expect(screen.getByText("Marcus Vance")).toBeInTheDocument();
      expect(screen.getByText("Top 1% Creator")).toBeInTheDocument();
      expect(screen.getByText(/This motion graphic suite completely leveled up our videos!/i)).toBeInTheDocument();
    });

    it("renders custom social handles badge with platform icon and custom handle", () => {
      const mockHandles: GraphicElement = {
        id: "sh-1",
        name: "Social Handles Badge",
        compositionId: "social-handles",
        props: {
          platform: "tiktok",
          handle: "@daily_tok_tips",
          actionText: "Tap link in bio",
          accentColor: "#00f2fe",
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockHandles} playheadTime={1.0} />);

      expect(screen.getByText("@daily_tok_tips")).toBeInTheDocument();
      expect(screen.getByText("Tap link in bio")).toBeInTheDocument();
      expect(screen.getByText("🎵")).toBeInTheDocument();
    });

    it("renders custom chat dialogue with custom sender and messages", () => {
      const mockChat: GraphicElement = {
        id: "chat-1",
        name: "Direct Message Dialogue",
        compositionId: "cooked-chat",
        props: {
          sender: "Jordan",
          message1: "Are the motion graphics fully customizable?",
          message2: "100%! User can edit text, colors, movement, and layout.",
          accentColor: "#38bdf8",
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockChat} playheadTime={1.0} />);

      expect(screen.getByText("Jordan", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("Are the motion graphics fully customizable?")).toBeInTheDocument();
      expect(screen.getByText("100%! User can edit text, colors, movement, and layout.")).toBeInTheDocument();
    });

    it("renders custom workflow flow with custom pipeline steps and accentColor", () => {
      const mockFlow: GraphicElement = {
        id: "flow-1",
        name: "Connected Workflow Pipeline",
        compositionId: "cooked-flow",
        props: {
          title: "AI AUTOMATION ENGINE",
          step1: "1. Upload Raw Clip",
          step2: "2. Generate B-Roll & Graphics",
          step3: "3. Export Master 4K",
          accentColor: "#10b981",
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockFlow} playheadTime={1.0} />);

      expect(screen.getByText("AI AUTOMATION ENGINE")).toBeInTheDocument();
      expect(screen.getByText("1. Upload Raw Clip")).toBeInTheDocument();
      expect(screen.getByText("2. Generate B-Roll & Graphics")).toBeInTheDocument();
      expect(screen.getByText("3. Export Master 4K")).toBeInTheDocument();
    });

    it("renders custom app screen upload with custom app name, filename, and fileType", () => {
      const mockUpload: GraphicElement = {
        id: "upload-1",
        name: "App Screen Video Upload",
        compositionId: "app-screen-upload",
        props: {
          appName: "Motion Studio Pro",
          title: "CLOUD UPLOAD",
          fileName: "cinematic_trailer_v2.mp4",
          fileType: "ProRes 422",
          fileSize: "128.4 MB",
          status: "Cloud Sync Ready",
          progress: 100,
          accentColor: "#a855f7",
        },
        start: 0,
        end: 5,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockUpload} playheadTime={4.0} />);

      expect(screen.getByText("Motion Studio Pro")).toBeInTheDocument();
      expect(screen.getByText("CLOUD UPLOAD")).toBeInTheDocument();
      expect(screen.getByText("cinematic_trailer_v2.mp4")).toBeInTheDocument();
      expect(screen.getByText("ProRes 422")).toBeInTheDocument();
      expect(screen.getByText("Cloud Sync Ready")).toBeInTheDocument();
    });

    it("renders vector speech bubble with custom text and tail position", () => {
      const mockBubble: GraphicElement = {
        id: "bubble-1",
        name: "Speech Bubble",
        compositionId: "shape",
        props: {
          shapeType: "speech_bubble",
          text: "Wait until you see this transition!",
          fillColor: "#18181b",
          strokeColor: "#38bdf8",
        },
        start: 0,
        end: 4,
        opacity: 100,
      };

      render(<GraphicCanvasRenderer graphic={mockBubble} playheadTime={1.0} />);

      expect(screen.getByText("Wait until you see this transition!")).toBeInTheDocument();
    });
  });

  describe("3. InspectorPanel Live Customization Engine", () => {
    const testProject: TimelineProject = {
      id: "proj-motion-test",
      title: "Motion Test Project",
      aspectRatio: "9:16",
      duration: 30,
      fps: 30,
      tracks: {
        videoTrack: [],
        brollTrack: [],
        textTrack: [],
        audioTrack: [],
        graphicsTrack: [
          {
            id: "mg-active-1",
            name: "Modern Lower Third",
            compositionId: "lower-third",
            props: {
              resourceId: "mg-lower-third",
              name: "Original Name",
              title: "Original Title",
              handle: "@original",
              accentColor: "#38bdf8",
            },
            start: 1.0,
            end: 5.0,
            opacity: 100,
          },
          {
            id: "mg-active-timer",
            name: "Countdown Timer Widget",
            compositionId: "countdown-timer",
            props: {
              resourceId: "mg-countdown-timer",
              seconds: 5,
              label: "TIME REMAINING",
              accentColor: "#f59e0b",
            },
            start: 2.0,
            end: 7.0,
            opacity: 100,
          },
          {
            id: "mg-active-chart",
            name: "Rising Growth Chart",
            compositionId: "chart-reveal",
            props: {
              resourceId: "mg-chart-reveal",
              title: "GROWTH TREND",
              badgeText: "SURGE +165%",
              dataPoint1: "Stage 1: Baseline",
              val1: "1.0x",
              dataPoint2: "Stage 2: +85%",
              val2: "1.85x",
              dataPoint3: "Stage 3: +165% Surge",
              val3: "2.65x 🔥",
              accentColor: "#22d3ee",
            },
            position: { x: 50, y: 50 },
            scale: 1.0,
            rotation: 0,
            start: 0.0,
            end: 4.0,
            opacity: 100,
          },
          {
            id: "mg-active-chat",
            name: "Direct Message Dialogue",
            compositionId: "cooked-chat",
            props: {
              resourceId: "mg-cooked-chat",
              sender: "Alex",
              message1: "Did you test the new motion graphics?",
              message2: "Yes, they look absolutely insane! 🔥",
              accentColor: "#0284c7",
            },
            start: 0.0,
            end: 4.0,
            opacity: 100,
          },
          {
            id: "mg-active-flow",
            name: "Connected Workflow Pipeline",
            compositionId: "cooked-flow",
            props: {
              resourceId: "mg-cooked-flow",
              title: "WORKFLOW PIPELINE",
              step1: "1. Ingest Video",
              step2: "2. AI Auto-Edit",
              step3: "3. 4K Export",
              accentColor: "#10b981",
            },
            start: 0.0,
            end: 4.5,
            opacity: 100,
          },
          {
            id: "mg-active-upload",
            name: "App Screen Video Upload",
            compositionId: "app-screen-upload",
            props: {
              resourceId: "mg-app-screen-upload",
              appName: "Video Studio Pro",
              title: "VIDEO UPLOAD",
              fileName: "production_export.mp4",
              fileSize: "48.2 MB",
              fileType: "MP4 Video",
              status: "Upload Complete",
              accentColor: "#38bdf8",
            },
            start: 0.0,
            end: 5.0,
            opacity: 100,
          },
          {
            id: "mg-active-shape",
            name: "Speech Bubble",
            compositionId: "shape",
            props: {
              shapeType: "speech_bubble",
              text: "Original Bubble Text",
              fillColor: "#18181b",
              strokeColor: "#38bdf8",
              strokeWidth: 3,
            },
            start: 0.0,
            end: 4.0,
            opacity: 100,
          },
        ],
      },
      transitions: [],
    };

    it("allows user to customize Lower Third name, title, and social handle in InspectorPanel", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-1" });

      render(<InspectorPanel />);

      expect(screen.getByText("Motion Graphic")).toBeInTheDocument();
      expect(screen.getByText("Template Content")).toBeInTheDocument();
      expect(screen.getByText("Speaker / Host Name")).toBeInTheDocument();

      const nameInput = screen.getByDisplayValue("Original Name");
      fireEvent.change(nameInput, { target: { value: "Samantha Hayes" } });

      const updatedGraphic = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-1"
      );

      expect(updatedGraphic?.props?.name).toBe("Samantha Hayes");

      const titleInput = screen.getByDisplayValue("Original Title");
      fireEvent.change(titleInput, { target: { value: "Head of AI Design" } });

      const updatedTitleGraphic = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-1"
      );

      expect(updatedTitleGraphic?.props?.title).toBe("Head of AI Design");
    });

    it("allows user to customize Countdown Timer seconds and label in InspectorPanel", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-timer" });

      render(<InspectorPanel />);

      expect(screen.getByText("Countdown Seconds")).toBeInTheDocument();
      expect(screen.getByDisplayValue("TIME REMAINING")).toBeInTheDocument();

      // Change label
      const labelInput = screen.getByDisplayValue("TIME REMAINING");
      fireEvent.change(labelInput, { target: { value: "OFFER CLOSES IN" } });

      const updatedGraphic = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-timer"
      );

      expect(updatedGraphic?.props?.label).toBe("OFFER CLOSES IN");
    });

    it("allows user to customize Rising Growth Chart title, surge badge, milestones, multipliers, and accent color", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-chart" });

      render(<InspectorPanel />);

      expect(screen.getByText("Growth Milestones & Multipliers")).toBeInTheDocument();
      expect(screen.getByDisplayValue("GROWTH TREND")).toBeInTheDocument();
      expect(screen.getByDisplayValue("SURGE +165%")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Stage 1: Baseline")).toBeInTheDocument();
      expect(screen.getByDisplayValue("1.0x")).toBeInTheDocument();

      // 1. Edit Title
      fireEvent.change(screen.getByDisplayValue("GROWTH TREND"), {
        target: { value: "Q3 REVENUE SURGE" },
      });

      // 2. Edit Surge Badge
      fireEvent.change(screen.getByDisplayValue("SURGE +165%"), {
        target: { value: "ALL TIME HIGH +250%" },
      });

      // 3. Edit Stage 3 Label and Multiplier
      fireEvent.change(screen.getByDisplayValue("Stage 3: +165% Surge"), {
        target: { value: "Stage 3: Hyper-Growth" },
      });
      fireEvent.change(screen.getByDisplayValue("2.65x 🔥"), {
        target: { value: "3.5x 🚀" },
      });

      // 4. Click Emerald Color Chip
      const emeraldChip = screen.getByTitle("Emerald");
      fireEvent.click(emeraldChip);

      const updatedChart = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-chart"
      );

      expect(updatedChart?.props?.title).toBe("Q3 REVENUE SURGE");
      expect(updatedChart?.props?.badgeText).toBe("ALL TIME HIGH +250%");
      expect(updatedChart?.props?.dataPoint3).toBe("Stage 3: Hyper-Growth");
      expect(updatedChart?.props?.val3).toBe("3.5x 🚀");
      expect(updatedChart?.props?.accentColor).toBe("#10b981");
    });

    it("allows user to quickly snap position to presets and reset transform", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-chart" });

      render(<InspectorPanel />);

      // Click "Lower Third" preset button
      const lowerThirdBtn = screen.getByRole("button", { name: /Lower Third/i });
      fireEvent.click(lowerThirdBtn);

      let chart = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-chart"
      );
      expect(chart?.position?.x).toBe(50);
      expect(chart?.position?.y).toBe(80);

      // Click "Reset" button
      const resetBtn = screen.getByRole("button", { name: /Reset/i });
      fireEvent.click(resetBtn);

      chart = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-chart"
      );
      expect(chart?.position?.x).toBe(50);
      expect(chart?.position?.y).toBe(50);
      expect(chart?.scale).toBe(1.0);
      expect(chart?.rotation).toBe(0);
    });

    it("allows user to duplicate and delete graphics from the InspectorPanel", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-chart" });

      render(<InspectorPanel />);

      const initialLen = (useTimelineStore.getState().project.tracks.graphicsTrack || []).length;

      // Duplicate Graphic
      const duplicateBtn = screen.getByRole("button", { name: /Duplicate/i });
      fireEvent.click(duplicateBtn);

      const graphics = useTimelineStore.getState().project.tracks.graphicsTrack || [];
      expect(graphics.length).toBe(initialLen + 1);
      const cloned = graphics[graphics.length - 1];
      expect(cloned.compositionId).toBe("chart-reveal");
      expect(cloned.start).toBe(4.0); // original ended at 4.0

      // The cloned graphic is now selected in the InspectorPanel. Click Delete Graphic to remove it.
      const deleteBtn = screen.getByRole("button", { name: /Delete Graphic/i });
      fireEvent.click(deleteBtn);

      const afterDeleteGraphics = useTimelineStore.getState().project.tracks.graphicsTrack || [];
      expect(afterDeleteGraphics.length).toBe(initialLen);
      expect(afterDeleteGraphics.find((g) => g.id === cloned.id)).toBeUndefined();
    });

    it("allows user to customize Direct Message dialogue sender and messages in InspectorPanel", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-chat" });

      render(<InspectorPanel />);

      expect(screen.getByText("Direct Message Conversation")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Alex")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Did you test the new motion graphics?")).toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue("Alex"), { target: { value: "Taylor" } });
      fireEvent.change(screen.getByDisplayValue("Did you test the new motion graphics?"), {
        target: { value: "Can we customize colors and layout?" },
      });

      const updated = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-chat"
      );

      expect(updated?.props?.sender).toBe("Taylor");
      expect(updated?.props?.message1).toBe("Can we customize colors and layout?");
    });

    it("allows user to customize Connected Workflow Pipeline header and steps in InspectorPanel", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-flow" });

      render(<InspectorPanel />);

      expect(screen.getByText("Pipeline Steps Sequence")).toBeInTheDocument();
      expect(screen.getByDisplayValue("WORKFLOW PIPELINE")).toBeInTheDocument();
      expect(screen.getByDisplayValue("1. Ingest Video")).toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue("WORKFLOW PIPELINE"), {
        target: { value: "AUTOMATED EDITING ENGINE" },
      });
      fireEvent.change(screen.getByDisplayValue("1. Ingest Video"), {
        target: { value: "1. AI Content Ingestion" },
      });

      const updated = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-flow"
      );

      expect(updated?.props?.title).toBe("AUTOMATED EDITING ENGINE");
      expect(updated?.props?.step1).toBe("1. AI Content Ingestion");
    });

    it("allows user to customize App Screen Video Upload app name, filename, and fileType in InspectorPanel", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-upload" });

      render(<InspectorPanel />);

      expect(screen.getByText("App Screen Metadata")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Video Studio Pro")).toBeInTheDocument();
      expect(screen.getByDisplayValue("production_export.mp4")).toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue("Video Studio Pro"), {
        target: { value: "NextGen Editor 2026" },
      });
      fireEvent.change(screen.getByDisplayValue("production_export.mp4"), {
        target: { value: "final_cut_master.mp4" },
      });

      const updated = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-upload"
      );

      expect(updated?.props?.appName).toBe("NextGen Editor 2026");
      expect(updated?.props?.fileName).toBe("final_cut_master.mp4");
    });

    it("allows user to customize Vector Shape geometry, fill color, and border width in InspectorPanel", () => {
      useTimelineStore.getState().initProject(testProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-active-shape" });

      render(<InspectorPanel />);

      expect(screen.getByText("Vector Shape Geometry")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Original Bubble Text")).toBeInTheDocument();

      // Change text
      fireEvent.change(screen.getByDisplayValue("Original Bubble Text"), {
        target: { value: "Updated Bubble Dialogue" },
      });

      // Change shape type
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "badge" } });

      const updated = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-active-shape"
      );

      expect(updated?.props?.text).toBe("Updated Bubble Dialogue");
      expect(updated?.props?.shapeType).toBe("badge");
    });
  });

  describe("4. Local Command Parser for Motion Graphics", () => {
    const mockContext: EditorContext = {
      projectId: "p1",
      projectTitle: "Test",
      playheadTime: 2.0,
      duration: 30.0,
      aspectRatio: "9:16",
      fps: 30,
      selectedItem: null,
      activeElements: { activeVideo: null, activeBroll: null, activeCaption: null, activeGraphic: null },
      trackSummary: { videoCount: 0, brollCount: 0, captionCount: 0, graphicCount: 0, audioCount: 0, captionsList: [], graphicsList: [] },
      constraints: [],
      safeZones: [],
      transcriptWords: [],
      scriptBeats: [],
    };

    it("parses 'add lower third for Elena Rostova' with custom speaker name and lower positioning", () => {
      const res = parseLocalCommand("add lower third for Elena Rostova", mockContext);
      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");

      if (res.operation && res.operation.type === "add_element") {
        expect(res.operation.track).toBe("graphic");
        expect(res.operation.element.compositionId).toBe("lower-third");
        expect((res.operation.element.props as any)?.name).toBe("Elena Rostova");
        expect((res.operation.element.position as any)?.y).toBe(82);
      }
    });

    it("parses 'add subscribe badge' with custom position and timing", () => {
      const res = parseLocalCommand("add subscribe badge from 5s to 9s", mockContext);
      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");

      if (res.operation && res.operation.type === "add_element") {
        expect(res.operation.track).toBe("graphic");
        expect(res.operation.element.compositionId).toBe("subscribe-badge");
        expect(res.operation.element.start).toBe(5);
        expect(res.operation.element.end).toBe(9);
      }
    });

    it("parses 'add countdown timer with 10 seconds'", () => {
      const res = parseLocalCommand("add countdown timer with 10 seconds", mockContext);
      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");

      if (res.operation && res.operation.type === "add_element") {
        expect(res.operation.track).toBe("graphic");
        expect(res.operation.element.compositionId).toBe("countdown-timer");
        expect((res.operation.element.props as any)?.seconds).toBe(10);
      }
    });

    it("parses 'add 5 star review card'", () => {
      const res = parseLocalCommand("add 5 star review card", mockContext);
      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");

      if (res.operation && res.operation.type === "add_element") {
        expect(res.operation.track).toBe("graphic");
        expect(res.operation.element.compositionId).toBe("review-card");
        expect((res.operation.element.props as any)?.rating).toBe(5);
      }
    });
  });
});
