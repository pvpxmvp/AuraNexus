/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Thermometer, Activity, Smartphone, Trash2, Code } from "lucide-react";
import { motion } from "motion/react";
import { useAuraContext } from "../store/AuraContext";
import { useThermalMonitor } from "../hooks/useThermalMonitor";

export const AndroidPacingTab: React.FC = () => {
  const {
    pacingStatus,
    pacingDelay,
    pacingIterationHz,
    androidLifecycle,
    setAndroidLifecycle,
    activeModelPtr,
    setActiveModelPtr,
    ramWeightsCached,
    setRamWeightsCached,
    cachedWeightsSize,
    setCachedWeightsSize,
    setCpuTemp,
    setAutoHeatEnabled,
    autoHeatEnabled,
    ndkLogs,
    setNdkLogs
  } = useAuraContext();

  const { cpuTemp, tempHistory } = useThermalMonitor();
  const [selectedPacingCodeFile, setSelectedPacingCodeFile] = useState<string>("aura-jni.cpp");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="col-span-12 space-y-6 text-[#A0AEC0]"
    >
      {/* Dynamic Status Badges row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block">CPU/GPU TEMPERATURE</span>
          <div className="text-xl font-bold font-mono mt-1 flex items-baseline gap-1.5">
            <span className={cpuTemp > 42.0 ? "text-rose-500 font-extrabold" : cpuTemp >= 38.0 ? "text-amber-500" : "text-emerald-400"}>
              {cpuTemp.toFixed(1)}°C
            </span>
            <span className="text-[10px] text-slate-500">Device Target</span>
          </div>
          <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1">
            <Thermometer className={`w-3.5 h-3.5 ${cpuTemp > 42.0 ? "text-rose-500 animate-bounce" : cpuTemp >= 38.0 ? "text-amber-500 animate-pulse" : "text-emerald-400"}`} />
            <span className="text-slate-400">
              {cpuTemp > 42 ? "Meltdown Limit Exceeded" : cpuTemp >= 38 ? "Approaching Heat Limit" : "Room Temperature Safe"}
            </span>
          </div>
        </div>

        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block">PACING STATE (PWM DELAY)</span>
          <div className="text-xl font-bold font-mono mt-1 flex items-baseline gap-1.5">
            <span className={pacingStatus === "Emergency Stop" ? "text-rose-500" : pacingStatus === "Throttling" ? "text-amber-400" : "text-emerald-400"}>
              {pacingStatus === "Emergency Stop" ? "HALT" : pacingStatus === "Throttling" ? "THROTTLE" : "FULL SPEED"}
            </span>
            <span className="text-slate-500 text-xs">
              ({pacingDelay === 9999 ? "PAUSED" : `${pacingDelay}ms`})
            </span>
          </div>
          <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1.5 leading-none">
            <span className={`w-2 h-2 rounded-full ${pacingStatus === "Emergency Stop" ? "bg-red-500 animate-ping" : pacingStatus === "Throttling" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-slate-400">
              {pacingStatus === "Emergency Stop" ? "Coaxes Temp Cooldown" : pacingStatus === "Throttling" ? "Digital PWM sleep(5)" : "0ms Interrupt Execution"}
            </span>
          </div>
        </div>

        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block">TRAINING STEP FREQUENCY</span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {pacingIterationHz} Hz
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1.5 leading-tight">
            Simulated background native thread loop frequency
          </div>
        </div>

        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block">ANDROID SYSTEM OVERHEAD</span>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
            {androidLifecycle === "Active" ? (pacingStatus === "Emergency Stop" ? "1.8%" : pacingStatus === "Throttling" ? "4.2%" : "12.4%") : "0.0%"}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1.5 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>FPS: {androidLifecycle === "Active" ? (pacingStatus === "Emergency Stop" ? "60" : "59") : "60"} (UI responsive)</span>
          </div>
        </div>
      </div>

      {/* PWM Digital Waveform & Temperature Plotting */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Visualizer and controls panel */}
        <div className="md:col-span-8 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-900 pb-4 gap-4 sm:gap-0">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                REAL-TIME PWM DIGITAL PACE & TEMPERATURE OSCILLOSCOPE
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Demonstrates the "цифровой ШИМ" thermal pacers. Higher temperatures insert artificial sleep gaps which decreases the training wave amplitude, capping heating.
              </p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900">
              <label className="text-[10px] font-mono font-bold text-slate-400 cursor-pointer flex items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={autoHeatEnabled}
                  onChange={(e) => setAutoHeatEnabled(e.target.checked)}
                  className="accent-emerald-400 cursor-pointer"
                />
                SIMULATE WORKLOAD INTENSITY HEATING
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Gauge meter display */}
            <div className="md:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-900/60 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-4">THERMAL LEVEL GAUGE</span>
              
              {/* Gauge circle drawing */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background channel */}
                  <circle cx="50" cy="50" r="40" className="stroke-slate-900 fill-none" strokeWidth="6" />
                  {/* Active temperature scale */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={`fill-none transition-all duration-300 ${
                      cpuTemp > 42.0 ? "stroke-red-500" : cpuTemp >= 38.0 ? "stroke-amber-500" : "stroke-emerald-400"
                    }`}
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * Math.min(cpuTemp - 30, 16)) / 16}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="flex flex-col items-center justify-center relative z-10">
                  <span className={`text-2xl font-black font-mono tracking-tight leading-none ${
                    cpuTemp > 42.0 ? "text-rose-500 animate-pulse" : cpuTemp >= 38.0 ? "text-amber-500" : "text-emerald-400"
                  }`}>
                    {cpuTemp.toFixed(1)}°
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase tracking-wider">TEMP LIMIT 42°C</span>
                </div>
              </div>

              <div className="mt-4 w-full text-center space-y-1">
                <div className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                  {pacingStatus === "Emergency Stop" ? "EMERGENCY COOLDOWN" : pacingStatus === "Throttling" ? "ACTIVE PWM THROTTLE" : "ROOM TEMP NORMAL"}
                </div>
                <p className="text-[9px] text-slate-500 leading-normal font-sans">
                  {pacingStatus === "Emergency Stop" 
                    ? "Thread frozen instantly to cool below 39°C." 
                    : pacingStatus === "Throttling" 
                      ? "5ms delay injected to restrict CPU heat." 
                      : "100% Core workload speed active."}
                </p>
              </div>
            </div>

            {/* SVG Oscilloscope chart */}
            <div className="md:col-span-8 space-y-4">
              <div className="bg-slate-950 rounded-xl border border-slate-900 p-4 space-y-4 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wide">CPU WORKLOAD & TEMP HISTORY TRACE</span>
                  <span className="text-[9px] font-mono text-[#718096] whitespace-nowrap">Resolution: 1000ms intervals</span>
                </div>

                {/* Inline SVG Chart rendering */}
                <div className="h-44 w-full bg-[#04060E] rounded border border-slate-900/60 overflow-hidden relative">
                  <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="400" y2="30" className="stroke-slate-900/50" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="75" x2="400" y2="75" className="stroke-slate-900/50" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="120" x2="400" y2="120" className="stroke-slate-900/50" strokeWidth="1" strokeDasharray="3,3" />

                    {/* PWM duty-cycle display region - filled waves */}
                    <path
                      d={(() => {
                        let pathStr = "M 0 150 ";
                        const points = tempHistory.length;
                        if (points === 0) return "";
                        tempHistory.forEach((pt, idx) => {
                          const x = (idx / (points - 1)) * 400;
                          const y = 150 - (pt.rate / 100) * 80;
                          if (idx > 0) {
                            const prevX = ((idx - 1) / (points - 1)) * 400;
                            pathStr += `L ${prevX} ${y} `;
                          }
                          pathStr += `L ${x} ${y} `;
                        });
                        pathStr += "L 400 150 Z";
                        return pathStr;
                      })()}
                      className="fill-cyan-500/10 stroke-cyan-500/30"
                      strokeWidth="1.5"
                    />

                    {/* Temperature curve */}
                    <path
                      d={(() => {
                        let pathStr = "";
                        const points = tempHistory.length;
                        if (points === 0) return "";
                        tempHistory.forEach((pt, idx) => {
                          const x = (idx / (points - 1)) * 400;
                          const tempPercent = (pt.temp - 30) / 16;
                          const y = 130 - Math.max(0, Math.min(tempPercent, 1)) * 110;
                          if (idx === 0) pathStr += `M ${x} ${y} `;
                          else pathStr += `L ${x} ${y} `;
                        });
                        return pathStr;
                      })()}
                      className={`fill-none stroke-2 transition-all ${
                        cpuTemp > 42.0 ? "stroke-red-500" : cpuTemp >= 38.0 ? "stroke-amber-500" : "stroke-emerald-400"
                      }`}
                      strokeWidth="2.5"
                    />

                    {/* Bullet points mapping */}
                    {tempHistory.map((pt, idx) => {
                      const points = tempHistory.length;
                      const x = (idx / (points - 1)) * 400;
                      const tempPercent = (pt.temp - 30) / 16;
                      const y = 130 - Math.max(0, Math.min(tempPercent, 1)) * 110;

                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="2"
                          className={`${
                            pt.temp > 42.0 ? "fill-red-500" : pt.temp >= 38.0 ? "fill-amber-500" : "fill-emerald-400"
                          }`}
                        />
                      );
                    })}
                  </svg>

                  {/* Floating Labels */}
                  <div className="absolute top-1 left-2 font-mono text-[8px] text-slate-500 border-l-2 border-slate-500 pl-1 leading-none uppercase">
                    TEMPERATURE TRACE (°C)
                  </div>
                  <div className="absolute bottom-1 left-2 font-mono text-[8px] text-cyan-400/80 border-l-2 border-cyan-400 pl-1 leading-none uppercase">
                    PWM CORE FREQUENCY (DUTY CYCLE)
                  </div>
                  <div className="absolute top-1.5 right-2 font-mono text-[8px] flex items-center gap-1 border border-slate-900 bg-slate-950 px-1 py-0.5 rounded leading-none text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Current: {cpuTemp.toFixed(1)}°C
                  </div>
                </div>

                {/* Sliders for Temperature Manual Override */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900/60">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                    <span className="tracking-wide">MANUAL TEMPERATURE SLIDER CONTROL OVERRIDE</span>
                    <span className={`font-mono ${cpuTemp > 42.0 ? "text-rose-500 font-extrabold" : cpuTemp >= 38.0 ? "text-amber-500 font-bold" : "text-emerald-400"}`}>
                      {cpuTemp.toFixed(1)}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="46"
                    step="0.1"
                    value={cpuTemp}
                    onChange={(e) => {
                      setAutoHeatEnabled(false);
                      setCpuTemp(parseFloat(e.target.value));
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="text-[9px] font-mono text-slate-600 flex justify-between leading-none mt-1">
                    <span>30°C (Room temperature)</span>
                    <span className="text-amber-500">38°C (Throttling Threshold)</span>
                    <span className="text-red-500">42°C (Emergency Halt Alert)</span>
                    <span>46°C (Extreme heat limit)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Android Lifecycle and Memory layout */}
        <div className="md:col-span-4 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 font-mono">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              LIFECYCLE AWARENESS SIMULATION DECK
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Simulate the Android activity state migrations. AuraCore listens directly to activity lifecycle callbacks to checkpoint models without disk writes, purging heap objects cleanly.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900/85 space-y-4 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] font-bold">CURRENT ACTIVITY LIFECYCLE STATE:</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded text-[10px] font-bold border ${
                androidLifecycle === "Active" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : androidLifecycle === "Paused" 
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                    : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${androidLifecycle === "Active" ? "bg-emerald-400 animate-pulse" : androidLifecycle === "Paused" ? "bg-amber-400" : "bg-red-500"}`} />
                {androidLifecycle === "Active" ? "ON_RESUME (ACTIVE)" : androidLifecycle === "Paused" ? "ON_PAUSE (SUSPENDED)" : "ON_DESTROY (PURGED)"}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-900">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[9px] font-bold">NDK HEAT ALLOC POINTER:</span>
                <span className={`font-mono font-bold ${androidLifecycle === "Destroyed" ? "text-slate-600" : "text-white"}`}>
                  {activeModelPtr}
                </span>
              </div>
              <div className="text-[9px] text-[#A0AEC0] mt-1 pr-1 font-sans leading-relaxed">
                {androidLifecycle === "Destroyed" 
                  ? "destroyAuraCore invoked! Pointers safe-cleared." 
                  : "16MB Aligned CPU-Cache Arena allocated in memory."}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 text-[9px] font-bold">SERIALIZED WEIGHTS IN RAM:</span>
                <span className={`font-mono font-bold ${ramWeightsCached ? "text-amber-400" : "text-slate-600"}`}>
                  {cachedWeightsSize}
                </span>
              </div>
              <div className="text-[9px] text-[#A0AEC0] mt-1 pr-1 font-sans leading-relaxed flex-semibold text-slate-400">
                {ramWeightsCached ? "Checkpoint saved inside transient buffer. High-speed recovery active!" : "System running in RAM. No volatile model cache active."}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 font-mono">
            <button
              onClick={() => {
                setAndroidLifecycle("Active");
                setActiveModelPtr("0x7FFF3D28E010");
                setNdkLogs(prev => [
                  {
                    id: Date.now().toString(),
                    time: new Date().toTimeString().split(" ")[0],
                    service: "LFC",
                    msg: "LFC: Activity onResume() triggered. Reloaded active neural state from RAM. Subthread calculations resume."
                  },
                  ...prev
                ]);
                if (ramWeightsCached) {
                  setRamWeightsCached(true);
                }
              }}
              className={`py-2 px-1 text-center text-[10px] font-bold rounded-lg border transition ${
                androidLifecycle === "Active" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default" 
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white cursor-pointer"
              }`}
            >
              ON_RESUME()
            </button>

            <button
              onClick={() => {
                setAndroidLifecycle("Paused");
                setRamWeightsCached(true);
                setCachedWeightsSize("251.7 KB");
                setNdkLogs(prev => [
                  {
                    id: Date.now().toString(),
                    time: new Date().toTimeString().split(" ")[0],
                    service: "LFC",
                    msg: "LFC: Activity onPause() triggered. 251.7 KB weights serialized to transient RAM cache. Training threads sleeping."
                  },
                  ...prev
                ]);
              }}
              className={`py-2 px-1 text-center text-[10px] font-bold rounded-lg border transition ${
                androidLifecycle === "Paused" 
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-default" 
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white cursor-pointer"
              }`}
            >
              ON_PAUSE()
            </button>

            <button
              onClick={() => {
                setAndroidLifecycle("Destroyed");
                setActiveModelPtr("0x0000000000");
                setRamWeightsCached(false);
                setCachedWeightsSize("0 KB");
                setCpuTemp(28.0);
                setAutoHeatEnabled(false);
                setNdkLogs(prev => [
                  {
                    id: Date.now().toString(),
                    time: new Date().toTimeString().split(" ")[0],
                    service: "LFC",
                    msg: "LFC: Activity onDestroy() triggered. destroyAuraCore called. Pointers cleared and memory fully reclaimed."
                  },
                  ...prev
                ]);
              }}
              className={`py-2 px-1 text-center text-[10px] font-bold rounded-lg border transition ${
                androidLifecycle === "Destroyed" 
                  ? "bg-red-500/10 text-red-500 border-red-500/20 cursor-default" 
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white cursor-pointer"
              }`}
            >
              ON_DESTROY()
            </button>

            <button
              onClick={() => {
                setAndroidLifecycle("Active");
                setActiveModelPtr("0x7FFF3D" + Math.floor(100000 + Math.random() * 800000).toString(16).toUpperCase());
                setRamWeightsCached(false);
                setCachedWeightsSize("0 KB");
                setCpuTemp(34.5);
                setNdkLogs(prev => [
                  {
                    id: Date.now().toString(),
                    time: new Date().toTimeString().split(" ")[0],
                    service: "JNI",
                    msg: `JNI: initAuraCore triggered manually. Re-allocated 16MB aligned arena at pointer: 0x${Math.floor(Math.random() * 10000000).toString(16).toUpperCase()}`
                  },
                  ...prev
                ]);
              }}
              className="py-2 px-1 text-center text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              RECREATE ARENA
            </button>
          </div>
        </div>
      </div>

      {/* JNI debug terminal and Code Tabs integration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* JNI Debug Terminal Console */}
        <div className="md:col-span-6 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 font-mono">
            <h3 className="text-xs font-bold text-slate-300 tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 border border-emerald-500 animate-pulse rounded-full" />
              ANDROID NDK JNI REAL-TIME LOG MONITOR
            </h3>
            <button
              onClick={() => setNdkLogs([])}
              className="text-[9px] text-slate-500 hover:text-slate-300 transition uppercase cursor-pointer"
            >
              CLEAR TERMINAL
            </button>
          </div>

          <div className="h-64 bg-slate-950 rounded-xl border border-slate-900/80 p-4 font-mono text-[10px] overflow-y-auto space-y-2 select-text whitespace-pre-wrap leading-relaxed">
            {ndkLogs.length === 0 ? (
              <div className="text-slate-600 italic text-center pt-24 font-sans">No live JNI calls intercepted yet. Slide temperature or click lifecycles.</div>
            ) : (
              ndkLogs.map((log) => {
                let colorClass = "text-[#A0AEC0]";
                if (log.service === "THERM") {
                  colorClass = log.msg.includes("CRITICAL") ? "text-red-400 font-bold animate-pulse" : "text-amber-400";
                } else if (log.service === "LFC") {
                  colorClass = "text-cyan-400";
                } else {
                  colorClass = "text-emerald-400/90";
                }

                return (
                  <div key={log.id} className="border-b border-slate-900/60 pb-1.5 last:border-0 leading-normal">
                    <span className="text-slate-600">[{log.time}]</span>{" "}
                    <span className="px-1 py-0.5 rounded text-[8px] bg-slate-900 text-slate-400 mr-1.5 border border-slate-800 font-bold uppercase">{log.service}</span>
                    <span className={colorClass}>{log.msg}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Integration Sources Code Blocks Reader */}
        <div className="md:col-span-6 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-3 font-mono">
            <h3 className="text-xs font-bold text-slate-300 tracking-widest flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-400" />
              INTEGRATION BRIDGE CONDUITS
            </h3>

            {/* Bridge file selections */}
            <div className="flex bg-slate-950 p-0.5 rounded border border-slate-900">
              {(["aura-jni.cpp", "AuraCoreBridge.kt", "ThermalPacingManager.kt"] as const).map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedPacingCodeFile(file)}
                  className={`px-2 py-1 rounded text-[9px] transition uppercase ${
                    selectedPacingCodeFile === file
                      ? "bg-[#111A23] text-emerald-400 font-bold border border-emerald-500/10"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {file === "aura-jni.cpp" ? "JNI (C++)" : file === "AuraCoreBridge.kt" ? "Kotlin Bridge" : "Pacing service"}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="h-64 bg-slate-950 rounded-xl border border-slate-900 p-4 overflow-y-auto font-mono text-[9px] text-[#A0AEC0] whitespace-pre leading-relaxed select-text font-medium">
              {selectedPacingCodeFile === "aura-jni.cpp" ? (
                `// aura-jni.cpp
#include <jni.h>
#include <android/log.h>
#include <thread>
#include <atomic>
#include <vector>

#define LOG_TAG "AuraNexus-NDK-Bridge"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

struct AuraCoreArena {
    uint8_t* ptr;
    size_t size;
    size_t offset;
};

struct AuraCore {
    AuraCoreArena arena;
    float learning_rate;
    float threshold;
    bool is_pacing_active;
    std::atomic<bool> pause_signal;
    std::atomic<size_t> pacing_delay_ms; // PWM thermal pacing delay register
};

extern "C" {

JNIEXPORT jlong JNICALL
Java_com_auranexus_core_AuraCoreBridge_initAuraCore(JNIEnv* env, jobject thiz, jint input_dim, jint layers, jint rank) {
    LOGI("Initializing AuraCore NDK Kernel. Inputs: %d, Layers: %d, Rank: %d", input_dim, layers, rank);
    
    AuraCore* core = new AuraCore();
    core->learning_rate = 0.05f;
    core->threshold = 2.0f;
    core->is_pacing_active = true;
    core->pause_signal.store(false);
    core->pacing_delay_ms.store(0); // 0ms pacing (Full Speed)

    // Pre-allocate 16MB Cache-Aligned Arena for safe operations
    core->arena.size = 16 * 1024 * 1024;
    core->arena.offset = 0;
    core->arena.ptr = (uint8_t*)aligned_alloc(128, core->arena.size);
    
    if (core->arena.ptr == nullptr) {
        LOGE("Out of memory on native alignment allocation!");
        jclass exClass = env->FindClass("java/lang/OutOfMemoryError");
        if (exClass != nullptr) {
            env->ThrowNew(exClass, "Failed to allocate 16MB aligned arena buffer via NDK");
        }
        delete core;
        return 0;
    }

    LOGI("Cache aligned arena successfully allocated at pointer: %p", core->arena.ptr);
    return reinterpret_cast<jlong>(core);
}

JNIEXPORT void JNICALL
Java_com_auranexus_core_AuraCoreBridge_trainStep(JNIEnv* env, jobject thiz, jlong ptr, jfloatArray data_array) {
    AuraCore* core = reinterpret_cast<AuraCore*>(ptr);
    if (core == nullptr) return;

    if (core->pause_signal.load()) {
        return;
    }

    // Thermal PWM pacing delay application
    size_t active_delay = core->pacing_delay_ms.load();
    if (active_delay > 0) {
        std::this_thread::sleep_for(std::chrono::milliseconds(active_delay));
    }

    jfloat* data = env->GetFloatArrayElements(data_array, nullptr);
    jsize len = env->GetArrayLength(data_array);

    // [Forward-only FFA Hinton kernel run inside Arena pointers]
    LOGI("Hinton FFA epoch processed. Range-capacity: %d. PWM delay setting: %u ms", len, (unsigned int)active_delay);

    env->ReleaseFloatArrayElements(data_array, data, JNI_ABORT);
}

JNIEXPORT jbyteArray JNICALL
Java_com_auranexus_core_AuraCoreBridge_getModelState(JNIEnv* env, jobject thiz, jlong ptr) {
    AuraCore* core = reinterpret_cast<AuraCore*>(ptr);
    if (core == nullptr) return nullptr;

    jsize state_size = 251699; // weights serialization size
    jbyteArray result = env->NewByteArray(state_size);
    std::vector<jbyte> serialized(state_size, 0x4B);
    env->SetByteArrayRegion(result, 0, state_size, serialized.data());
    
    return result;
}

JNIEXPORT void JNICALL
Java_com_auranexus_core_AuraCoreBridge_destroyAuraCore(JNIEnv* env, jobject thiz, jlong ptr) {
    AuraCore* core = reinterpret_cast<AuraCore*>(ptr);
    if (core != nullptr) {
        if (core->arena.ptr != nullptr) {
            free(core->arena.ptr);
        }
        delete core;
        LOGI("AuraCore structures fully purged.");
    }
}

}`
              ) : selectedPacingCodeFile === "AuraCoreBridge.kt" ? (
                `package com.auranexus.core

import android.util.Log

/**
 * AuraCoreBridge - Low-latency Kotlin wrapper around NDK-compiled Rust library.
 * Guarantees zero-heap-allocations inside critical forward-only Hintons FFA train loops.
 */
object AuraCoreBridge {
    private const val TAG = "AuraCoreBridge"

    init {
        try {
            System.loadLibrary("auranexus_core")
            Log.i(TAG, "Native cdylib loaded successfully. neon SIMD/SVE optimizations ready.")
        } catch (e: UnsatisfiedLinkError) {
            Log.e(TAG, "Critical: Could not load libauranexus_core.so from NDK directories!", e)
        }
    }

    // --- Native static methods directly bridging Kotlin and Rust ---
    
    external fun initAuraCore(inputDim: Int, layers: Int, rank: Int): Long
    external fun trainStep(ptr: Long, data: FloatArray)
    external fun getModelState(ptr: Long): ByteArray
    external fun destroyAuraCore(ptr: Long)
}`
              ) : (
                `package com.auranexus.core

import android.content.Context
import android.os.HardwarePropertiesManager
import android.util.Log
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/**
 * ThermalPacingManager - Coordinates with OS HardwarePropertiesManager to safeguard CPU.
 * Utilizes digital PWM throttling signals passed to Rust thread via Atomic Registers.
 */
class ThermalPacingManager(private val context: Context) {
    private val TAG = "ThermalPacingManager"
    private var nativeCorePtr: Long = 0
    private var isRunning = false
    private val scheduler: ScheduledExecutorService = Executors.newSingleThreadScheduledExecutor()
    private var hardwarePropertiesManager: HardwarePropertiesManager? = null

    init {
        hardwarePropertiesManager = context.getSystemService(Context.HARDWARE_PROPERTIES_SERVICE) 
            as? HardwarePropertiesManager
    }

    fun startMonitoring(corePtr: Long) {
        this.nativeCorePtr = corePtr
        this.isRunning = true
        
        // Poll CPU temperature every 500ms
        scheduler.scheduleAtFixedRate({
            if (!isRunning) return@scheduleAtFixedRate
            
            val temps = hardwarePropertiesManager?.getDeviceTemperatures(
                HardwarePropertiesManager.DEVICE_TEMPERATURE_CPU,
                HardwarePropertiesManager.TEMPERATURE_CURRENT
            )
            
            val cpuTemp = temps?.firstOrNull() ?: readFallbackCpuTemp()
            evaluatePacing(cpuTemp)
        }, 0, 500, TimeUnit.MILLISECONDS)
    }

    private fun evaluatePacing(temp: Float) {
        when {
            temp < 38.0f -> {
                setNativePacingDelay(0)
            }
            temp in 38.0f..42.0f -> {
                setNativePacingDelay(5)
            }
            temp > 42.0f -> {
                setNativePacingDelay(-1)
            }
        }
    }

    private fun setNativePacingDelay(delayMs: Int) {
        // Direct NDK communication setting atomic throttle variable inside Rust struct
    }

    private fun readFallbackCpuTemp(): Float {
        return try {
            java.io.File("/sys/class/thermal/thermal_zone0/temp").readText().trim().toFloat() / 1000f
        } catch (e: Exception) {
            34.5f
        }
    }
}`
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
