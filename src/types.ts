/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TensorCoreTS {
  id: number;
  r_prev: number;
  d: number;
  r_curr: number;
  weights: number[][][]; // shape [r_prev][d][r_curr]
}

export interface TrainingHistoryPoint {
  step: number;
  posGoodness: number;
  negGoodness: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  recommendedConfig?: {
    dim: number;
    layers: number;
    rank: number;
    threshold: number;
    encoder: string;
  } | null;
}

export type ActiveTabType = "visualizer" | "rust-code" | "math-guide" | "memory-cache" | "network-stream" | "android-pacing" | "hardware-acceleration" | "android-ui-export" | "stability-precision" | "memory-safety-benchmarking";
export type SelectedRustFileType = "lib.rs" | "Cargo.toml" | "Unit Tests" | "aura-jni.cpp";
export type ActiveBackendType = "CPU (NEON)" | "GPU (Vulkan)" | "NPU (NNAPI)";
export type SelectedVulkanShaderFileType = "tensor_forward.comp" | "DynamicSelector.rs" | "PrecisionConverter.rs" | "ash_bridge.rs";
export type PrecisionTypeType = "FP32" | "FP16" | "INT8";
export type PacingStatusType = "Full Speed" | "Throttling" | "Emergency Stop";
export type AndroidLifecycleType = "Active" | "Paused" | "Destroyed";
export type SelectedPacingCodeFileType = "aura-jni.cpp" | "AuraCoreBridge.kt" | "ThermalPacingManager.kt";
export type ExportFormatType = "tflite" | "onnx";
export type ExportStatusType = "idle" | "serializing" | "converting" | "saving" | "completed";
export type SelectedComposeCodeFileType = "CrystallizationScreen.kt" | "ModelExporter.kt" | "BufferReceiverService.kt";
export type ShapeResultType = "Uncertain" | "Square detected" | "Circle detected";
export type ActiveStabilityCodeFileType = "lib.rs" | "AuraCoreBridge.kt" | "aura-jni.cpp";
export type SelectedSafetyCodeFileType = "safe_arena.rs" | "benchmarks.rs" | "fuzz_parser.rs" | "cargo-fuzz-target.rs";
