/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Cpu, Network, Code, BookOpen, Zap, Smartphone, ShieldAlert } from "lucide-react";
import { useAuraContext } from "../store/AuraContext";

export const Header: React.FC = () => {
  const { activeTab, setActiveTab } = useAuraContext();

  return (
    <header className="border-b border-slate-900 bg-[#0A0D1A]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center">
          <Cpu className="text-white w-5 h-5 animate-pulse" id="aura-nexus-logo" />
        </div>
        <div>
          <h1 className="text-white font-bold tracking-tight text-lg flex items-center gap-2">
            AuraNexus <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">RUST CORE PROTOCOL</span>
          </h1>
          <p className="text-xs text-slate-500">Autonomous Tensor Train Engine • Forward-Only Hinton FFA</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-900 overflow-x-auto max-w-full scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab("visualizer")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "visualizer"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Core Visualizer Loop
        </button>
        <button
          onClick={() => setActiveTab("rust-code")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "rust-code"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Rust Kernel Source
        </button>
        <button
          onClick={() => setActiveTab("math-guide")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "math-guide"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Theoretical Treatise
        </button>
        <button
          onClick={() => setActiveTab("memory-cache")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "memory-cache"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          L3 Cache & Arena Memory
        </button>
        <button
          onClick={() => setActiveTab("network-stream")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "network-stream"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Zero-Storage Streaming & Filter
        </button>
        <button
          onClick={() => setActiveTab("android-pacing")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "android-pacing"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Android NDK & Thermal Pacing
        </button>
        <button
          onClick={() => setActiveTab("hardware-acceleration")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "hardware-acceleration"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Vulkan GPU & NPU Acceleration
        </button>
        <button
          onClick={() => setActiveTab("android-ui-export")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "android-ui-export"
              ? "bg-[#11162B] text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          Compose UI & Exporter (TS №6)
        </button>
        <button
          onClick={() => setActiveTab("stability-precision")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === "stability-precision"
              ? "bg-[#11162B] text-emerald-400 shadow-sm animate-pulse"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
          Stability & Precision (TS №7)
        </button>
      </div>
    </header>
  );
};
