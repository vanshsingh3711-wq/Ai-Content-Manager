import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GraphicCanvasRenderer } from "../components/editor/GraphicCanvasRenderer";
import { InspectorPanel } from "../components/editor/InspectorPanel";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { GraphicElement, TimelineProject } from "../lib/timeline-types";

describe("Finance Motion Graphics Pack — Phase 2 Tests", () => {
  const financeProject: TimelineProject = {
    id: "proj-finance-test",
    title: "Finance Video Project",
    aspectRatio: "9:16",
    duration: 60,
    fps: 30,
    tracks: {
      videoTrack: [],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [
        {
          id: "g-candle",
          name: "Candlestick Breakout",
          compositionId: "candlestick-hud",
          props: {
            symbol: "BTC / USD",
            timeframe: "4H BREAKOUT",
            startingPrice: 48000,
            endingPrice: 65000,
            percentageGain: "+35.4%",
            trend: "bullish",
            headline: "INSTITUTIONAL LIQUIDITY SURGE",
          },
          start: 0,
          end: 6,
          opacity: 100,
        },
        {
          id: "g-snowball",
          name: "Snowball Multiplier",
          compositionId: "compound-growth-curve",
          props: {
            title: "THE EXPONENTIAL SNOWBALL EFFECT",
            monthlyDeposit: "$500 / Month",
            annualRate: "10% S&P 500 Historical",
            terminalCompound: 1130240,
            terminalCash: 180000,
          },
          start: 6,
          end: 12,
          opacity: 100,
        },
        {
          id: "g-donut",
          name: "Ray Dalio Portfolio",
          compositionId: "portfolio-donut",
          props: {
            title: "ALL-WEATHER PORTFOLIO",
            subtitle: "RAY DALIO ALLOCATION BLUEPRINT",
            totalValuation: 250000,
          },
          start: 12,
          end: 18,
          opacity: 100,
        },
        {
          id: "g-burn",
          name: "Cash Burn Erosion",
          compositionId: "inflation-cash-burn",
          props: {
            initialCapital: 10000,
            terminalValue: 4980,
            averageInflation: "7.2% / Year",
            lossPercentage: "-50.2%",
          },
          start: 18,
          end: 24,
          opacity: 100,
        },
        {
          id: "g-push",
          name: "Dividend Push Alert",
          compositionId: "banking-notification",
          props: {
            headline: "Direct Deposit Received",
            source: "VOO Quarterly Dividend Payout • Vanguard",
            depositAmount: 4250,
            newNetWorth: 89450,
            badge: "100% PASSIVE CASHFLOW",
          },
          start: 24,
          end: 30,
          opacity: 100,
        },
        {
          id: "g-waterfall",
          name: "Budgeting Waterfall",
          compositionId: "budget-waterfall",
          props: {
            title: "THE 50 / 30 / 20 WATERFALL",
            monthlyIncome: "$5,000 Net Income",
          },
          start: 30,
          end: 36,
          opacity: 100,
        },
        {
          id: "g-debt",
          name: "Debt Payoff Avalanche",
          compositionId: "debt-payoff-tracker",
          props: {
            title: "THE DEBT AVALANCHE ACCELERATOR",
            totalDebt: "$35,400 TOTAL DEBT",
            freedCashflow: "+$650 / MO FREED",
          },
          start: 36,
          end: 42,
          opacity: 100,
        },
        {
          id: "g-scale",
          name: "ROI Opportunity Scale",
          compositionId: "roi-balance-scale",
          props: {
            title: "WEALTH WEIGHING SCALE",
            leftName: "New Financed SUV",
            rightName: "S&P 500 Index Fund",
          },
          start: 42,
          end: 48,
          opacity: 100,
        },
        {
          id: "g-flywheel",
          name: "Wealth vs Trap Flywheel",
          compositionId: "wealth-flywheel",
          props: {
            title: "EXPONENTIAL WEALTH FLYWHEEL",
            mode: "wealth",
          },
          start: 48,
          end: 54,
          opacity: 100,
        },
        {
          id: "g-battle",
          name: "Buffett Challenge Battle",
          compositionId: "battle-chart",
          props: {
            title: "10-YEAR RESULTS: THE VERDICT",
            subtitle: "BUFFETT $1,000,000 CHALLENGE",
            sp500Return: 126,
            hedgeReturn: 36,
            deltaLabel: "+90% S&P 500 ADVANTAGE",
          },
          start: 54,
          end: 60,
          opacity: 100,
        },
      ],
    },
    transitions: [],
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(financeProject);
  });

  describe("1. WYSIWYG Live Canvas Rendering", () => {
    it("renders candlestick trading HUD with dynamic SVG candles and moving average line", () => {
      const g = financeProject.tracks.graphicsTrack[0];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={2.0} />);

      expect(screen.getByTestId("graphic-candlestick-hud")).toBeDefined();
      expect(screen.getByText("BTC / USD")).toBeDefined();
      expect(screen.getByText("4H BREAKOUT")).toBeDefined();
      expect(screen.getByText("INSTITUTIONAL LIQUIDITY SURGE")).toBeDefined();
    });

    it("renders snowball compound growth curve with S&P 500 alpha comparison", () => {
      const g = financeProject.tracks.graphicsTrack[1];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={8.0} />);

      expect(screen.getByTestId("graphic-compound-growth-curve")).toBeDefined();
      expect(screen.getByText("THE EXPONENTIAL SNOWBALL EFFECT")).toBeDefined();
      expect(screen.getByText("+6.3x Net Alpha")).toBeDefined();
    });

    it("renders Dalio portfolio donut with 4 asset classes and valuation center", () => {
      const g = financeProject.tracks.graphicsTrack[2];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={14.0} />);

      expect(screen.getByTestId("graphic-portfolio-donut")).toBeDefined();
      expect(screen.getByText("ALL-WEATHER PORTFOLIO")).toBeDefined();
      expect(screen.getByText("S&P 500 Index")).toBeDefined();
      expect(screen.getByText("REIT Real Estate")).toBeDefined();
      expect(screen.getByText("Treasuries / Cash")).toBeDefined();
      expect(screen.getByText("Asymmetric Crypto")).toBeDefined();
    });

    it("renders inflation cash burn note with ember singe gradient and loss stamp", () => {
      const g = financeProject.tracks.graphicsTrack[3];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={20.0} />);

      expect(screen.getByTestId("graphic-inflation-cash-burn")).toBeDefined();
      expect(screen.getByText("THE SILENT CASH TAX")).toBeDefined();
      expect(screen.getByText("INFLATION SLAUGHTER")).toBeDefined();
    });

    it("renders fintech banking notification pill with count-up deposit amount", () => {
      const g = financeProject.tracks.graphicsTrack[4];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={26.0} />);

      expect(screen.getByTestId("graphic-banking-notification")).toBeDefined();
      expect(screen.getByText("Direct Deposit Received")).toBeDefined();
      expect(screen.getByText("VOO Quarterly Dividend Payout • Vanguard")).toBeDefined();
      expect(screen.getByText("$89,450")).toBeDefined();
    });

    it("renders 50/30/20 waterfall jars with needs, wants, and wealth allocations", () => {
      const g = financeProject.tracks.graphicsTrack[5];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={32.0} />);

      expect(screen.getByTestId("graphic-budget-waterfall")).toBeDefined();
      expect(screen.getByText("50% NEEDS")).toBeDefined();
      expect(screen.getByText("30% WANTS")).toBeDefined();
      expect(screen.getByText("20% WEALTH")).toBeDefined();
      expect(screen.getByText("$5,000 Net Income")).toBeDefined();
    });

    it("renders debt avalanche tracker with paid in full stamp and freed cashflow", () => {
      const g = financeProject.tracks.graphicsTrack[6];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={38.0} />);

      expect(screen.getByTestId("graphic-debt-payoff-tracker")).toBeDefined();
      expect(screen.getByText("PAID IN FULL")).toBeDefined();
      expect(screen.getByText("+$650 / MO FREED")).toBeDefined();
    });

    it("renders opportunity cost balance scale with liability vs compounding asset", () => {
      const g = financeProject.tracks.graphicsTrack[7];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={44.0} />);

      expect(screen.getByTestId("graphic-roi-balance-scale")).toBeDefined();
      expect(screen.getByText("New Financed SUV")).toBeDefined();
      expect(screen.getByText("S&P 500 Index Fund")).toBeDefined();
      expect(screen.getByText("NET ALPHA DELTA: +13.1x WEALTH")).toBeDefined();
    });

    it("renders wealth flywheel with virtuous loop cycle", () => {
      const g = financeProject.tracks.graphicsTrack[8];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={50.0} />);

      expect(screen.getByTestId("graphic-wealth-flywheel")).toBeDefined();
      expect(screen.getByText("VIRTUOUS CAPITAL CYCLE")).toBeDefined();
      expect(screen.getByText("➔ 4. Compounding Dividends ➔ 5. Freedom")).toBeDefined();
    });

    it("renders Warren Buffett vs hedge funds battle chart with alpha delta", () => {
      const g = financeProject.tracks.graphicsTrack[9];
      render(<GraphicCanvasRenderer graphic={g} playheadTime={56.0} />);

      expect(screen.getByTestId("graphic-battle-chart")).toBeDefined();
      expect(screen.getByText("10-YEAR RESULTS: THE VERDICT")).toBeDefined();
      expect(screen.getByText("BUFFETT $1,000,000 CHALLENGE")).toBeDefined();
      expect(screen.getByText("+90% S&P 500 ADVANTAGE")).toBeDefined();
    });
  });

  describe("2. InspectorPanel Live Finance Controls & Customization", () => {
    it("customizes Candlestick HUD symbol, starting price, and trend in InspectorPanel", () => {
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "g-candle" });

      render(<InspectorPanel />);

      expect(screen.getByText("Finance Graphic")).toBeInTheDocument();
      expect(screen.getByText("Finance Pro")).toBeInTheDocument();
      expect(screen.getByText("Trading HUD Controls")).toBeInTheDocument();

      // Change ticker symbol
      const symbolInput = screen.getByDisplayValue("BTC / USD");
      fireEvent.change(symbolInput, { target: { value: "ETH / USD" } });

      // Change starting price
      const startPriceInput = screen.getByDisplayValue("48000");
      fireEvent.change(startPriceInput, { target: { value: "3200" } });

      const updated = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === "g-candle");

      expect(updated?.props?.symbol).toBe("ETH / USD");
      expect(updated?.props?.startingPrice).toBe(3200);
    });

    it("customizes Compound Growth Curve monthly deposit and terminal wealth in InspectorPanel", () => {
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "g-snowball" });

      render(<InspectorPanel />);

      expect(screen.getByText("Snowball Multiplier Controls")).toBeInTheDocument();

      const depositInput = screen.getByDisplayValue("$500 / Month");
      fireEvent.change(depositInput, { target: { value: "$1,000 / Month" } });

      const updated = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === "g-snowball");

      expect(updated?.props?.monthlyDeposit).toBe("$1,000 / Month");
    });

    it("customizes Inflation Cash-Burn initial capital and inflation drag in InspectorPanel", () => {
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "g-burn" });

      render(<InspectorPanel />);

      expect(screen.getByText("Cash-Burn Controls")).toBeInTheDocument();

      const inflationInput = screen.getByDisplayValue("7.2% / Year");
      fireEvent.change(inflationInput, { target: { value: "9.1% / Year" } });

      const updated = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === "g-burn");

      expect(updated?.props?.averageInflation).toBe("9.1% / Year");
    });

    it("customizes Banking Push Notification headline and deposit amount in InspectorPanel", () => {
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "g-push" });

      render(<InspectorPanel />);

      expect(screen.getByText("Deposit Alert Controls")).toBeInTheDocument();

      const depositInput = screen.getByDisplayValue("4250");
      fireEvent.change(depositInput, { target: { value: "6500" } });

      const updated = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === "g-push");

      expect(updated?.props?.depositAmount).toBe(6500);
    });

    it("customizes Wealth Flywheel mode to vicious trap in InspectorPanel", () => {
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "g-flywheel" });

      render(<InspectorPanel />);

      expect(screen.getByText("Flywheel Controls")).toBeInTheDocument();

      const modeSelect = screen.getByDisplayValue("Virtuous Wealth Cycle (Green)");
      fireEvent.change(modeSelect, { target: { value: "trap" } });

      const updated = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === "g-flywheel");

      expect(updated?.props?.mode).toBe("trap");
    });

    it("customizes Battle Chart Warren Buffett returns and challenge delta in InspectorPanel", () => {
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "g-battle" });

      render(<InspectorPanel />);

      expect(screen.getByText("Battle Chart Controls")).toBeInTheDocument();

      const sp500Input = screen.getByDisplayValue("126");
      fireEvent.change(sp500Input, { target: { value: "140" } });

      const updated = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === "g-battle");

      expect(updated?.props?.sp500Return).toBe(140);
    });
  });
});
