/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Wifi, WifiOff, Activity, CheckCircle, Sliders, Download, Smartphone, Play, RefreshCw, Code } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuraContext } from "../store/AuraContext";

export const AndroidUiExportTab: React.FC = () => {
  const {
    offlineMode, setOfflineMode,
    crystallizeMetrics, setCrystallizeMetrics,
    exportStatus, setExportStatus,
    exportFormat, setExportFormat,
    crystallizing, setCrystallizing,
    crystallizationProgress, setCrystallizationProgress,
    exportPath, setExportPath,
    exportPrompt, setExportPrompt,
    selectedComposeCodeFile, setSelectedComposeCodeFile,
    crystallizeLogs, setCrystallizeLogs,
    ramWeightsCached, setRamWeightsCached,
    setCachedWeightsSize
  } = useAuraContext();

  const [copied, setCopied] = useState<boolean>(false);

  const handleStartCrystallization = () => {
    if (crystallizing) return;
    setCrystallizing(true);
    setCrystallizationProgress(0);
    setExportStatus("idle");
    setExportPath("");
    
    const timeStr = new Date().toTimeString().split(" ")[0];
    setCrystallizeLogs(prev => [
      ...prev,
      {
        id: Date.now() + "_c0",
        time: timeStr,
        msg: `JNI: Starting AuraCore crystallization for template: "${exportPrompt}"...`,
        type: "info"
      }
    ]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += offlineMode ? 5 : 10;
      if (progress > 100) progress = 100;
      
      setCrystallizationProgress(progress);
      const currTime = new Date().toTimeString().split(" ")[0];

      // Update metrics dynamically
      const simulatedGoodness = 0.85 + (progress / 100) * 1.99;
      const simulatedRate = offlineMode ? 0 : Math.round(2500 - (progress / 100) * 1200);
      const currentRank = progress < 40 ? 8 : progress < 85 ? 6 : 4;
      const cachedBatches = offlineMode ? Math.round((progress / 100) * 48) : 0;

      setCrystallizeMetrics({
        vectorsSec: simulatedRate,
        goodnessScore: simulatedGoodness,
        activeRank: currentRank,
        cachedBatches: cachedBatches
      });

      if (progress === 20) {
        setCrystallizeLogs(prev => [
          ...prev,
          {
            id: Date.now() + "_c20",
            time: currTime,
            msg: `CRYSTALLIZER: Tensor train rings contracting. Core indices converging. Goodness metrics converging nicely: ${(simulatedGoodness).toFixed(2)}`,
            type: "info"
          }
        ]);
      } else if (progress === 50) {
        setCrystallizeLogs(prev => [
          ...prev,
          {
            id: Date.now() + "_c50",
            time: currTime,
            msg: offlineMode 
              ? "RING_BUFFER: [Offline mode active] Connection lost. Running optimization with Accumulated Ring Cache blocks."
              : "STREAMER: Network streaming steady. Pipelining input vector channels directly into CacheAlignedArena.",
            type: offlineMode ? "warning" : "info"
          }
        ]);
      } else if (progress === 80) {
        setCrystallizeLogs(prev => [
          ...prev,
          {
            id: Date.now() + "_c80",
            time: currTime,
            msg: "CORE: Weights successfully consolidated. Performing orthogonal projection of low-rank components.",
            type: "info"
          }
        ]);
      } else if (progress === 100) {
        clearInterval(interval);
        setCrystallizing(false);
        setCrystallizeLogs(prev => [
          ...prev,
          {
            id: Date.now() + "_c100",
            time: currTime,
            msg: "COMPOSE: Crystallization complete! Model weights crystallized. Ready for serialization and MediaStore export.",
            type: "success"
          }
        ]);
      }
    }, offlineMode ? 350 : 200);
  };

  const handleExportModel = () => {
    if (exportStatus !== "idle" && exportStatus !== "completed") return;
    setExportStatus("serializing");
    
    const timeStr = new Date().toTimeString().split(" ")[0];
    setCrystallizeLogs(prev => [
      ...prev,
      {
        id: Date.now() + "_exp1",
        time: timeStr,
        msg: "CONVERTER: Extracting weights from native Memory Arena Cache...",
        type: "info"
      }
    ]);

    setTimeout(() => {
      setExportStatus("converting");
      const timeStr2 = new Date().toTimeString().split(" ")[0];
      setCrystallizeLogs(prev => [
        ...prev,
        {
          id: Date.now() + "_exp2",
          time: timeStr2,
          msg: exportFormat === "tflite" 
            ? "TFLITE: Generating FlatBuffer schema. Aligning 32-bit registers for floating interpreter loading."
            : "ONNX: Building Proto-Buffer weights payload. Boxing matrix transformations in sequential blocks.",
          type: "info"
        }
      ]);

      setTimeout(() => {
        setExportStatus("saving");
        const timeStr3 = new Date().toTimeString().split(" ")[0];
        setCrystallizeLogs(prev => [
          ...prev,
          {
            id: Date.now() + "_exp3",
            time: timeStr3,
            msg: `MEDIA_STORE: Contacting MediaStore API. Reserving file space under shared Downloads directory/auranexus_core_weights.${exportFormat}`,
            type: "info"
          }
        ]);

        setTimeout(() => {
          setExportStatus("completed");
          const savedPath = `/storage/emulated/0/Download/auranexus_core_weights_${Math.floor(Math.random() * 9000 + 1000)}.${exportFormat}`;
          setExportPath(savedPath);
          setRamWeightsCached(false); // Clean up caches to represent memory flushing
          setCachedWeightsSize("0 KB"); // Reset sizes
          
          const timeStr4 = new Date().toTimeString().split(" ")[0];
          setCrystallizeLogs(prev => [
            ...prev,
            {
              id: Date.now() + "_exp4",
              time: timeStr4,
              msg: `COMPOSE: Saved model successfully! Path: ${savedPath}. Native Memory allocations and structures have been completely flushed and cleared!`,
              type: "success"
            }
          ]);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const getSourceCode = (): string => {
    if (selectedComposeCodeFile === "CrystallizationScreen.kt") {
      return `package com.auranexus.core.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.flow.StateFlow

@Composable
fun CrystallizationScreen(
    promptText: String,
    onStartCrystallization: () -> Unit,
    crystallizing: Boolean,
    progress: Float,
    goodnessScore: StateFlow<Float>,
    vectorsPerSec: StateFlow<Int>,
    currentRank: StateFlow<Int>
) {
    val score by goodnessScore.collectAsState(0.85f)
    val speed by vectorsPerSec.collectAsState(2500)
    val rank by currentRank.collectAsState(4)
    
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF070913))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 1. Header with prompt
        Text(
            text = "Crystallizing Subspace Core",
            color = Color.White,
            fontSize = 20.sp,
            style = MaterialTheme.typography.titleLarge
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        // 2. Main Tensor Train Core Canvas Visualizer
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .background(Color(0xFF0A0D1A), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val nodeCount = 4
                val spacing = size.width / (nodeCount + 1)
                val centerY = size.height / 2f
                
                // Draw connecting lines with data animation flow
                for (i in 0 until nodeCount - 1) {
                    val startX = spacing * (i + 1)
                    val endX = spacing * (i + 2)
                    
                    drawLine(
                        brush = Brush.horizontalGradient(
                            colors = listOf(Color(0xFF10B981), Color(0xFF06B6D4))
                        ),
                        start = Offset(startX, centerY),
                        end = Offset(endX, centerY),
                        strokeWidth = 3f * if (crystallizing) pulseScale else 1f,
                    )
                }
                
                // Draw nodes with sizes depending on goodness and weights magnitudes
                for (i in 0 until nodeCount) {
                    val cx = spacing * (i + 1)
                    val radius = 24.dp.toPx() + (score * 5f)
                    
                    // Outer aura glow 
                    drawCircle(
                        color = Color(0x3310B981),
                        radius = radius * (1f + (pulseScale * 0.15f)),
                        center = Offset(cx, centerY)
                    )
                    // Inner node body
                    drawCircle(
                        color = Color(0xFF059669),
                        radius = radius,
                        center = Offset(cx, centerY)
                    )
                    // Core point circle
                    drawCircle(
                        color = Color.White,
                        radius = 6.dp.toPx(),
                        center = Offset(cx, centerY)
                    )
                }
            }
        }
    }
}`;
    } else if (selectedComposeCodeFile === "ModelExporter.kt") {
      return `package com.auranexus.core.export

import android.content.ContentValues
import android.content.Context
import android.os.Environment
import android.provider.MediaStore
import com.auranexus.core.AuraCoreBridge
import java.io.File
import java.io.FileOutputStream

object ModelExporter {
    
    fun exportToTfLite(context: Context, corePointer: Long): String {
        // 1. Pull core tensors from JNI CacheAlignedArena allocation
        val stateBytes = AuraCoreBridge.getModelState(corePointer)
            ?: throw IllegalStateException("Core weights not found in native memory")
            
        // 2. Synthesize TFLite/FlatBuffer format schema sequence
        val tfliteHeader = byteArrayOf(0x54, 0x46, 0x4c, 0x33) // "TFL3" schema signature
        val consolidatedFile = ByteArray(tfliteHeader.size + stateBytes.size)
        System.arraycopy(tfliteHeader, 0, consolidatedFile, 0, tfliteHeader.size)
        System.arraycopy(stateBytes, 0, consolidatedFile, tfliteHeader.size, stateBytes.size)
        
        // 3. Register public URI and write using MediaStore
        val resolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "auranexus_core_weights_\${System.currentTimeMillis()}.tflite")
            put(MediaStore.MediaColumns.MIME_TYPE, "application/octet-stream")
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        }
        
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            ?: throw IllegalStateException("MediaStore reservation failed")
            
        resolver.openOutputStream(uri)?.use { outputStream ->
            outputStream.write(consolidatedFile)
            outputStream.flush()
        }
        
        // 4. Perform complete zeroing and JNI memory structure cleanup
        AuraCoreBridge.destroyAuraCore(corePointer)
        
        return "/storage/emulated/0/Download/" + contentValues.get(MediaStore.MediaColumns.DISPLAY_NAME)
    }
}`;
    } else {
      return `package com.auranexus.core.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import kotlinx.coroutines.*
import java.net.SocketException

class BufferReceiverService : Service() {
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isOffline = false
    
    // Circular Cache Block: 16MB representation
    private val ringBuffer = ByteArray(16 * 1024 * 1024)
    private var head = 0
    private var tail = 0

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startStreamingMonitor()
        return START_STICKY
    }

    private fun startStreamingMonitor() {
        serviceScope.launch {
            while (isActive) {
                try {
                    if (!isOffline) {
                        pullStreamPackets()
                    } else {
                        // Offline gracefulness: optimize model solely on ring cache weights
                        optimizeUsingLocalRingCache()
                    }
                    delay(200)
                } catch (e: SocketException) {
                    isOffline = true
                    broadcastConnectionState(active = false)
                }
            }
        }
    }

    private fun pullStreamPackets() {
        // Enqueues network streaming bytes into ring buffer partitions directly
    }

    private fun optimizeUsingLocalRingCache() {
        // Run alignment using stored ring buffer structures only
    }

    private fun broadcastConnectionState(active: Boolean) {
        val intent = Intent("com.auranexus.CONNECTION_UPDATE").apply {
            putExtra("active", active)
        }
        sendBroadcast(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getSourceCode());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="col-span-12 space-y-6 text-[#A0AEC0]"
    >
      {/* Connection & Status Banner */}
      <AnimatePresence>
        {offlineMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-amber-400 font-mono"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/10 animate-pulse">
                <WifiOff className="w-5 h-5 text-amber-400" />
              </div>
              <div className="font-sans">
                <h4 className="text-xs font-bold font-mono tracking-wider uppercase">ОФФЛАЙН-РЕЖИМ (OFFLINE GRACEFULNESS)</h4>
                <p className="text-[11px] text-amber-500/80 leading-snug mt-0.5">
                  Связь потеряна. Работаю с накопленным кэшем. Tensor Train конвент оптимизируется на 16MB кольцевом буфере.
                </p>
              </div>
            </div>
            <div className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded font-bold uppercase tracking-wider animate-pulse whitespace-nowrap">
              Дошлифовка Активна
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">ИНТЕНСИВНОСТЬ ПОТОКА (RATE)</span>
          <div className="text-xl font-bold font-mono mt-1 text-white flex items-baseline gap-1">
            {crystallizeMetrics.vectorsSec.toLocaleString()}
            <span className="text-xs font-normal text-slate-500">вект/сек</span>
          </div>
          <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1.5 text-slate-400 font-semibold">
            <Activity className={`w-3.5 h-3.5 ${crystallizing && !offlineMode ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span>{offlineMode ? "Поток приостановлен" : "Кольцевой буфер активен"}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">КОНВЕРГЕНЦИЯ (GOODNESS)</span>
          <div className="text-xl font-bold font-mono mt-1 text-emerald-400">
            {crystallizeMetrics.goodnessScore === -1.0 ? "Waiting for core..." : crystallizeMetrics.goodnessScore.toFixed(4)}
          </div>
          <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1 text-slate-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {crystallizeMetrics.goodnessScore === -1.0
                ? "Инициализация тензора..."
                : crystallizeMetrics.goodnessScore >= 1.5
                ? "Сверхточная модель подтверждена"
                : "Идет кристаллизация..."}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">РАНГ ЯДРА TENSOR TRAIN</span>
          <div className="text-xl font-bold font-mono mt-1 text-cyan-400 flex items-baseline gap-1">
            R = {crystallizeMetrics.activeRank}
          </div>
          <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1 text-slate-400 font-semibold">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{crystallizeMetrics.activeRank > 4 ? "Сжатие субпространств..." : "Оптимальный ранг достигнут"}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0A0D1A] rounded-xl border border-slate-900 p-4 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">СОСТОЯНИЕ ЭКСПОРТА</span>
          <div className="text-xl font-bold font-mono mt-1 text-white flex items-baseline gap-1.5">
            <span className={exportStatus === "completed" ? "text-emerald-400 font-bold" : exportStatus !== "idle" ? "text-amber-400 animate-pulse font-bold" : "text-slate-400"}>
              {exportStatus === "idle" ? "ГОТОВ" : exportStatus.toUpperCase()}
            </span>
          </div>
          <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1 text-slate-400 font-semibold">
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{exportFormat.toUpperCase()} формат ({ramWeightsCached ? "Кэш RAM" : "Очищен"})</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Setup, Visualizer & Export controller */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Panel: Prompt input configurations (col-span-12 md:col-span-5) */}
        <div className="md:col-span-5 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 font-mono">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                ПАРАМЕТРЫ ИНИЦИАЛИЗАЦИИ ЗАДАЧИ
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                Определите целевую фразу и выберите формат сериализации. Локальный словарь Jetpack Compose предложит варианты автодополнения.
              </p>
            </div>

            {/* Input Prompt text with completion suggestions */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-500 font-bold block uppercase">
                Ввод целевого запроса / Шаблона
              </label>
              <input
                type="text"
                value={exportPrompt}
                onChange={(e) => setExportPrompt(e.target.value)}
                disabled={crystallizing}
                className="w-full text-xs font-sans px-3.5 py-2.5 rounded-lg border border-slate-900 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700 font-medium"
                placeholder="Введите задачу..."
              />

              {/* Auto-suggest pills */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-600 font-bold block uppercase">
                  Локальные автоподсказки (Dictionary):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "распознавание автомобильных номеров",
                    "видеоаналитика транспортного трафика",
                    "экспресс-классификация номеров"
                  ].map((pill) => (
                    <button
                      key={pill}
                      onClick={() => setExportPrompt(pill)}
                      disabled={crystallizing}
                      className={`text-[9.5px] px-2 py-1.5 rounded font-sans transition-all text-left ${
                        exportPrompt === pill
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold"
                          : "bg-slate-950 hover:bg-slate-900 text-slate-500 border border-slate-900 cursor-pointer font-medium"
                      }`}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Choose Target Format */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-mono text-slate-500 font-bold block uppercase">
                ЦЕЛЕВОЙ ФОРМАТ СОХРАНЕНИЯ ОБУЧЕННОЙ СЕТИ
              </label>
              <div className="grid grid-cols-2 gap-3 font-mono">
                {(["tflite", "onnx"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    disabled={crystallizing}
                    className={`py-2.5 px-3 flex items-center justify-between rounded-lg border text-xs font-bold uppercase transition cursor-pointer ${
                      exportFormat === fmt
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        : "bg-slate-950 border-slate-900 hover:bg-slate-900 text-slate-500"
                    }`}
                  >
                    <span>{fmt === "tflite" ? "TensorFlow Lite" : "ONNX Bundle"}</span>
                    <span className="text-[9px] font-normal text-slate-500 font-mono">.{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Offline mode gracefulness toggle test */}
            <div className="pt-2 bg-slate-950 p-3.5 rounded-lg border border-slate-900/60 flex items-center justify-between gap-4 font-mono">
              <div className="space-y-0.5 leading-snug">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">ОФФЛАЙН ГАСИТЕЛЬ (SHIELD TEST)</span>
                <p className="text-[9px] text-[#718096] font-sans">Переключить offline-режим для вызова кольцевой буферизации.</p>
              </div>
              <button
                onClick={() => {
                  setOfflineMode(!offlineMode);
                  const timeStr = new Date().toTimeString().split(" ")[0];
                  setCrystallizeLogs(prev => [
                    ...prev,
                    {
                      id: Date.now() + "_off",
                      time: timeStr,
                      msg: !offlineMode 
                        ? "RING_BUFFER: Internet connection dropped! Running optimized offline convergence iterations."
                        : "RING_BUFFER: Connections restored. Seamlessly re-established server metrics streaming.",
                      type: !offlineMode ? "warning" : "success"
                    }
                  ]);
                }}
                className={`px-3 py-1.5 rounded text-[9px] font-mono font-bold transition uppercase flex items-center gap-1 border cursor-pointer ${
                  offlineMode
                    ? "bg-amber-600/10 text-amber-400 border-amber-500/20"
                    : "bg-[#0A161E] text-cyan-400 border-cyan-500/10"
                }`}
              >
                {offlineMode ? (
                  <>
                    <WifiOff className="w-3 h-3 animate-pulse text-amber-500" />
                    Offline
                  </>
                ) : (
                  <>
                    <Wifi className="w-3 h-3 text-cyan-400" />
                    Online
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Start Crystallization controls */}
          <div className="pt-4 border-t border-slate-900 space-y-3 font-mono">
            <button
              onClick={handleStartCrystallization}
              disabled={crystallizing}
              className={`w-full py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 uppercase text-xs tracking-wider ${
                crystallizing
                  ? "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/10 cursor-pointer"
              }`}
            >
              {crystallizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Конденсация Сети ({crystallizationProgress}%)
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Начать Кристаллизацию
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Crystallization Visualizer Canvas Simulator (col-span-12 md:col-span-7) */}
        <div className="md:col-span-7 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  CRYSTALLIZATION VISUALIZER (JETPACK COMPOSE)
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans leading-relaxed">
                  Интерактивный граф ядер Tensor Train. Размер и интенсивность свечения узлов отображают текущий Goodness Score.
                </p>
              </div>
            </div>
          </div>

          {/* Canvas block rendering Tensor core layout with floating data particles */}
          <div className="relative bg-[#070913] rounded-xl border border-slate-900 p-4 h-64 flex flex-col items-center justify-center overflow-hidden">
            
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            {/* Nodes Connector Lines and floating particles */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <line
                x1="12.5%" y1="50%" x2="37.5%" y2="50%"
                stroke={crystallizing ? "#14b8a6" : "#1e293b"}
                strokeWidth="2"
                strokeDasharray={crystallizing ? "5,5" : "0"}
                className={crystallizing ? "animate-[dash_10s_linear_infinite]" : ""}
              />
              <line
                x1="37.5%" y1="50%" x2="62.5%" y2="50%"
                stroke={crystallizing ? "#06b6d4" : "#1e293b"}
                strokeWidth="2"
                strokeDasharray={crystallizing ? "5,5" : "0"}
                className={crystallizing ? "animate-[dash_10s_linear_infinite]" : ""}
              />
              <line
                x1="62.5%" y1="50%" x2="87.5%" y2="50%"
                stroke={crystallizing ? "#3b82f6" : "#1e293b"}
                strokeWidth="2"
                strokeDasharray={crystallizing ? "5,5" : "0"}
                className={crystallizing ? "animate-[dash_10s_linear_infinite]" : ""}
              />

              {/* Floating Vector Stream particles */}
              {crystallizing && (
                <>
                  <circle r="4" fill="#22d3ee" className="animate-[moveParticle1_2s_linear_infinite]" />
                  <circle r="4" fill="#34d399" className="animate-[moveParticle2_2.5s_linear_infinite]" />
                  <circle r="3" fill="#60a5fa" className="animate-[moveParticle3_1.8s_linear_infinite]" />
                </>
              )}
            </svg>

            {/* The physical Render of nodes (Tensors) */}
            <div className="relative z-10 w-full flex justify-around items-center h-full">
              {[
                { id: 1, name: "Core 1", shape: "8 × 4 × 4" },
                { id: 2, name: "Core 2", shape: "4 × 8 × 4" },
                { id: 3, name: "Core 3", shape: "4 × 4 × 8" },
                { id: 4, name: "Core 4", shape: "8 × 8 × 8" }
              ].map((item, idx) => {
                const pulseScale = crystallizing ? (idx % 2 === 0 ? "scale-105 shadow-cyan-500/25" : "scale-95 shadow-emerald-500/25") : "scale-100";
                const activeGlow = crystallizing ? "border-cyan-450 bg-[#0F1C2A]" : "border-slate-800 bg-slate-950";
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300 ${pulseScale} ${activeGlow} w-24`}
                  >
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500">{item.name}</span>
                    <div className="w-8 h-8 rounded-full bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-center my-1.5 text-[9px] font-mono text-cyan-400 font-bold">
                      R={crystallizeMetrics.activeRank}
                    </div>
                    <span className="text-[9px] font-mono font-medium text-slate-400">{item.shape}</span>
                  </div>
                );
              })}
            </div>

            {/* CSS styles injected internally for the node animations */}
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -100;
                }
              }
              @keyframes moveParticle1 {
                0% { cx: 12.5%; cy: 50%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { cx: 87.5%; cy: 50%; opacity: 0; }
              }
              @keyframes moveParticle2 {
                0% { cx: 12.5%; cy: 50%; opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { cx: 87.5%; cy: 50%; opacity: 0; }
              }
              @keyframes moveParticle3 {
                0% { cx: 12.5%; cy: 50%; opacity: 0; }
                5% { opacity: 1; }
                95% { opacity: 1; }
                100% { cx: 87.5%; cy: 50%; opacity: 0; }
              }
            `}</style>
          </div>

          {/* Model Exporter Control Action */}
          <div className="pt-2">
            <div className="bg-slate-950 rounded-xl border border-slate-900/80 p-4 space-y-4 font-mono text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2.5">
                <span className="text-slate-500 font-bold uppercase block text-[9.5px]">MODEL EXPORTER (SHARED DOWNLOADS)</span>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MediaStore API Bound</span>
                </div>
              </div>

              {/* Stepper showing the progress of serialisation process */}
              <div className="grid grid-cols-4 gap-2 font-mono text-[9px]">
                {[
                  { label: "1. Serialize", active: exportStatus === "serializing" || exportStatus === "converting" || exportStatus === "saving" || exportStatus === "completed" },
                  { label: "2. Convert", active: exportStatus === "converting" || exportStatus === "saving" || exportStatus === "completed" },
                  { label: "3. MediaStore", active: exportStatus === "saving" || exportStatus === "completed" },
                  { label: "4. Memory Purge", active: exportStatus === "completed" }
                ].map((step, sIdx) => (
                  <div 
                    key={sIdx}
                    className={`p-2 rounded text-center border font-semibold ${
                      step.active 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold" 
                        : "bg-[#070913] text-zinc-505 border-slate-900"
                    }`}
                  >
                    {step.label}
                  </div>
                ))}
              </div>

              {/* Action buttons and File Exporter */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-0.5 leading-snug">
                  <span className="text-[8.5px] font-bold text-slate-500 uppercase block">TARGET SAVE FILE PATH:</span>
                  <span className="text-white font-bold block overflow-x-auto select-all max-w-sm whitespace-nowrap bg-slate-950 px-2 py-1 rounded border border-slate-900">
                    {exportPath || `/storage/emulated/0/Download/auranexus_core_weights.${exportFormat}`}
                  </span>
                </div>

                <button
                  onClick={handleExportModel}
                  disabled={crystallizing || exportStatus === "serializing" || exportStatus === "converting" || exportStatus === "saving"}
                  className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 uppercase whitespace-nowrap cursor-pointer ${
                    crystallizing || exportStatus === "serializing" || exportStatus === "converting" || exportStatus === "saving"
                      ? "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer"
                  }`}
                >
                  {exportStatus === "serializing" || exportStatus === "converting" || exportStatus === "saving" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Export Model Weights
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shaders and compute engine codes inline renderer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Visual logs term */}
        <div className="md:col-span-6 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 font-mono">
            <h3 className="text-xs font-bold text-slate-300 tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-cyan-400 border border-cyan-500 animate-pulse rounded-full" />
              JETPACK COMPOSE LOG CONSOLE
            </h3>
            <button
              onClick={() => setCrystallizeLogs([])}
              className="text-[9px] text-slate-500 hover:text-slate-300 transition uppercase cursor-pointer"
            >
              CLEAR TERMINAL
            </button>
          </div>

          <div className="h-64 bg-slate-950 rounded-xl border border-slate-900/80 p-4 font-mono text-[10px] overflow-y-auto space-y-2 select-text whitespace-pre-wrap leading-relaxed">
            {crystallizeLogs.length === 0 ? (
              <div className="text-slate-600 italic text-center pt-24 font-sans">No live Compose context initialized yet. Run crystallization.</div>
            ) : (
              crystallizeLogs.map((log) => {
                let colorClass = "text-[#A0AEC0]";
                if (log.type === "success") {
                  colorClass = "text-emerald-400 font-bold";
                } else if (log.type === "warning") {
                  colorClass = "text-amber-400 font-bold";
                }

                return (
                  <div key={log.id} className="border-b border-slate-900/60 pb-1.5 last:border-0 leading-normal">
                    <span className="text-slate-600">[{log.time}]</span>{" "}
                    <span className={colorClass}>{log.msg}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Source code viewer */}
        <div className="md:col-span-6 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-6 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-3">
            <h3 className="text-xs font-bold text-slate-300 tracking-widest flex items-center gap-1.5">
              <Code className="w-4 h-4 text-cyan-400" />
              JETPACK COMPOSE SOURCE CODE (TS №6)
            </h3>

            {/* Bridge file selections */}
            <div className="flex bg-slate-950 p-0.5 rounded border border-slate-900 select-none">
              {(["CrystallizationScreen.kt", "ModelExporter.kt", "BufferReceiverService.kt"] as const).map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedComposeCodeFile(file)}
                  className={`px-2 py-1 rounded text-[9px] transition uppercase cursor-pointer ${
                    selectedComposeCodeFile === file
                      ? "bg-[#111A23] text-cyan-400 font-bold border border-cyan-500/10"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {file === "CrystallizationScreen.kt" ? "Screen" : file === "ModelExporter.kt" ? "Exporter" : "Service"}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="h-64 bg-slate-950 rounded-xl border border-slate-900 p-4 overflow-y-auto font-mono text-[9px] text-[#A0AEC0] whitespace-pre leading-relaxed select-text font-medium">
              {getSourceCode()}
            </div>
            
            <button
              onClick={handleCopyCode}
              className="absolute top-2.5 right-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-mono text-[8px] font-bold px-2 py-1 rounded transition whitespace-nowrap cursor-pointer z-10 select-none uppercase font-semibold"
            >
              {copied ? "COPIED CODE!" : "COPY FILE"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
