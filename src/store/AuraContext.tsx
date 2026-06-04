/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  TensorCoreTS, 
  TrainingHistoryPoint, 
  ChatMessage,
  ActiveTabType,
  SelectedRustFileType,
  ActiveBackendType,
  SelectedVulkanShaderFileType,
  PrecisionTypeType,
  PacingStatusType,
  AndroidLifecycleType,
  SelectedPacingCodeFileType,
  ExportFormatType,
  ExportStatusType,
  SelectedComposeCodeFileType,
  ShapeResultType,
  ActiveStabilityCodeFileType,
  SelectedSafetyCodeFileType
} from "../types";
import { generateSineWave, generateNoisySignal } from "../utils/generators";

interface AuraContextValue {
  // --- Simulation Settings ---
  inputDim: number;
  setInputDim: React.Dispatch<React.SetStateAction<number>>;
  numLayers: number;
  setNumLayers: React.Dispatch<React.SetStateAction<number>>;
  initialRank: number;
  setInitialRank: React.Dispatch<React.SetStateAction<number>>;
  learningRate: number;
  setLearningRate: React.Dispatch<React.SetStateAction<number>>;
  threshold: number;
  setThreshold: React.Dispatch<React.SetStateAction<number>>;

  // --- Real-time Training States ---
  cores: TensorCoreTS[];
  setCores: React.Dispatch<React.SetStateAction<TensorCoreTS[]>>;
  posInput: number[];
  setPosInput: React.Dispatch<React.SetStateAction<number[]>>;
  negInput: number[];
  setNegInput: React.Dispatch<React.SetStateAction<number[]>>;
  posGoodness: number;
  setPosGoodness: React.Dispatch<React.SetStateAction<number>>;
  negGoodness: number;
  setNegGoodness: React.Dispatch<React.SetStateAction<number>>;
  trainingHistory: TrainingHistoryPoint[];
  setTrainingHistory: React.Dispatch<React.SetStateAction<TrainingHistoryPoint[]>>;
  stepCount: number;
  setStepCount: React.Dispatch<React.SetStateAction<number>>;
  isTraining: boolean;
  setIsTraining: React.Dispatch<React.SetStateAction<boolean>>;
  trainSpeed: number;
  setTrainSpeed: React.Dispatch<React.SetStateAction<number>>;

  // --- UI Interactivity ---
  selectedCoreIdx: number;
  setSelectedCoreIdx: React.Dispatch<React.SetStateAction<number>>;
  activeTab: ActiveTabType;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTabType>>;
  selectedRustFile: SelectedRustFileType;
  setSelectedRustFile: React.Dispatch<React.SetStateAction<SelectedRustFileType>>;

  // --- Hardware Acceleration ---
  activeBackend: ActiveBackendType;
  setActiveBackend: React.Dispatch<React.SetStateAction<ActiveBackendType>>;
  selectedVulkanShaderFile: SelectedVulkanShaderFileType;
  setSelectedVulkanShaderFile: React.Dispatch<React.SetStateAction<SelectedVulkanShaderFileType>>;
  precisionType: PrecisionTypeType;
  setPrecisionType: React.Dispatch<React.SetStateAction<PrecisionTypeType>>;
  benchmarking: boolean;
  setBenchmarking: React.Dispatch<React.SetStateAction<boolean>>;
  benchmarkProgress: number;
  setBenchmarkProgress: React.Dispatch<React.SetStateAction<number>>;
  benchmarkResults: {
    cpu: number;
    gpu: number;
    npu: number;
    lossDelta: number;
    errorRate: number;
  };
  setBenchmarkResults: React.Dispatch<React.SetStateAction<{
    cpu: number;
    gpu: number;
    npu: number;
    lossDelta: number;
    errorRate: number;
  }>>;
  npuCertified: boolean;
  setNpuCertified: React.Dispatch<React.SetStateAction<boolean>>;
  vulkanLogs: any[];
  setVulkanLogs: React.Dispatch<React.SetStateAction<any[]>>;

  // --- Android NDK & Thermal Pacing ---
  cpuTemp: number;
  setCpuTemp: React.Dispatch<React.SetStateAction<number>>;
  pacingStatus: PacingStatusType;
  setPacingStatus: React.Dispatch<React.SetStateAction<PacingStatusType>>;
  pacingDelay: number;
  setPacingDelay: React.Dispatch<React.SetStateAction<number>>;
  androidLifecycle: AndroidLifecycleType;
  setAndroidLifecycle: React.Dispatch<React.SetStateAction<AndroidLifecycleType>>;
  tempHistory: { time: string; temp: number; rate: number }[];
  setTempHistory: React.Dispatch<React.SetStateAction<{ time: string; temp: number; rate: number }[]>>;
  autoHeatEnabled: boolean;
  setAutoHeatEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  ramWeightsCached: boolean;
  setRamWeightsCached: React.Dispatch<React.SetStateAction<boolean>>;
  cachedWeightsSize: string;
  setCachedWeightsSize: React.Dispatch<React.SetStateAction<string>>;
  activeModelPtr: string;
  setActiveModelPtr: React.Dispatch<React.SetStateAction<string>>;
  pacingIterationHz: number;
  setPacingIterationHz: React.Dispatch<React.SetStateAction<number>>;
  ndkLogs: any[];
  setNdkLogs: React.Dispatch<React.SetStateAction<any[]>>;
  selectedPacingCodeFile: SelectedPacingCodeFileType;
  setSelectedPacingCodeFile: React.Dispatch<React.SetStateAction<SelectedPacingCodeFileType>>;

  // --- Expansion Logs ---
  expansionHistory: string[];
  setExpansionHistory: React.Dispatch<React.SetStateAction<string[]>>;

  // --- Local Syntax Parser Chat ---
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  userQuery: string;
  setUserQuery: React.Dispatch<React.SetStateAction<string>>;
  isLoadingAI: boolean;
  setIsLoadingAI: React.Dispatch<React.SetStateAction<boolean>>;

  // --- Network Stream ---
  streamQuery: string;
  setStreamQuery: React.Dispatch<React.SetStateAction<string>>;
  streamingActive: boolean;
  setStreamingActive: React.Dispatch<React.SetStateAction<boolean>>;
  streamSpeed: number;
  setStreamSpeed: React.Dispatch<React.SetStateAction<number>>;
  backpressureActive: boolean;
  setBackpressureActive: React.Dispatch<React.SetStateAction<boolean>>;
  bufferHead: number;
  setBufferHead: React.Dispatch<React.SetStateAction<number>>;
  bufferTail: number;
  setBufferTail: React.Dispatch<React.SetStateAction<number>>;
  networkLogs: any[];
  setNetworkLogs: React.Dispatch<React.SetStateAction<any[]>>;

  // --- Compose UI & Exporter ---
  exportPrompt: string;
  setExportPrompt: React.Dispatch<React.SetStateAction<string>>;
  exportFormat: ExportFormatType;
  setExportFormat: React.Dispatch<React.SetStateAction<ExportFormatType>>;
  crystallizing: boolean;
  setCrystallizing: React.Dispatch<React.SetStateAction<boolean>>;
  crystallizationProgress: number;
  setCrystallizationProgress: React.Dispatch<React.SetStateAction<number>>;
  offlineMode: boolean;
  setOfflineMode: React.Dispatch<React.SetStateAction<boolean>>;
  exportPath: string;
  setExportPath: React.Dispatch<React.SetStateAction<string>>;
  exportStatus: ExportStatusType;
  setExportStatus: React.Dispatch<React.SetStateAction<ExportStatusType>>;
  selectedComposeCodeFile: SelectedComposeCodeFileType;
  setSelectedComposeCodeFile: React.Dispatch<React.SetStateAction<SelectedComposeCodeFileType>>;
  crystallizeLogs: any[];
  setCrystallizeLogs: React.Dispatch<React.SetStateAction<any[]>>;
  crystallizeMetrics: {
    vectorsSec: number;
    goodnessScore: number;
    activeRank: number;
    cachedBatches: number;
  };
  setCrystallizeMetrics: React.Dispatch<React.SetStateAction<{
    vectorsSec: number;
    goodnessScore: number;
    activeRank: number;
    cachedBatches: number;
  }>>;

  // --- Stability/Precision (TS #7) ---
  stressTesting: boolean;
  setStressTesting: React.Dispatch<React.SetStateAction<boolean>>;
  stressSteps: number;
  setStressSteps: React.Dispatch<React.SetStateAction<number>>;
  stressWeightsRange: [number, number];
  setStressWeightsRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  movingAvgVec: number[];
  setMovingAvgVec: React.Dispatch<React.SetStateAction<number[]>>;
  movingStdVec: number[];
  setMovingStdVec: React.Dispatch<React.SetStateAction<number[]>>;
  stagnationSteps: number;
  setStagnationSteps: React.Dispatch<React.SetStateAction<number>>;
  simpleDataMode: boolean;
  setSimpleDataMode: React.Dispatch<React.SetStateAction<boolean>>;
  imageGrid: number[];
  setImageGrid: React.Dispatch<React.SetStateAction<number[]>>;
  convolvedGrid: number[];
  setConvolvedGrid: React.Dispatch<React.SetStateAction<number[]>>;
  cnnTrainProgress: { epoch: number; squareAcc: number; circleAcc: number }[];
  setCnnTrainProgress: React.Dispatch<React.SetStateAction<{ epoch: number; squareAcc: number; circleAcc: number }[]>>;
  cnnTraining: boolean;
  setCnnTraining: React.Dispatch<React.SetStateAction<boolean>>;
  cnnEpochs: number;
  setCnnEpochs: React.Dispatch<React.SetStateAction<number>>;
  shapeResult: ShapeResultType;
  setShapeResult: React.Dispatch<React.SetStateAction<ShapeResultType>>;
  activeStabilityCodeFile: ActiveStabilityCodeFileType;
  setActiveStabilityCodeFile: React.Dispatch<React.SetStateAction<ActiveStabilityCodeFileType>>;

  // --- Memory Safety & Benchmarking (TS #9) ---
  selectedSafetyCodeFile: SelectedSafetyCodeFileType;
  setSelectedSafetyCodeFile: React.Dispatch<React.SetStateAction<SelectedSafetyCodeFileType>>;
  unsafeCount: number;
  setUnsafeCount: React.Dispatch<React.SetStateAction<number>>;
  integrityValid: boolean;
  setIntegrityValid: React.Dispatch<React.SetStateAction<boolean>>;
  fuzzingActive: boolean;
  setFuzzingActive: React.Dispatch<React.SetStateAction<boolean>>;
  fuzzLogs: any[];
  setFuzzLogs: React.Dispatch<React.SetStateAction<any[]>>;
  benchRunning: boolean;
  setBenchRunning: React.Dispatch<React.SetStateAction<boolean>>;
  stressTesting10k: boolean;
  setStressTesting10k: React.Dispatch<React.SetStateAction<boolean>>;
  stress10kProgress: number;
  setStress10kProgress: React.Dispatch<React.SetStateAction<number>>;
  stress10kLogs: any[];
  setStress10kLogs: React.Dispatch<React.SetStateAction<any[]>>;

  // --- Global Functions ---
  reinitializeNetwork: () => void;
  computeForwardTS: (input: number[], currCores: TensorCoreTS[]) => number;
  executeTrainStep: () => void;
  executeOrthogonalExpansion: () => void;
  handleRegenerateSignals: (type: "sine" | "step" | "pulse") => void;
  updateSobelFeedback: (flatGrid: number[]) => void;

}

const AuraContext = createContext<AuraContextValue | undefined>(undefined);

export const useAuraContext = () => {
  const context = useContext(AuraContext);
  if (!context) {
    throw new Error("useAuraContext must be used within an AuraContextProvider");
  }
  return context;
};

export const AuraContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Simulation Settings ---
  const [inputDim, setInputDim] = useState<number>(8);
  const [numLayers, setNumLayers] = useState<number>(4);
  const [initialRank, setInitialRank] = useState<number>(2);
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [threshold, setThreshold] = useState<number>(2.0);

  // --- Real-time Training States ---
  const [cores, setCores] = useState<TensorCoreTS[]>([]);
  const [posInput, setPosInput] = useState<number[]>([]);
  const [negInput, setNegInput] = useState<number[]>([]);
  const [posGoodness, setPosGoodness] = useState<number>(0);
  const [negGoodness, setNegGoodness] = useState<number>(0);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryPoint[]>([]);
  const [stepCount, setStepCount] = useState<number>(0);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainSpeed, setTrainSpeed] = useState<number>(30); // ms interval

  // --- UI Interactivity ---
  const [selectedCoreIdx, setSelectedCoreIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"visualizer" | "rust-code" | "math-guide" | "memory-cache" | "network-stream" | "android-pacing" | "hardware-acceleration" | "android-ui-export" | "stability-precision">("visualizer");
  const [selectedRustFile, setSelectedRustFile] = useState<"lib.rs" | "Cargo.toml" | "Unit Tests" | "aura-jni.cpp">("lib.rs");

  // --- Hardware Acceleration ---
  const [activeBackend, setActiveBackend] = useState<"CPU (NEON)" | "GPU (Vulkan)" | "NPU (NNAPI)">("CPU (NEON)");
  const [selectedVulkanShaderFile, setSelectedVulkanShaderFile] = useState<"tensor_forward.comp" | "DynamicSelector.rs" | "PrecisionConverter.rs" | "ash_bridge.rs">("tensor_forward.comp");
  const [precisionType, setPrecisionType] = useState<"FP32" | "FP16" | "INT8">("FP16");
  const [benchmarking, setBenchmarking] = useState<boolean>(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState<number>(0);
  const [benchmarkResults, setBenchmarkResults] = useState<{
    cpu: number;
    gpu: number;
    npu: number;
    lossDelta: number;
    errorRate: number;
  }>({
    cpu: 12.8,
    gpu: 3.42,
    npu: 1.05,
    lossDelta: 0.0028,
    errorRate: 0.045
  });
  const [npuCertified, setNpuCertified] = useState<boolean>(true);
  const [vulkanLogs, setVulkanLogs] = useState<any[]>([
    { id: 1, time: "10:06:01", service: "VULKAN", type: "info", msg: "Creating Vulkan Instance. Version: 1.3. Khronos validation layers engaged." },
    { id: 2, time: "10:06:02", service: "VULKAN", type: "info", msg: "Physical Device query completed: Adreno (TM) 740 matching user target GPU." },
    { id: 3, time: "10:06:03", service: "VULKAN", type: "success", msg: "ash bridge linked. AHardwareBuffer imported directly as zero-copy VkBuffer memory descriptor." },
    { id: 4, time: "10:06:04", service: "NNAPI", type: "info", msg: "Detecting hardware neural engines: Snapdragon Hexagon DSP NPU Driver active." }
  ]);

  // --- Android NDK & Thermal Pacing ---
  const [cpuTemp, setCpuTemp] = useState<number>(34.5);
  const [pacingStatus, setPacingStatus] = useState<"Full Speed" | "Throttling" | "Emergency Stop">("Full Speed");
  const [pacingDelay, setPacingDelay] = useState<number>(0);
  const [androidLifecycle, setAndroidLifecycle] = useState<"Active" | "Paused" | "Destroyed">("Active");
  const [tempHistory, setTempHistory] = useState<{ time: string; temp: number; rate: number }[]>([
    { time: "0s", temp: 33.2, rate: 100 },
    { time: "4s", temp: 34.0, rate: 100 },
    { time: "8s", temp: 34.5, rate: 100 },
  ]);
  const [autoHeatEnabled, setAutoHeatEnabled] = useState<boolean>(false);
  const [ramWeightsCached, setRamWeightsCached] = useState<boolean>(false);
  const [cachedWeightsSize, setCachedWeightsSize] = useState<string>("0 KB");
  const [activeModelPtr, setActiveModelPtr] = useState<string>("0x7FFF3D28E010");
  const [pacingIterationHz, setPacingIterationHz] = useState<number>(120);
  const [ndkLogs, setNdkLogs] = useState<any[]>([
    { id: 1, time: "10:05:01", service: "JNI", msg: "com_auranexus_core_AuraCoreBridge_initAuraCore active. CacheAlignedArena 16MB mapped at 0x7FFF3D28E010." },
    { id: 2, time: "10:05:02", service: "JNI", msg: "AuraCore thread pool spawned. High-precision 64-register vectorized execution ready." },
    { id: 3, time: "10:05:04", service: "THERM", msg: "HardwarePropertiesManager bounds registered. Thermal polling running @ 2Hz." }
  ]);
  const [selectedPacingCodeFile, setSelectedPacingCodeFile] = useState<"aura-jni.cpp" | "AuraCoreBridge.kt" | "ThermalPacingManager.kt">("aura-jni.cpp");

  // --- Expansion History ---
  const [expansionHistory, setExpansionHistory] = useState<string[]>([
    "Kernel initialised. Subspace dimensions configured.",
  ]);

  // --- Chat ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Локальный синтаксический симулятор AuraNexus активен [Pure Local Monolith]. Все вычисления и распознавание ключевых фраз выполняются полностью офлайн.\n\nВведите запрос, содержащий ключевые слова для авто-конфигурации Tensor Train:\n• 'распознавание' (оптимально для высокоточных моделей)\n• 'номера' (для цифровых и дискретных последовательностей)\n• 'свет' (ультра-легкий мобильный режим)\n\nНажмите 'Применить конфигурацию' на всплывающих подсказках для мгновенного обновления параметров.",
    },
  ]);
  const [userQuery, setUserQuery] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);

  // --- Network Stream ---
  const [streamQuery, setStreamQuery] = useState<string>("автомобильные номера");
  const [streamingActive, setStreamingActive] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(10); // Mbps
  const [backpressureActive, setBackpressureActive] = useState<boolean>(false);
  const [bufferHead, setBufferHead] = useState<number>(1820300);
  const [bufferTail, setBufferTail] = useState<number>(2940200);
  const [networkLogs, setNetworkLogs] = useState<any[]>([
    {
      id: 1,
      url: "https://ru.autonum.ru/catalog/plates",
      title: "База Автомобильных Номеров РФ • Поиск по регионам",
      h1: "Реестр Государственных Знаков",
      length: "2.4 KB (Clipped HEAD chunk)",
      similarity: 0.95,
      status: "accepted",
      timestamp: "08:41:02",
      contentSnippet: "<html><head><title>База Автомобильных Номеров РФ • Поиск</title></head><body><h1>Реестр Государственных Знаков</h1><p>База содержит актуальные государственные знаки всех регионов...</p></body></html>",
      vectorPreview: [0.35, 0.12, 0.58, -0.22, 0.71, 0.05, 0.38, -0.19],
    },
    {
      id: 2,
      url: "https://mvideo.ru/catalog/smartphones",
      title: "Купить телефон, выбрать сотовый аппарат новинки",
      h1: "Абонентские Номера Телефонов",
      length: "2.1 KB (Clipped HEAD chunk)",
      similarity: 0.18,
      status: "context_reject",
      timestamp: "08:41:09",
      contentSnippet: "<html><head><title>Купить сотовый телефон</title></head><body><h1>Абонентские Номера Телефонов</h1><p>Выгодная цена на размеры одежды и чехлы для сотовых телефонов...</p></body></html>",
      vectorPreview: [],
    },
    {
      id: 3,
      url: "https://premium-gos-nomera.ru/msk",
      title: "Продажа премиальных автономеров ГИБДД Москва",
      h1: "Красивые Автономера РФ",
      length: "2.0 KB (Clipped HEAD chunk)",
      similarity: 0.89,
      status: "accepted",
      timestamp: "08:41:15",
      contentSnippet: "<html><head><title>Продажа премиальных автономеров</title></head><body><h1>Красивые Автономера РФ</h1><p>Продажа красивых спец номеров для вашего автомобиля серии АМР...</p></body></html>",
      vectorPreview: [0.12, -0.44, 0.61, 0.29, -0.11, 0.53, 0.22, -0.05],
    },
    {
      id: 4,
      url: "https://wildberries.ru/clothes/women-size",
      title: "Женская одежда, платья всех размеров купить",
      h1: "Размерная таблица одежды • Номер по ГОСТ",
      length: "1.9 KB (Clipped HEAD chunk)",
      similarity: 0.05,
      status: "context_reject",
      timestamp: "08:41:22",
      contentSnippet: "<html><head><title>Женская одежда больших размеров</title></head><body><h1>Размерная таблица одежды</h1><p>Каталог модной женской одежды больших размеров, номер по ГОСТ...</p></body></html>",
      vectorPreview: [],
    },
    {
      id: 5,
      url: "https://auto-registrator.org/faq",
      title: "Справочник автолюбителя • Как получить знак",
      h1: "Автомобильные номера",
      length: "2.5 KB (Clipped HEAD chunk)",
      similarity: 0.72,
      status: "accepted",
      timestamp: "08:41:35",
      contentSnippet: "<html><head><title>Справочник автолюбителя</title></head><body><h1>Автомобильные номера</h1><p>Пошаговый процесс регистрации и выдачи государственных автомобильных знаков в ГАИ...</p></body></html>",
      vectorPreview: [-0.18, 0.65, 0.22, -0.31, 0.44, -0.15, 0.41, 0.09],
    }
  ]);

  // --- Compose UI & Exporter ---
  const [exportPrompt, setExportPrompt] = useState<string>("распознавание автомобильных номеров");
  const [exportFormat, setExportFormat] = useState<"tflite" | "onnx">("tflite");
  const [crystallizing, setCrystallizing] = useState<boolean>(false);
  const [crystallizationProgress, setCrystallizationProgress] = useState<number>(0);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [exportPath, setExportPath] = useState<string>("");
  const [exportStatus, setExportStatus] = useState<"idle" | "serializing" | "converting" | "saving" | "completed">("idle");
  const [selectedComposeCodeFile, setSelectedComposeCodeFile] = useState<"CrystallizationScreen.kt" | "ModelExporter.kt" | "BufferReceiverService.kt">("CrystallizationScreen.kt");
  const [crystallizeLogs, setCrystallizeLogs] = useState<any[]>([
    { id: 1, time: "11:10:01", msg: "COMPOSE: MainActivity onCreate invoked. Binding Jetpack Compose screen...", type: "info" },
    { id: 2, time: "11:10:03", msg: "COMPOSE: StateFlow of Core metrics registered. Initializing Canvas rendering at 60 FPS.", type: "info" },
    { id: 3, time: "11:10:05", msg: "RING_BUFFER: Ring cache memory queue initialized at 16MB. Ready to proxy stream input.", type: "success" }
  ]);
  const [crystallizeMetrics, setCrystallizeMetrics] = useState<{
    vectorsSec: number;
    goodnessScore: number;
    activeRank: number;
    cachedBatches: number;
  }>({
    vectorsSec: 2500,
    goodnessScore: 0.85,
    activeRank: 4,
    cachedBatches: 0
  });

  // --- TS #7: Stability & Precision ---
  const [stressTesting, setStressTesting] = useState(false);
  const [stressSteps, setStressSteps] = useState(0);
  const [stressWeightsRange, setStressWeightsRange] = useState<[number, number]>([-0.45, 0.48]);
  const [movingAvgVec, setMovingAvgVec] = useState<number[]>([0.02, -0.05, 0.01, 0.04, -0.01, 0.03, -0.02, 0.02]);
  const [movingStdVec, setMovingStdVec] = useState<number[]>([1.01, 0.98, 1.05, 0.97, 1.02, 0.99, 1.04, 1.01]);
  const [stagnationSteps, setStagnationSteps] = useState(0);
  const [simpleDataMode, setSimpleDataMode] = useState(false);
  const [imageGrid, setImageGrid] = useState<number[]>(() => {
    const initial = Array(1024).fill(0);
    for (let y = 8; y <= 24; y++) {
      for (let x = 8; x <= 24; x++) {
        initial[y * 32 + x] = 1.0;
      }
    }
    return initial;
  });
  const [convolvedGrid, setConvolvedGrid] = useState<number[]>(() => {
    const initial = Array(1024).fill(0);
    for (let y = 8; y <= 24; y++) {
      for (let x = 8; x <= 24; x++) {
        initial[y * 32 + x] = 1.0;
      }
    }
    const width = 32;
    const height = 32;
    const output = Array(1024).fill(0);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const val_tl = initial[(y - 1) * width + (x - 1)];
        const val_tc = initial[(y - 1) * width + x];
        const val_tr = initial[(y - 1) * width + (x + 1)];
        const val_ml = initial[y * width + (x - 1)];
        const val_mr = initial[y * width + (x + 1)];
        const val_bl = initial[(y + 1) * width + (x - 1)];
        const val_bc = initial[(y + 1) * width + x];
        const val_br = initial[(y + 1) * width + (x + 1)];
        const gx = -1.0 * val_tl + 1.0 * val_tr - 2.0 * val_ml + 2.0 * val_mr - 1.0 * val_bl + 1.0 * val_br;
        const gy = -1.0 * val_tl - 2.0 * val_tc - 1.0 * val_tr + 1.0 * val_bl + 2.0 * val_bc + 1.0 * val_br;
        output[y * width + x] = Math.min(1.0, Math.sqrt(gx * gx + gy * gy));
      }
    }
    return output;
  });
  const [cnnTrainProgress, setCnnTrainProgress] = useState<{ epoch: number; squareAcc: number; circleAcc: number }[]>([
    { epoch: 0, squareAcc: 0.25, circleAcc: 0.18 },
  ]);
  const [cnnTraining, setCnnTraining] = useState(false);
  const [cnnEpochs, setCnnEpochs] = useState(0);
  const [shapeResult, setShapeResult] = useState<"Uncertain" | "Square detected" | "Circle detected">("Square detected");
  const [activeStabilityCodeFile, setActiveStabilityCodeFile] = useState<"lib.rs" | "AuraCoreBridge.kt" | "aura-jni.cpp">("lib.rs");

  // --- Memory Safety & Benchmarking (TS #9) ---
  const [selectedSafetyCodeFile, setSelectedSafetyCodeFile] = useState<SelectedSafetyCodeFileType>("safe_arena.rs");
  const [unsafeCount, setUnsafeCount] = useState<number>(12);
  const [integrityValid, setIntegrityValid] = useState<boolean>(true);
  const [fuzzingActive, setFuzzingActive] = useState<boolean>(false);
  const [fuzzLogs, setFuzzLogs] = useState<any[]>([]);
  const [benchRunning, setBenchRunning] = useState<boolean>(false);
  const [stressTesting10k, setStressTesting10k] = useState<boolean>(false);
  const [stress10kProgress, setStress10kProgress] = useState<number>(0);
  const [stress10kLogs, setStress10kLogs] = useState<any[]>([]);

  const updateSobelFeedback = (flatGrid: number[]) => {
    const width = 32;
    const height = 32;
    const output = Array(1024).fill(0);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const val_tl = flatGrid[(y - 1) * width + (x - 1)];
        const val_tc = flatGrid[(y - 1) * width + x];
        const val_tr = flatGrid[(y - 1) * width + (x + 1)];
        const val_ml = flatGrid[y * width + (x - 1)];
        const val_mr = flatGrid[y * width + (x + 1)];
        const val_bl = flatGrid[(y + 1) * width + (x - 1)];
        const val_bc = flatGrid[(y + 1) * width + x];
        const val_br = flatGrid[(y + 1) * width + (x + 1)];
        const gx = -1.0 * val_tl + 1.0 * val_tr - 2.0 * val_ml + 2.0 * val_mr - 1.0 * val_bl + 1.0 * val_br;
        const gy = -1.0 * val_tl - 2.0 * val_tc - 1.0 * val_tr + 1.0 * val_bl + 2.0 * val_bc + 1.0 * val_br;
        output[y * width + x] = Math.min(1.0, Math.sqrt(gx * gx + gy * gy));
      }
    }
    setConvolvedGrid(output);
  };

  // Recompute goodness whenever input patterns or weights modify
  useEffect(() => {
    if (cores.length > 0 && posInput.length > 0 && negInput.length > 0) {
      const posVal = computeForwardTS(posInput, cores);
      const negVal = computeForwardTS(negInput, cores);
      setPosGoodness(posVal);
      setNegGoodness(negVal);
    }
  }, [cores, posInput, negInput]);

  // Handle Initialisation
  useEffect(() => {
    reinitializeNetwork();
  }, [inputDim, numLayers, initialRank]);

  // Re-initialize network structures
  const reinitializeNetwork = () => {
    const chunkBase = Math.floor(inputDim / numLayers);
    const remainder = inputDim % numLayers;
    
    const ranks = Array(numLayers + 1).fill(1);
    for (let i = 1; i < numLayers; i++) {
      ranks[i] = initialRank;
    }

    const newCores: TensorCoreTS[] = [];
    for (let k = 0; k < numLayers; k++) {
      const d_k = chunkBase + (k < remainder ? 1 : 0);
      const r_prev_val = ranks[k];
      const r_curr_val = ranks[k + 1];

      // Glorot xavier limits
      const limit = Math.sqrt(6.0 / (r_prev_val + r_curr_val + d_k));
      const weights: number[][][] = [];
      for (let a = 0; a < r_prev_val; a++) {
        weights[a] = [];
        for (let j = 0; j < d_k; j++) {
          weights[a][j] = [];
          for (let b = 0; b < r_curr_val; b++) {
            weights[a][j][b] = (Math.random() * 2.0 - 1.0) * limit;
          }
        }
      }

      newCores.push({
        id: k,
        r_prev: r_prev_val,
        d: d_k,
        r_curr: r_curr_val,
        weights,
      });
    }

    setCores(newCores);
    setPosInput(generateSineWave(inputDim, 1));
    setNegInput(generateNoisySignal(inputDim));
    setStepCount(0);
    setTrainingHistory([]);
    setExpansionHistory([`Kernel reinitialised with shapes: [${newCores.map(c => `(${c.r_prev},${c.d},${c.r_curr})`).join(" — ")}]`]);
    setSelectedCoreIdx(0);
  };

  // Forward Contraction
  const computeForwardTS = (input: number[], currCores: TensorCoreTS[]): number => {
    let current_state = [1.0];
    let goodness = 0.0;
    let start_idx = 0;

    for (let k = 0; k < currCores.length; k++) {
      const core = currCores[k];
      const x_k = input.slice(start_idx, start_idx + core.d);
      start_idx += core.d;

      const next_state: number[] = Array(core.r_curr).fill(0);
      for (let b = 0; b < core.r_curr; b++) {
        let cell_sum = 0.0;
        for (let a = 0; a < core.r_prev; a++) {
          let weight_sum = 0.0;
          for (let j = 0; j < core.d; j++) {
            if (j < x_k.length) {
              weight_sum += core.weights[a][j][b] * x_k[j];
            }
          }
          cell_sum += current_state[a] * weight_sum;
        }
        next_state[b] = cell_sum;
      }

      const norm_sq = next_state.reduce((sum, val) => sum + val * val, 0);
      goodness += norm_sq;

      const norm = Math.sqrt(norm_sq + 1e-9);
      current_state = next_state.map(val => val / norm);
    }

    return goodness;
  };

  // Single step optimization
  const executeTrainStep = () => {
    if (cores.length === 0) return;

    const posStates: number[][] = [[1.0]];
    const negStates: number[][] = [[1.0]];

    // POS forward
    let start_idx = 0;
    let pos_goodness = 0;
    for (let k = 0; k < cores.length; k++) {
      const core = cores[k];
      const x_k = posInput.slice(start_idx, start_idx + core.d);
      start_idx += core.d;
      const prev_s = posStates[k];
      const next_s: number[] = Array(core.r_curr).fill(0);
      for (let b = 0; b < core.r_curr; b++) {
        let cell_sum = 0;
        for (let a = 0; a < core.r_prev; a++) {
          let w_sum = 0;
          for (let j = 0; j < core.d; j++) {
            w_sum += core.weights[a][j][b] * (x_k[j] || 0.0);
          }
          cell_sum += prev_s[a] * w_sum;
        }
        next_s[b] = cell_sum;
      }
      const n_sq = next_s.reduce((sum, v) => sum + v * v, 0);
      pos_goodness += n_sq;
      const n_val = Math.sqrt(n_sq + 1e-9);
      posStates.push(next_s.map(v => v / n_val));
    }

    // NEG forward
    start_idx = 0;
    let neg_goodness = 0;
    for (let k = 0; k < cores.length; k++) {
      const core = cores[k];
      const x_k = negInput.slice(start_idx, start_idx + core.d);
      start_idx += core.d;
      const prev_s = negStates[k];
      const next_s: number[] = Array(core.r_curr).fill(0);
      for (let b = 0; b < core.r_curr; b++) {
        let cell_sum = 0;
        for (let a = 0; a < core.r_prev; a++) {
          let w_sum = 0;
          for (let j = 0; j < core.d; j++) {
            w_sum += core.weights[a][j][b] * (x_k[j] || 0.0);
          }
          cell_sum += prev_s[a] * w_sum;
        }
        next_s[b] = cell_sum;
      }
      const n_sq = next_s.reduce((sum, v) => sum + v * v, 0);
      neg_goodness += n_sq;
      const n_val = Math.sqrt(n_sq + 1e-9);
      negStates.push(next_s.map(v => v / n_val));
    }

    const pos_deficit = Math.max(0, threshold - pos_goodness);
    const neg_surplus = Math.max(0, neg_goodness - threshold);

    const updatedCores = cores.map((core, k) => {
      let pos_start = 0;
      let neg_start = 0;
      for (let i = 0; i < k; i++) {
        pos_start += cores[i].d;
        neg_start += cores[i].d;
      }

      const x_k_pos = posInput.slice(pos_start, pos_start + core.d);
      const x_k_neg = negInput.slice(neg_start, neg_start + core.d);

      const p_prev = posStates[k];
      const p_curr = posStates[k + 1];

      const n_prev = negStates[k];
      const n_curr = negStates[k + 1];

      const newWeights = core.weights.map((rowArr, a) => {
        return rowArr.map((colArr, j) => {
          return colArr.map((w, b) => {
            let delta = 0;
            if (pos_deficit > 0 && j < x_k_pos.length) {
              delta += learningRate * pos_deficit * 2.0 * p_curr[b] * p_prev[a] * x_k_pos[j];
            }
            if (neg_surplus > 0 && j < x_k_neg.length) {
              delta -= learningRate * neg_surplus * 2.0 * n_curr[b] * n_prev[a] * x_k_neg[j];
            }
            return w + delta;
          });
        });
      });

      return {
        ...core,
        weights: newWeights,
      };
    });

    setCores(updatedCores);
    
    // Weight clipping for TS #7
    setCores(prevCores => prevCores.map(core => ({
      ...core,
      weights: core.weights.map(layer => layer.map(row => row.map(w => Math.max(-1.0, Math.min(1.0, w)))))
    })));

    const newStep = stepCount + 1;
    setStepCount(newStep);

    if (newStep % 2 === 0 || newStep < 10) {
      setTrainingHistory(prev => {
        const next = [...prev, { step: newStep, posGoodness: pos_goodness, negGoodness: neg_goodness }];
        return next.slice(-40);
      });
    }

    // TS #7 model stagnation tracker logic
    const converged = pos_goodness > threshold && neg_goodness < threshold;
    if (pos_goodness > threshold) {
      if (converged) {
        setStagnationSteps(0);
      } else {
        setStagnationSteps(prev => {
          const next = prev + 1;
          if (next > 500) {
            executeOrthogonalExpansion();
            return 0;
          }
          return next;
        });
      }
    } else {
      setStagnationSteps(0);
    }
  };

  // Capacity Expansion
  const executeOrthogonalExpansion = () => {
    if (cores.length === 0) return;

    const scoreBefore = computeForwardTS(posInput, cores);

    const newRanks = Array(cores.length + 1).fill(1);
    for (let k = 1; k < cores.length; k++) {
      newRanks[k] = cores[k - 1].r_curr + 1;
    }

    const expandedCores = cores.map((oldCore, k) => {
      const r_prev_new = newRanks[k];
      const r_curr_new = newRanks[k + 1];

      const newWeights: number[][][] = [];
      for (let a = 0; a < r_prev_new; a++) {
        newWeights[a] = [];
        for (let j = 0; j < oldCore.d; j++) {
          newWeights[a][j] = [];
          for (let b = 0; b < r_curr_new; b++) {
            if (a < oldCore.r_prev && b < oldCore.r_curr) {
              newWeights[a][j][b] = oldCore.weights[a][j][b];
            } else {
              newWeights[a][j][b] = 0.0;
            }
          }
        }
      }

      return {
        id: oldCore.id,
        r_prev: r_prev_new,
        d: oldCore.d,
        r_curr: r_curr_new,
        weights: newWeights,
      };
    });

    const scoreAfter = computeForwardTS(posInput, expandedCores);
    const variance = scoreBefore !== 0 ? Math.abs(scoreAfter - scoreBefore) / scoreBefore : 0;
    
    setCores(expandedCores);

    const record = `Expanded bounds [${cores.map(c => c.r_curr).join("-")}] to [${expandedCores.map(c => c.r_curr).join("-")}]. Variance: ${(variance * 100).toFixed(6)}% (Success)`;
    setExpansionHistory(prev => [record, ...prev]);
  };

  const handleRegenerateSignals = (type: "sine" | "step" | "pulse") => {
    let pos = [];
    if (type === "sine") pos = generateSineWave(inputDim, 1.2);
    else if (type === "step") pos = Array(inputDim).fill(0).map((_, i) => (i >= inputDim / 2 ? 1.0 : -1.0));
    else pos = Array(inputDim).fill(-0.2).map((v, i) => (i === Math.floor(inputDim / 2) ? 1.5 : v));

    setPosInput(pos);
    setNegInput(generateNoisySignal(inputDim));
  };

  return (
    <AuraContext.Provider
      value={{
        inputDim, setInputDim,
        numLayers, setNumLayers,
        initialRank, setInitialRank,
        learningRate, setLearningRate,
        threshold, setThreshold,

        cores, setCores,
        posInput, setPosInput,
        negInput, setNegInput,
        posGoodness, setPosGoodness,
        negGoodness, setNegGoodness,
        trainingHistory, setTrainingHistory,
        stepCount, setStepCount,
        isTraining, setIsTraining,
        trainSpeed, setTrainSpeed,

        selectedCoreIdx, setSelectedCoreIdx,
        activeTab, setActiveTab,
        selectedRustFile, setSelectedRustFile,

        activeBackend, setActiveBackend,
        selectedVulkanShaderFile, setSelectedVulkanShaderFile,
        precisionType, setPrecisionType,
        benchmarking, setBenchmarking,
        benchmarkProgress, setBenchmarkProgress,
        benchmarkResults, setBenchmarkResults,
        npuCertified, setNpuCertified,
        vulkanLogs, setVulkanLogs,

        cpuTemp, setCpuTemp,
        pacingStatus, setPacingStatus,
        pacingDelay, setPacingDelay,
        androidLifecycle, setAndroidLifecycle,
        tempHistory, setTempHistory,
        autoHeatEnabled, setAutoHeatEnabled,
        ramWeightsCached, setRamWeightsCached,
        cachedWeightsSize, setCachedWeightsSize,
        activeModelPtr, setActiveModelPtr,
        pacingIterationHz, setPacingIterationHz,
        ndkLogs, setNdkLogs,
        selectedPacingCodeFile, setSelectedPacingCodeFile,

        expansionHistory, setExpansionHistory,

        chatMessages, setChatMessages,
        userQuery, setUserQuery,
        isLoadingAI, setIsLoadingAI,

        streamQuery, setStreamQuery,
        streamingActive, setStreamingActive,
        streamSpeed, setStreamSpeed,
        backpressureActive, setBackpressureActive,
        bufferHead, setBufferHead,
        bufferTail, setBufferTail,
        networkLogs, setNetworkLogs,

        exportPrompt, setExportPrompt,
        exportFormat, setExportFormat,
        crystallizing, setCrystallizing,
        crystallizationProgress, setCrystallizationProgress,
        offlineMode, setOfflineMode,
        exportPath, setExportPath,
        exportStatus, setExportStatus,
        selectedComposeCodeFile, setSelectedComposeCodeFile,
        crystallizeLogs, setCrystallizeLogs,
        crystallizeMetrics, setCrystallizeMetrics,

        stressTesting, setStressTesting,
        stressSteps, setStressSteps,
        stressWeightsRange, setStressWeightsRange,
        movingAvgVec, setMovingAvgVec,
        movingStdVec, setMovingStdVec,
        stagnationSteps, setStagnationSteps,
        simpleDataMode, setSimpleDataMode,
        imageGrid, setImageGrid,
        convolvedGrid, setConvolvedGrid,
        cnnTrainProgress, setCnnTrainProgress,
        cnnTraining, setCnnTraining,
        cnnEpochs, setCnnEpochs,
        shapeResult, setShapeResult,
        activeStabilityCodeFile, setActiveStabilityCodeFile,

        selectedSafetyCodeFile, setSelectedSafetyCodeFile,
        unsafeCount, setUnsafeCount,
        integrityValid, setIntegrityValid,
        fuzzingActive, setFuzzingActive,
        fuzzLogs, setFuzzLogs,
        benchRunning, setBenchRunning,
        stressTesting10k, setStressTesting10k,
        stress10kProgress, setStress10kProgress,
        stress10kLogs, setStress10kLogs,

        reinitializeNetwork,
        computeForwardTS,
        executeTrainStep,
        executeOrthogonalExpansion,
        handleRegenerateSignals,
        updateSobelFeedback,
      }}
    >
      {children}
    </AuraContext.Provider>
  );
};
