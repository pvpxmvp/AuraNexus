/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Network, Database, Brain, Zap, Sliders, Info } from "lucide-react";
import { motion } from "motion/react";
import { useAuraContext } from "../store/AuraContext";

export const NetworkStreamTab: React.FC = () => {
  const {
    streamingActive, setStreamingActive,
    streamSpeed, setStreamSpeed,
    streamQuery, setStreamQuery,
    bufferHead, setBufferHead,
    bufferTail, setBufferTail,
    backpressureActive,
    networkLogs, setNetworkLogs
  } = useAuraContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="col-span-12 space-y-6 text-[#A0AEC0]"
    >
      {/* Dynamic Telemetry stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <Network className="w-24 h-24 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">INCOMING BANDWIDTH RATE</span>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {streamingActive ? `${streamSpeed} Mbps` : "0.0 Mbps"}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1 font-semibold">
            <span className={`w-2 h-2 rounded-full ${streamingActive ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            {streamingActive ? "Multipath tokio sockets active" : "Service Offline"}
          </div>
        </div>

        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <Database className="w-24 h-24 text-teal-400" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">DISK PERSISTENCE STATUS</span>
          <div className="text-xl font-bold text-teal-400 font-mono mt-1">0 BYTES WRITTEN</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 font-semibold">
            100.0% Strict Zero-Storage
          </div>
        </div>

        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <Brain className="w-24 h-24 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">VECTOR ENCODING LATENCY</span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">0.24 ms / 1KB</div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block font-semibold">
            Hashing Trick bounded registers
          </span>
        </div>

        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <Zap className="w-24 h-24 text-amber-500" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">SEMANTIC FILTER CUT-OFF</span>
          <div className="text-xl font-bold text-amber-500 font-mono mt-1">&gt; 0.70 Similarity</div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block font-semibold leading-none">
            Aborts connection instantly
          </span>
        </div>
      </div>

      {/* Streaming Controls config deck */}
      <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 font-mono">
            <Sliders className="w-4 h-4 text-emerald-400" />
            STREAM CONTROLLER & SEMANTIC KEYWORD FILTER DECK
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure the асинхронный сетевой фильтр. Input target keywords. Incoming page streams will have their headers and initial bytes scanned up to 2KB. Only matching high-similarity slices are fed directly to our unified StreamBuffer memory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: configuration sliders and input */}
          <div className="md:col-span-4 space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-900">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider block">TARGET SEMANTIC QUERY (FILTER)</label>
              <input
                type="text"
                value={streamQuery}
                onChange={(e) => setStreamQuery(e.target.value)}
                className="w-full bg-[#080B16] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/75"
                placeholder="e.g., автомобильные номера"
              />
              <span className="text-[9px] font-mono text-slate-600 block mt-1 leading-tight font-semibold">
                Note: Context filter correctly rejects clothes sizes or telephones (Mvideo, Wildberries logs).
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                <span className="tracking-wider">TOKIO INGESTION BANDWIDTH</span>
                <span className="text-emerald-400">{streamSpeed} Mbps</span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                step="1"
                value={streamSpeed}
                onChange={(e) => setStreamSpeed(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="text-[9px] font-mono text-slate-600 flex justify-between leading-none mt-1">
                <span>2 Mbps (Low overhead)</span>
                <span>100 Mbps (Max load)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-slate-500">SERVICE STATUS:</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${streamingActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                  {streamingActive ? "ONLINE & STREAMING" : "OFFLINE"}
                </span>
              </div>

              <div className="flex gap-2 font-mono">
                <button
                  onClick={() => {
                    setStreamingActive(!streamingActive);
                    if (!streamingActive) {
                      setBufferHead(1820300 + Math.floor(Math.random() * 50000));
                      setBufferTail(2940200 + Math.floor(Math.random() * 100000));
                    }
                  }}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition ${streamingActive ? "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
                >
                  {streamingActive ? "PAUSE STREAMER" : "LAUNCH STREAMER"}
                </button>
                <button
                  onClick={() => {
                    setNetworkLogs(prev => [
                      {
                        id: Date.now(),
                        url: `https://test-server-nexus-${Math.floor(Math.random() * 1000)}.ru/api/stream`,
                        title: `Автомобильный Гос Знак • База ${streamQuery}`,
                        h1: `Поиск Гос Номеров по ${streamQuery}`,
                        length: "2.2 KB (Clipped HEAD chunk)",
                        similarity: 0.85 + Math.random() * 0.14,
                        status: "accepted",
                        timestamp: new Date().toTimeString().split(' ')[0],
                        contentSnippet: `<html><head><title>Автомобильный Гос Знак • Поиск</title></head><body><h1>Поиск Гос Номеров</h1><p>Инициализирована асинхронная выгрузка данных по запросу ${streamQuery} в поток...</p></body></html>`,
                        vectorPreview: Array.from({ length: 8 }, () => parseFloat((Math.random() * 2 - 1).toFixed(2))),
                      },
                      ...prev
                    ]);
                    setBufferTail(prev => (prev + 4096) % 52428800);
                  }}
                  className="px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer text-xs"
                  title="Inject Custom Request URL for Stream Analysis"
                >
                  INJECT URL
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: HTML parsing snippet simulation */}
          <div className="md:col-span-8 bg-slate-950/70 rounded-xl border border-slate-900/40 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              ACTIVE HTTP STREAM BYTE CLIPPER (RANGE: BYTES=0-2048)
            </h4>
            
            <div className="border border-slate-900 bg-slate-950 font-mono text-[11px] p-4 rounded-xl leading-relaxed space-y-3 relative overflow-hidden">
              <div className="absolute top-2 right-3 text-[9px] text-emerald-400 bg-emerald-400/15 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest leading-none">
                HEADERS CAPTURED
              </div>
              
              <div className="text-slate-500 border-b border-slate-900 pb-2">
                <div>GET /catalog/plates HTTP/1.1</div>
                <div>Host: ru.autonum.ru</div>
                <div className="text-emerald-400 font-semibold">Range: bytes=0-2048 (Strict Clip - Partial Content 206)</div>
                <div>User-Agent: AuraNexus Core Streamer (ARM SVE Engine)</div>
              </div>

              <div className="text-slate-400">
                <span className="text-indigo-400 block mb-1 font-bold">// Parsed HTTP elements via Snippet Analyzer:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] bg-[#070913] p-2.5 rounded-lg border border-slate-900">
                  <div>
                    <span className="text-slate-500 font-semibold block">EXTRACTED &lt;title&gt;</span>
                    <span className="text-white">База Автомобильных Номеров РФ • Поиск</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">EXTRACTED &lt;h1&gt;</span>
                    <span className="text-emerald-400">Реестр Государственных Знаков</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 bg-[#070913] p-3 rounded-lg border border-slate-900">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold">COSINE VECTOR COMPATIBILITY (THRESHOLD &ge; 0.7)</span>
                  <span className="text-emerald-400 font-bold">0.95 MATCHED (ACCEPT)</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse" style={{ width: "95%" }}></div>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-900 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-300 block mb-0.5">Surgical connection abort mechanism:</span> 
                If the computed similarity does not meet key semantic threshold of 0.7, the connection is instantly aborted (`connection.abort()`). This shields your processor from reading the remaining megabytes, eliminating cache pollution and memory leaks completely.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Memory mapping - Zero Copy Buffer Visualizer */}
      <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 font-mono">
            <Database className="w-4 h-4 text-emerald-400" />
            STREAMBUFFER: ZERO-COPY NATIVE RING MAP (50MB PRE-ALLOCATED SPEC)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Direct visual map of the circular ring buffer allocating incoming streams in-place. Multi-thread writers (network sockets) advance the `Tail` pointer, and one single reader (`AuraCore` core training thread) grabs the bytes from the `Head` pointer, zero copy overhead. Managed via atomic CAS `compare_exchange_weak` operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left stats parameters */}
          <div className="md:col-span-4 space-y-4 font-mono text-xs bg-slate-950 p-5 rounded-xl border border-slate-900 text-slate-400">
            <div>
              <span className="text-slate-500 block text-[10px]">BUFFER HEAD POINTER (READ ITERATOR)</span>
              <span className="text-white font-bold font-mono text-sm">0x{bufferHead.toString(16).toUpperCase()}</span>
              <span className="text-[10px] text-slate-600 block leading-none mt-1">Active AuraCore training read stream</span>
            </div>

            <div className="pt-3 border-t border-slate-900">
              <span className="text-slate-500 block text-[10px]">BUFFER TAIL POINTER (WRITE ITERATOR)</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">0x{bufferTail.toString(16).toUpperCase()}</span>
              <span className="text-[10px] text-slate-600 block leading-none mt-1">Active tokio asynchronous incoming streams</span>
            </div>

            <div className="pt-3 border-t border-slate-900 flex justify-between items-center font-semibold">
              <div>
                <span className="text-slate-500 block text-[10px]">UNCONSUMED BYTES ALIVE</span>
                <span className="text-indigo-400 font-bold text-sm">{(Math.abs(bufferTail - bufferHead) % 52428800).toLocaleString()} Bytes</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold">CIRCULAR REEVAL</span>
            </div>

            <div className="pt-3 border-t border-slate-900 flex items-center justify-between font-semibold">
              <span className="text-slate-500 text-[10px]">BACKPRESSURE LOCK INTEGRITY</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold ${backpressureActive ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${backpressureActive ? "bg-red-500 animate-ping" : "bg-emerald-400"}`} />
                {backpressureActive ? "LOCK ACTIVE" : "PASSTHROUGH OK"}
              </span>
            </div>
          </div>

          {/* Circular visual rendering */}
          <div className="md:col-span-8 flex flex-col items-center justify-center p-4 bg-slate-950/20 rounded-xl border border-slate-900/30">
            <div className="grid gap-1 w-full max-w-lg" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
              {Array.from({ length: 96 }).map((_, slotIdx) => {
                const cellBytes = 52428800 / 96;
                const currOffset = slotIdx * cellBytes;
                
                const isBetweenHeadTail = bufferHead < bufferTail 
                  ? (currOffset >= bufferHead && currOffset <= bufferTail)
                  : (currOffset >= bufferHead || currOffset <= bufferTail);

                const isHeadSlot = Math.abs(currOffset - bufferHead) < cellBytes;
                const isTailSlot = Math.abs(currOffset - bufferTail) < cellBytes;

                let bgClass = "bg-[#070913] border-slate-950 text-slate-800";
                if (isHeadSlot) {
                  bgClass = "bg-rose-500/20 border-rose-500/60 text-rose-400 font-bold scale-110 z-10 animate-pulse";
                } else if (isTailSlot) {
                  bgClass = "bg-emerald-500/20 border-emerald-500/60 text-emerald-400 font-bold scale-110 z-10 animate-pulse";
                } else if (isBetweenHeadTail) {
                  bgClass = "bg-indigo-500/10 border-indigo-500/25 text-indigo-400";
                }

                return (
                  <div
                    key={slotIdx}
                    className={`aspect-square rounded-sm border flex flex-col items-center justify-center font-mono text-[8px] relative group overflow-hidden transition-all ${bgClass}`}
                  >
                    <span>{slotIdx}</span>
                    <div className="absolute hidden group-hover:block bg-slate-950 border border-slate-800 text-white text-[9px] p-2 rounded w-44 z-50 text-left bottom-full mb-1 leading-normal shadow-xl">
                      <span className="font-bold text-emerald-400 block mb-0.5">Circular Memory Slot {slotIdx}</span>
                      <div>• Byte Offset: {currOffset.toLocaleString()}</div>
                      <div>• Size: {cellBytes.toLocaleString()} bytes</div>
                      <div>• Status: {isHeadSlot ? "ACTIVE READ HEAD" : isTailSlot ? "ACTIVE WRITE TAIL" : isBetweenHeadTail ? "UNCONSUMED BUFFERED DATA" : "AVAILABLE REGISTER SLOTS"}</div>
                      <div>• Bus Access: ZERO COPY OVERHEAD</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-[9px] font-mono text-slate-500 pt-3 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/60" />
                <span>Read Head Point (AuraCore Reader)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/60 animate-pulse" />
                <span>Write Tail Point (Net Threads stream writer)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500/10 border border-indigo-500/25" />
                <span>Committed Stream Queue (Zero-Copy Active)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Logs Tracker Table */}
      <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 font-mono">
            <Network className="w-4 h-4 text-emerald-400" />
            LIVE TENSOR SNIPPET CLASSIFICATION & PIPELINE STATUS LOGGER
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Scroll record logs tracking high-speed partial byte processing. Red entries represent blocked connections (where either a low content similarity or query context contamination was detected). Green represents streamed vectors processed in-place.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-mono text-[10px]">
                <th className="pb-2">TIMESTAMP</th>
                <th className="pb-2">STREAM SOURCE URL</th>
                <th className="pb-2">SEMANTIC COMPATIBILITY</th>
                <th className="pb-2">PIPELINE DECISION</th>
                <th className="pb-2">VECTOR PREVIEW (ON-THE-FLY RESULT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 font-mono text-[11px]">
              {networkLogs.map((log) => {
                let decisionText = "ACCEPTED & STREAMED";
                let pillClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                if (log.status === "context_reject") {
                  decisionText = "ABORT(0.15 CONTEXT DROP)";
                  pillClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                } else if (log.status === "aborted") {
                  decisionText = "ABORT(<0.70 MATCH)";
                  pillClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-950/40">
                    <td className="py-2.5 text-slate-600">{log.timestamp}</td>
                    <td className="py-2.5 font-semibold text-slate-300">
                      <span className="block max-w-[280px] truncate" title={log.url}>{log.url}</span>
                      <span className="text-[9px] text-slate-500 block truncate max-w-[280px] font-sans">{log.title}</span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${log.similarity >= 0.7 ? "text-emerald-400" : "text-rose-400"}`}>{(log.similarity * 100).toFixed(0)}%</span>
                        <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden inline-block border border-slate-900/50">
                          <div className={`h-full ${log.similarity >= 0.7 ? "bg-emerald-400" : "bg-rose-500"}`} style={{ width: `${log.similarity * 100}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-bold border ${pillClass}`}>
                        <span className={`w-1 h-1 rounded-full ${log.status === "accepted" ? "bg-emerald-400" : "bg-rose-400"}`} />
                        {decisionText}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 text-[10px]">
                      {log.status === "accepted" ? (
                        <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400/80">
                          <span>[</span>
                          {log.vectorPreview?.map((val, idx) => (
                            <span key={idx}>{val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}{idx < 7 && ", "}</span>
                          ))}
                          <span>]</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-sans italic">Connection severed early. Zero bytes parsed.</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
