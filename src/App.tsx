/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Header } from "./components/Header";
import { VisualizerTab } from "./components/VisualizerTab";
import { RustCodeTab } from "./components/RustCodeTab";
import { MathGuideTab } from "./components/MathGuideTab";
import { MemoryCacheTab } from "./components/MemoryCacheTab";
import { NetworkStreamTab } from "./components/NetworkStreamTab";
import { AndroidPacingTab } from "./components/AndroidPacingTab";
import { HardwareAccelerationTab } from "./components/HardwareAccelerationTab";
import { AndroidUiExportTab } from "./components/AndroidUiExportTab";
import { StabilityPrecisionTab } from "./components/StabilityPrecisionTab";
import { MemorySafetyBenchmarkingTab } from "./components/MemorySafetyBenchmarkingTab";
import { useAuraContext } from "./store/AuraContext";
import { AnimatePresence } from "motion/react";

const App: React.FC = () => {
  const { activeTab } = useAuraContext();

  const renderActiveTab = () => {
    switch (activeTab) {
      case "visualizer":
        return <VisualizerTab />;
      case "rust-code":
        return <RustCodeTab />;
      case "math-guide":
        return <MathGuideTab />;
      case "memory-cache":
        return <MemoryCacheTab />;
      case "network-stream":
        return <NetworkStreamTab />;
      case "android-pacing":
        return <AndroidPacingTab />;
      case "hardware-acceleration":
        return <HardwareAccelerationTab />;
      case "android-ui-export":
        return <AndroidUiExportTab />;
      case "stability-precision":
        return <StabilityPrecisionTab />;
      case "memory-safety-benchmarking":
        return <MemorySafetyBenchmarkingTab />;
      default:
        return <VisualizerTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050714] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* ================= HEADER ================= */}
      <Header />

      {/* ================= MAIN MATRIX CONTENT ================= */}
      <main className="flex-grow p-6 grid grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {renderActiveTab()}
        </AnimatePresence>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-950 bg-[#04060E] py-4 px-6 text-center text-[10px] text-slate-600 font-mono flex flex-col md:flex-row items-center justify-between gap-2">
        <span>AURANEXUS MATH CORE PROTOCOL • PRODUCED UNDER SPECIFICATION FOR ANDROID TARGETS</span>
        <span>UTC SYSTEM TIME: 2026-06-04 • PLATFORM CONTAINED IN CLOUD INGRESS LAYER</span>
      </footer>
    </div>
  );
};

export default App;
