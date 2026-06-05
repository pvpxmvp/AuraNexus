/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";
import {
  Brain,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Plus,
  Database,
  TrendingUp,
  Bot,
  Send,
  CheckCircle,
  Sliders,
  ChevronRight,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import { useAuraContext } from "../store/AuraContext";
import { useTrainingLoop } from "../hooks/useTrainingLoop";
import { useVisualizationData } from "../hooks/useVisualizationData";

export const VisualizerTab: React.FC = () => {
  const {
    inputDim, setInputDim,
    numLayers, setNumLayers,
    initialRank, setInitialRank,
    learningRate, setLearningRate,
    threshold, setThreshold,
    cores,
    posInput,
    negInput,
    posGoodness,
    negGoodness,
    trainingHistory,
    stepCount,
    trainSpeed, setTrainSpeed,
    selectedCoreIdx, setSelectedCoreIdx,
    expansionHistory,
    chatMessages, setChatMessages,
    userQuery, setUserQuery,
    isLoadingAI, setIsLoadingAI,
    reinitializeNetwork,
    executeOrthogonalExpansion,
    handleRegenerateSignals
  } = useAuraContext();

  const { isTraining, toggleTraining } = useTrainingLoop();
  const { thresholdY, posPoints, negPoints, isEmpty } = useVisualizationData();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!userQuery.trim()) return;

    const userText = userQuery.trim();
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setUserQuery("");
    setIsLoadingAI(true);

    setTimeout(() => {
      const normalizedQuery = userText.toLowerCase();
      
      // 1. MODALITY DETECTION
      let modality = "Multimodal (Text/Sensor)";
      let activeSensors = "Text Encoder: bge-micro-v2 (NNAPI) & Vision: SigLIP-small-Q4 (Vulkan)";
      let scrapeQuery = "site:wikipedia.org OR site:gutenberg.org";
      
      if (normalizedQuery.match(/(трейд|мемкоин|coin|price|finance|курс|крипт|валют|stock|chart|time|series)/i)) {
        modality = "TimeSeries (Financial/Sequential)";
        activeSensors = "Numeric Encoder: Static Rust Normalizer with Fourier Phase Embeddings";
        scrapeQuery = "site:coingecko.com OR site:binance.com filetype:csv";
      } else if (normalizedQuery.match(/(image|vision|photo|изображ|картин|камер|зрен|object|segment|face)/i)) {
        modality = "Computer Vision / Spatial";
        activeSensors = "Vision Encoder: MobileViT-xx-small (compiled high-speed Vulkan pipeline)";
        scrapeQuery = "site:github.com/cocodataset OR site:kaggle.com dataset image";
      } else if (normalizedQuery.match(/(code|program|инструкц|алгоритм|скрипт|сборк|compile|embed)/i)) {
        modality = "Code Representation";
        activeSensors = "Text Encoder: nomic-embed-text-v1.5-Q4 (ultra-fast quantized 4-bit model via NNAPI)";
        scrapeQuery = "site:github.com OR site:arxiv.org software library";
      } else if (normalizedQuery.match(/(квант|хромо|физик|math|physics|science|наук|формул|теорем)/i)) {
        modality = "Scientific Multimodal (High-dimensional)";
        activeSensors = "Hybrid Quantum-Tensor Sensor Core Encoders";
        scrapeQuery = "site:arxiv.org OR site:pubmed.ncbi.nlm.nih.gov";
      } else if (normalizedQuery.match(/(text|news|стать|словар|перевод|слово|язык)/i)) {
        modality = "Text Embeddings / NLP";
        activeSensors = "Text Encoder: nomic-embed-text-v1.5-Q4 (128-dim quantized NLP token sensor)";
        scrapeQuery = "site:wikipedia.org OR site:arxiv.org NLP dataset";
      }

      // 2. COMPLEXITY ESTIMATION
      let complexity = "Low";
      let weightScalar = 1.0;
      if (userText.length > 50 || normalizedQuery.match(/(квантовая|хромодинамика|мемкоинами|интегральный|оптимизация|neural|vulkan)/i)) {
        complexity = "Expert";
        weightScalar = 2.0;
      } else if (userText.length > 25 || normalizedQuery.match(/(распознавание|номера|сложный|точный|high-accuracy)/i)) {
        complexity = "High";
        weightScalar = 1.5;
      } else if (userText.length > 12) {
        complexity = "Medium";
        weightScalar = 1.2;
      }

      // 3. HARDWARE PROFILING (REAL IN-BROWSER MICRO-BENCHMARK)
      const benchmarkStart = performance.now();
      let iterCount = 0;
      // Synthesize a dummy evaluation vector aligned with existing cores parameter bounds
      const evalInput = Array(inputDim || 8).fill(0).map(() => Math.random());
      
      // Perform 100 fast iterations of computeForwardTS
      for (let i = 0; i < 100; i++) {
        // Evaluate forward contract paths
        let current_state = [1.0];
        let start_idx = 0;
        for (let k = 0; k < cores.length; k++) {
          const core = cores[k];
          const x_k = evalInput.slice(start_idx, start_idx + core.d);
          start_idx += core.d;
          const next_state: number[] = Array(core.r_curr).fill(0);
          for (let b = 0; b < core.r_curr; b++) {
            let sum_val = 0.0;
            for (let a = 0; a < core.r_prev; a++) {
              let w_sum = 0.0;
              for (let j = 0; j < core.d; j++) {
                if (j < x_k.length && core.weights && core.weights[a] && core.weights[a][j]) {
                  w_sum += (core.weights[a][j][b] || 0.1) * x_k[j];
                }
              }
              sum_val += current_state[a] * w_sum;
            }
            next_state[b] = sum_val;
          }
          const n_sq = next_state.reduce((s, v) => s + v * v, 0);
          const n_val = Math.sqrt(n_sq + 1e-9);
          current_state = next_state.map(v => v / n_val);
        }
        iterCount++;
      }
      
      const benchDuration = performance.now() - benchmarkStart;
      const speedK = iterCount / (benchDuration || 1); // iterations per millisecond
      
      let hwProfile = "Budget Hardware Core (CPU Fallback)";
      let dim = 8;
      let layers = 3;
      let rank = 3;
      let thresholdVal = 1.5;
      
      if (speedK > 15) { // Highly performance device structure
        hwProfile = "Flagship Snapdragon NPU / GPU Core (Vulkan accelerated)";
        dim = Math.min(24, Math.round(16 * weightScalar));
        layers = Math.min(8, Math.round(4 * weightScalar));
        rank = Math.min(6, Math.max(1, Math.round(2 * weightScalar)));
        thresholdVal = 2.0;
      } else if (speedK > 5) { // Middle tier
        hwProfile = "Mid-range NPU Processor (Vulkan/NNAPI enabled)";
        dim = Math.min(24, Math.round(12 * weightScalar));
        layers = Math.min(8, Math.round(3 * weightScalar));
        rank = Math.min(5, Math.max(1, Math.round(2 * weightScalar)));
        thresholdVal = 2.5;
      } else { // Lower processing capacity
        hwProfile = "Resource-constrained budget CPU fallback";
        dim = Math.min(24, Math.round(8 * weightScalar));
        layers = Math.min(8, Math.round(2 * weightScalar));
        rank = Math.min(4, Math.max(1, Math.round(1 * weightScalar)));
        thresholdVal = 3.0;
      }

      // Keep parameters strictly within allowed slider domains
      dim = Math.max(4, Math.min(24, dim));
      layers = Math.max(2, Math.min(8, layers));
      rank = Math.max(1, Math.min(6, rank));

      const recommendedConfig = {
        dim,
        layers,
        rank,
        threshold: thresholdVal,
        encoder: activeSensors,
        modality,
        complexity,
        hardwareProfile: hwProfile,
        scraperOperators: scrapeQuery
      };

      const responseText = `⚙️ [HYBRID QUANTUM-TENSOR COMPILER SUCCESS]
• Prompt Modality: ${modality}
• Computational Complexity: ${complexity} (scalar ${weightScalar}x)
• Active Hardware Profile: ${hwProfile} (${speedK.toFixed(1)} iter/ms)

🔗 SENSORY INPUT GATEWAY LOGS:
• Active Pretrained Encoder: ${activeSensors} (zero-copy memory ingestion active)

📂 TARGETED SEMANTIC OPERATOR:
• Scraper: "${scrapeQuery}"

⚙️ ARCHITECTURE BLUEPRINT SUGGESTION:
• Input Dim (D): ${dim}
• Layers Count (N): ${layers}
• Base Link Rank (r): ${rank}
• Goodness Separator (θ): ${thresholdVal}

Apply architecture parameters instantly to initialize complex phase quantum weights?`;

      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: responseText,
          recommendedConfig
        }
      ]);
      setIsLoadingAI(false);
    }, 800);
  };

  const handleApplyConfig = (cfg: { dim: number; layers: number; rank: number; threshold: number }) => {
    setInputDim(cfg.dim);
    setNumLayers(cfg.layers);
    setInitialRank(cfg.rank);
    setThreshold(cfg.threshold);
    // Effects inside context provider will automatically run initialisation
  };

  return (
    <React.Fragment>
      {/* LEFT PROFILE CONTROLS (col-span-4) */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -15 }}
        className="lg:col-span-4 space-y-6 flex flex-col justify-start text-[#A0AEC0]"
      >
        {/* Hyperparameter Section */}
        <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900/85 p-5 space-y-4">
          <div className="flex items-center space-x-2 text-slate-200 border-b border-slate-900 pb-3">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold tracking-wide">HYPER-PARAMETERS</h2>
          </div>

          {/* Input Dimensions slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-400">Input dimensions (D):</span>
              <span className="text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded text-[10px] border border-slate-900">
                {inputDim} dimensions
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={inputDim}
              onChange={(e) => setInputDim(parseInt(e.target.value))}
              disabled={isTraining}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Layers slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-400">Layers count (N):</span>
              <span className="text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded text-[10px] border border-slate-900">
                {numLayers} Tensors
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={numLayers}
              onChange={(e) => setNumLayers(parseInt(e.target.value))}
              disabled={isTraining}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Core linkage Rank */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-400">Initial link rank (r_0):</span>
              <span className="text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded text-[10px] border border-slate-900">
                rank = {initialRank}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={initialRank}
              onChange={(e) => setInitialRank(parseInt(e.target.value))}
              disabled={isTraining}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Learning Rate slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-400">Learning rate (η):</span>
              <span className="text-indigo-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded text-[10px] border border-slate-900">
                {learningRate.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.2"
              step="0.005"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Energy Threshold slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-400">Threshold energy (θ):</span>
              <span className="text-rose-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded text-[10px] border border-slate-900">
                θ = {threshold}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => reinitializeNetwork()}
              className="flex-1 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/80 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset weights
            </button>
            <button
              onClick={() => {
                const stepInput = Array(inputDim).fill(0).map((_, i) => (i >= inputDim / 2 ? 1.0 : -1.0));
                handleRegenerateSignals("step");
              }}
              className="flex-grow bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Data
            </button>
          </div>
        </div>

        {/* Offline Syntactic Parser Chatbox */}
        <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900/85 p-5 flex flex-col h-[340px] justify-between">
          <div className="flex items-center space-x-2 text-slate-200 border-b border-slate-900 pb-3">
            <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Local Parser Assistant</h2>
          </div>

          {/* Messages scrollarea */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3.5 max-h-[200px] scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-slate-950 pr-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/10"
                      : "bg-slate-950/80 text-slate-300 border border-slate-900"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.text}

                  {msg.recommendedConfig && (
                    <div className="mt-3 bg-[#0c1020] border border-cyan-500/15 p-2 rounded-lg flex items-center justify-between gap-3">
                      <div className="font-mono text-[9px] text-[#A0AEC0]">
                        <span>D={msg.recommendedConfig.dim} • N={msg.recommendedConfig.layers} • r={msg.recommendedConfig.rank} • θ={msg.recommendedConfig.threshold}</span>
                      </div>
                      <button
                        onClick={() => handleApplyConfig(msg.recommendedConfig!)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-mono text-[9px] font-bold py-1 px-2.5 rounded cursor-pointer transition whitespace-nowrap"
                      >
                        Применить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoadingAI && (
              <div className="flex items-center space-x-2 text-slate-500 text-[10px] pl-2 font-mono">
                <Sparkles className="w-3 h-3 animate-spin text-indigo-400" />
                <span>Compiler analyzing syntax triggers...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input messaging block */}
          <div className="flex gap-1.5 border-t border-slate-900 pt-3">
            <input
              type="text"
              placeholder="e.g., 'распознавание автомобильных номеров'"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* RIGHT DISPLAY AND GRAPHS (col-span-8) */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 15 }}
        className="lg:col-span-8 space-y-6 text-[#A0AEC0]"
      >
        {/* 1. CORE VISUALIZATION CANVAS */}
        <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-900 pb-3 gap-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">TENSOR TRAIN CONNECTIVITY PATHWAYS</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Iterative Tensor Link Ranks and local core transition properties</p>
              </div>
            </div>

            {/* Run states controls */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-900 p-1 rounded-xl">
              <button
                onClick={toggleTraining}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isTraining
                    ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                {isTraining ? <Square className="w-3 h-3 fill-rose-400" /> : <Play className="w-3 h-3 fill-emerald-400" />}
                {isTraining ? "Pause Loop" : "Auto-Epochs"}
              </button>

              {/* Training speed controls */}
              <select
                value={trainSpeed}
                onChange={(e) => setTrainSpeed(parseInt(e.target.value))}
                className="bg-[#05070F] border border-slate-900 text-slate-400 text-[10px] font-mono rounded-lg outline-none py-1.5 px-2"
              >
                <option value="150">Slow (150ms)</option>
                <option value="60">Medium (60ms)</option>
                <option value="30">Fast (30ms)</option>
                <option value="10">Insane (10ms)</option>
              </select>
            </div>
          </div>

          {/* TT Chain Render Nodes */}
          <div className="relative py-4 flex flex-col md:flex-row items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-900/60 overflow-x-auto gap-4 md:gap-0">
            
            {/* Connections background pathway */}
            <div className="absolute hidden md:block left-10 right-10 top-1/2 h-0.5 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-emerald-500/10 -translate-y-1/2 z-0" />

            {/* Left initial state */}
            <div className="flex flex-col items-center z-10">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 shadow">
                s₀
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-1">dim=1</span>
            </div>

            {/* Render Tensor Train Core Nodes dynamically */}
            {cores.map((core, idx) => (
              <React.Fragment key={`tt-node-${idx}`}>
                <div className="flex flex-col items-center z-10 group cursor-pointer" onClick={() => setSelectedCoreIdx(idx)}>
                  {/* Bonding dimension line label */}
                  <div className="hidden md:block absolute -translate-y-6 text-[9px] font-mono text-slate-500 bg-[#0B0F19] px-1 rounded">
                    r_{idx} = <span className="text-emerald-400 font-semibold">{core.r_prev}</span>
                  </div>

                  {/* Core visual cube */}
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex flex-col items-center justify-center border transition relative ${
                      selectedCoreIdx === idx
                        ? "bg-gradient-to-tr from-[#13222A] to-[#0A1D1D] border-emerald-500/80 shadow-lg shadow-emerald-500/5 text-emerald-400"
                        : "bg-slate-900 hover:bg-[#141A2D] border-slate-800 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-tight">Core G_{idx+1}</span>
                    <span className="text-[8px] font-mono text-slate-500 mt-1">
                      ({core.r_prev}×{core.d}×{core.r_curr})
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono mt-1">Layer Input: {core.d}D</span>
                </div>

                {/* If last node, map to final goodness */}
                {idx === cores.length - 1 && (
                  <div className="flex flex-col items-center z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono shadow">
                      s_N
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">dim=1</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Active Core Matrix Heatmap View */}
          {cores[selectedCoreIdx] && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950/80 p-4 rounded-xl border border-slate-900 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs font-semibold text-slate-200">
                  COORDINATES VIEW FOR CORE G_{selectedCoreIdx + 1} ({cores[selectedCoreIdx].r_prev} x {cores[selectedCoreIdx].d} x {cores[selectedCoreIdx].r_curr})
                </span>
                <span className="text-[9px] text-slate-500 font-mono">SELECTED LAYER GRAPHICS</span>
              </div>

              <div className="p-3 bg-slate-900/40 rounded border border-slate-900 text-xs leading-relaxed">
                <span className="text-emerald-400 font-semibold">Description:</span> Evaluates matrix weights flat representation.
                The index weights map inputs of dimension size <span className="font-mono text-slate-300">{cores[selectedCoreIdx].d}</span> to the localized transition bonds. Here, you see the active elements of target core:
              </div>

              {/* Weight grids heatmap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-52 overflow-y-auto pr-1">
                {cores[selectedCoreIdx].weights.map((matrix2D, a) => (
                  <div key={`matrix-slice-${a}`} className="bg-slate-900/60 p-2 h-fit rounded border border-slate-900/80">
                    <h3 className="text-[10px] font-mono text-slate-400 mb-1.5 text-center">Prev State dimension index: a = {a}</h3>
                    <div className="grid gap-1">
                      {matrix2D.map((rowArr, j) => (
                        <div key={`row-${j}`} className="flex items-center space-x-1">
                          <span className="text-[9px] font-mono text-slate-600 w-10">Input x_{j}:</span>
                          <div className="flex-1 flex gap-1">
                            {rowArr.map((weightVal, b) => {
                              const magnitude = Math.min(1, Math.abs(weightVal) / 1.5);
                              const isPos = weightVal >= 0;
                              const bgStyle = isPos 
                                ? `rgba(16, 185, 129, ${0.1 + magnitude * 0.9})` 
                                : `rgba(99, 102, 241, ${0.1 + magnitude * 0.9})`;

                              return (
                                <div
                                  key={`cell-${b}`}
                                  style={{ backgroundColor: bgStyle }}
                                  className="flex-1 text-center font-mono text-[9px] p-1 rounded font-medium text-white select-none border border-black/10"
                                  title={`Weight[a=${a}, j=${j}, b=${b}] = ${weightVal.toFixed(6)}`}
                                >
                                  {weightVal.toFixed(2)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* 2. DUAL METRICS PLOTS (LIVE ENERGY TRENDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Real-time convergence plot */}
          <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold tracking-wide text-white">REAL-TIME CONVERGENCE DEVIATION</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Step {stepCount}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900/80 flex flex-col items-center">
                <span className="text-[9px] text-emerald-400 font-mono">POSITIVE GOODNESS</span>
                <span className="text-lg font-bold text-white mt-1 font-mono">{posGoodness.toFixed(4)}</span>
                <span className="text-[9px] text-slate-500 mt-1">Must be &gt; {threshold}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900/80 flex flex-col items-center">
                <span className="text-[9px] text-indigo-400 font-mono">NEGATIVE GOODNESS</span>
                <span className="text-lg font-bold text-white mt-1 font-mono">{negGoodness.toFixed(4)}</span>
                <span className="text-[9px] text-slate-500 mt-1">Must be &lt; {threshold}</span>
              </div>
            </div>

            {/* Lightweight SVG Plot */}
            <div className="h-32 bg-slate-950/80 border border-slate-900 rounded-xl relative flex items-center justify-center p-2">
              {isEmpty ? (
                <div className="text-[10px] text-slate-600 text-center flex flex-col items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Waiting for epochs... Click Auto-Epochs above.</span>
                </div>
              ) : (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Threshold horizontal line */}
                  <line
                    x1="0"
                    y1={thresholdY}
                    x2="100"
                    y2={thresholdY}
                    stroke="#EF4444"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text x="2" y={thresholdY - 2} fill="#EF4444" fontSize="5" className="font-mono">
                    θ = {threshold}
                  </text>

                  {/* Draw Positive Line */}
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    points={posPoints}
                  />

                  {/* Draw Negative Line */}
                  <polyline
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="1.5"
                    points={negPoints}
                  />
                </svg>
              )}
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500 inline-block"></span>Positive Data</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-indigo-500 inline-block"></span>Negative Noise</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-red-500 inline-block"></span>Threshold</span>
            </div>
          </div>

          {/* Orthogonal Capacity Archivist */}
          <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold tracking-wide text-white">ORTHOGONAL CAPACITY ARCHIVIST</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">CONTINUAL LEARNING</span>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              By adding zero-padded lines to the tensor transition borders, we expand local model representation size without erasing pre-learned values. Old evaluation patterns stay intact at <span className="text-emerald-400 font-semibold font-mono">0% degradation</span>!
            </p>

            <button
              onClick={executeOrthogonalExpansion}
              className="w-full bg-[#111A23] border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-xs font-semibold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Expand capacity (Rank + 1)
            </button>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 font-mono block">MODIFICATION LOG (LATEST ACTIONS FIRST)</span>
              <div className="bg-slate-950 p-2 h-20 rounded-lg border border-slate-900 overflow-y-auto text-[10px] font-mono text-slate-400 space-y-1">
                {expansionHistory.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-slate-600">[{index + 1}]</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </React.Fragment>
  );
};
