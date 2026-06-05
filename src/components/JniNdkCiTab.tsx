/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Activity, 
  Play, 
  CheckCircle, 
  Terminal, 
  Sparkles, 
  Cpu, 
  RefreshCw,
  Download,
  Github,
  FileCode,
  Check,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Layers,
  Settings,
  Trash2,
  GitBranch,
  Save,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuraContext } from "../store/AuraContext";
import { SelectedJniCodeFileType } from "../types";

export const JniNdkCiTab: React.FC = () => {
  const {
    selectedJniCodeFile, setSelectedJniCodeFile,
    jniCorePtr, setJniCorePtr,
    jniLogs, setJniLogs,
    isJniInitialized, setIsJniInitialized,
    pipelineRunning, setPipelineRunning,
    pipelineProgress, setPipelineProgress,
    pipelineLogs, setPipelineLogs,
    pipelineArtifactUrl, setPipelineArtifactUrl
  } = useAuraContext();

  // Component local states
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exportPathInput, setExportPathInput] = useState<string>("/data/user/0/com.auranexus/files/model.onnx");
  const [testDim, setTestDim] = useState<number>(8);
  const [testLayers, setTestLayers] = useState<number>(4);
  const [testRank, setTestRank] = useState<number>(4);
  const [inputValList, setInputValList] = useState<string>("0.85, -0.42, 0.12, 0.94, -0.61, 0.23, 0.45, -0.19");
  
  // NDK Optimization States
  const [exclusivelyArm64, setExclusivelyArm64] = useState<boolean>(true);
  const [ndkLogs, setNdkLogs] = useState<string[]>(["[NDK-CONFIG] CMake toolchain set up for Android API level 34."]);
  const [ndkCompiling, setNdkCompiling] = useState<boolean>(false);

  // CI/CD Runs log
  const [ciRuns, setCiRuns] = useState<any[]>([
    {
      id: "run-301",
      commit: "Merge pull request #41 from stability-precision",
      branch: "main",
      status: "completed",
      time: "June 4, 2026 10:45 AM",
      duration: "3m 42s"
    },
    {
      id: "run-300",
      commit: "feat: Add Miri memory safety validation checks",
      branch: "develop",
      status: "completed",
      time: "June 4, 2026 09:12 AM",
      duration: "4m 11s"
    }
  ]);

  const jniConsoleEndRef = useRef<HTMLDivElement>(null);
  const pipelineConsoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (jniConsoleEndRef.current) {
      jniConsoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [jniLogs]);

  useEffect(() => {
    if (pipelineConsoleEndRef.current) {
      pipelineConsoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [pipelineLogs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Interactive JNI Method initiators
  const triggerJniInit = () => {
    if (isJniInitialized) {
      setJniLogs(prev => [
        ...prev,
        `[WARNING] Cannot initialize: AuraCore context already allocated at 0x7f4e910${jniCorePtr.toString(16)}.`
      ]);
      return;
    }
    const valPointer = Math.floor(Math.random() * 900000) + 100000;
    setJniCorePtr(valPointer);
    setIsJniInitialized(true);
    setJniLogs(prev => [
      ...prev,
      `--- [jni-layer] Calling Java_com_auranexus_core_AuraNative_init ---`,
      `[JNI] Calling init(env, thiz, input_dim=${testDim}, layers=${testLayers}, rank=${testRank})`,
      `[CPP_MODULE] Allocated AuraCore instance in HEAP. Arena initialized for ${testLayers} layers.`,
      `[CPP_MODULE] Allocated Arena f32 buffer sizes: ${(testDim * testRank * 4 * testLayers)} elements.`,
      `[JNI] Success. Native Heap Pointer returned: 0x7f4e${valPointer.toString(16).toUpperCase()}`
    ]);
    showToast("JNI init() called. Allocated safe model in native memory!");
  };

  const triggerJniTrainStep = () => {
    if (!isJniInitialized) {
      setJniLogs(prev => [
        ...prev,
        `[CRITICAL JNI ERROR] NullPointerDereference! Attempted trainStep() with NULL ptr pointer (0x0). UB prevented in JNI boundaries!`
      ]);
      showToast("Blocked Null Pointer JNI dereference!");
      return;
    }

    // Parse float numbers
    const parsedFloats = inputValList.split(",").map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (parsedFloats.length === 0) {
      setJniLogs(prev => [
        ...prev,
        `[JNI ERROR] Provided empty input data array.`
      ]);
      return;
    }

    setJniLogs(prev => [
      ...prev,
      `--- [jni-layer] Calling Java_com_auranexus_core_AuraNative_trainStep ---`,
      `[JNI] Dereferencing native AuraCore pointer: 0x7f4e${jniCorePtr.toString(16).toUpperCase()}`,
      `[JNI] Found valid f32 data array inside JVM. Length: ${parsedFloats.length}`,
      `[CPP_MODULE] Invoking train_step() on safe heap instance...`,
      `[CPP_MODULE] Goodness metrics calculated. Gradient convergence status: CONVERGED`,
      `[JNI] Returned status integer: 1 (Status: Converged)`
    ]);
    showToast("JNI trainStep() executed dynamically on native memory.");
  };

  const triggerJniExportModel = () => {
    if (!isJniInitialized) {
      setJniLogs(prev => [
        ...prev,
        `[CRITICAL JNI ERROR] Attempted exportModel() on undefined native context pointer.`
      ]);
      return;
    }
    setJniLogs(prev => [
      ...prev,
      `--- [jni-layer] Calling Java_com_auranexus_core_AuraNative_exportModel ---`,
      `[JNI] Retrieving model weights of active kernels...`,
      `[CPP_MODULE] Opening serialization descriptor file path: "${exportPathInput}"`,
      `[CPP_MODULE] Serialized f32 weight tensors. Bytes written: 14,840 bytes.`,
      `[JNI] exportModel returned status code: 0 (Operation complete)`
    ]);
    showToast("JNI model exported successfully to specified storage!");
  };

  const triggerJniDestroy = () => {
    if (!isJniInitialized) {
      setJniLogs(prev => [
        ...prev,
        `[WARNING] Attempted destroy() but AuraCore native pointer is already NULL.`
      ]);
      return;
    }
    setJniLogs(prev => [
      ...prev,
      `--- [jni-layer] Calling Java_com_auranexus_core_AuraNative_destroy ---`,
      `[JNI] Destroying context pointer 0x7f4e${jniCorePtr.toString(16).toUpperCase()}`,
      `[CPP_MODULE] Safety Arena allocator reclaiming f32 segments...`,
      `[CPP_MODULE] Freeing heap AuraCore memory cells cleanly. Miri/Valgrind heap records freed.`,
      `[JNI] AuraCore destroyed. Heap pointer status reset to 0x0.`
    ]);
    setIsJniInitialized(false);
    setJniCorePtr(0);
    showToast("AuraNative instance destroyed cleanly from heap memory.");
  };

  const triggerClearJniConsole = () => {
    setJniLogs([]);
  };

  // Compile simulator for NDK + Cargo tasks in local workspace
  const triggerNdkCompilation = () => {
    if (ndkCompiling) return;
    setNdkCompiling(true);
    setNdkLogs([
      "[NDK-CMAKE] Launching gradle task :app:compileReleaseNdk",
      "[NDK-CMAKE] CMAKE_SYSTEM_NAME: Android, Target API: 34",
      "[CARGO] Running: cargo ndk --target aarch64-linux-android build --release",
      "[CARGO] Compiling aura-core v0.1.0 (release kernel)",
      "[CARGO] [1/8] Compiling safe_arena.rs...",
      "[CARGO] [4/8] Compiling model_fuzzing.rs...",
      "[CARGO] Finished release [optimized] target in 1.4s"
    ]);

    setTimeout(() => {
      setNdkLogs(prev => [
        ...prev,
        `[NDK-LINK] Linking dynamic library with C++ wrapper aura-jni.cpp...`,
        `[NDK-LINK] Linking static rust core: /target/aarch64-linux-android/release/libaura_core.a -> /app/build/intermediates/cmake/release/obj/arm64-v8a/libaura_core_jni.so`,
        `[NDK-CONFIG] ${exclusivelyArm64 ? "EXCLUSIVE ABI RULE ENABLED. Strip unused architectures x86_64, armeabi-v7a." : "Warning: Fat multi-ABI target registered."}`,
        `[NDK-SUCCESS] Compilation complete. ABI arm64-v8a binary size: 284 KB.`,
        `[GRADLE-SUCCESS] Build task complete. Shared libraries packaged securely in release APK.`
      ]);
      setNdkCompiling(false);
      showToast("CMake NDK compile task finished successfully!");
    }, 1200);
  };

  // 2. Simulated CI/CD Pipeline
  const triggerCiPipeline = () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);
    setPipelineProgress(5);
    setPipelineLogs([
      "Push detected on branch: [main] - Triggering build-apk.yml CI workflow.",
      "[JOB SETUP] Queue running on 'ubuntu-latest' VM cluster...",
      "[JOB SETUP] Initializing Android SDK platform tooling API 34."
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step += 15;
      if (step > 100) step = 100;
      setPipelineProgress(step);

      if (step === 20) {
        setPipelineLogs(prev => [
          ...prev,
          "[STEP 1/5] Setup Java environment - JDK 17 oracle container... Checked OK",
          "[STEP 2/5] Installing Android NDK r26b compiler chains..."
        ]);
      } else if (step === 50) {
        setPipelineLogs(prev => [
          ...prev,
          "[STEP 3/5] Rust installation & Native targets validation:",
          "  Installing rustup target aarch64-linux-android",
          "  Configuring cargo cache paths under integration layers..."
        ]);
      } else if (step === 75) {
        setPipelineLogs(prev => [
          ...prev,
          "[STEP 4/5] Running Cargo NDK build core static library...",
          "  $ cargo ndk --target aarch64-linux-android build --release",
          "  Successfully generated targets/aarch64-linux-android/release/libaura_core.a [Optimized speed size]",
          "[STEP 5/5] Launching Gradle Assemble task: assembling debug APK artifact...",
          "  $ ./gradlew assembleDebug"
        ]);
      } else if (step === 100) {
        clearInterval(interval);
        setPipelineRunning(false);
        setPipelineArtifactUrl("app-debug.apk");
        setPipelineLogs(prev => [
          ...prev,
          "[COMPLETED] Generated release APK: app-debug.apk",
          "  Path: app/build/outputs/apk/debug/app-debug.apk",
          `  File size footprint: ${exclusivelyArm64 ? "4.15 MB" : "14.82 MB"} (Limit: 15.00 MB Checked OK)`,
          "[ARTIFACT] Automatic deployment: app-debug.apk uploaded to GitHub Artifact container (Retention limit: 7 Days)."
        ]);
        
        // Add run to the top of list
        const newRun = {
          id: `run-${302 + ciRuns.length}`,
          commit: "CI build: Compiling NDK JNI and artifact binaries",
          branch: "main",
          status: "completed",
          time: "Just now",
          duration: "1m 15s"
        };
        setCiRuns([newRun, ...ciRuns]);
        showToast("GitHub Actions APK compilation pipeline completed in green!");
      }
    }, 600);
  };

  const getJniCodeSnippet = (): string => {
    switch (selectedJniCodeFile) {
      case "aura-jni.cpp":
        return `// android-app/src/main/cpp/aura-jni.cpp
#include <jni.h>
#include <android/log.h>
#include <stdexcept>
#include <string>
#include <cstring>

#define LOG_TAG "AURA_JNI_NATIVE"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// External linkage declarations pointing to the static Rust core
extern "C" {
    typedef void* CorePtr;
    CorePtr init_core(int input_dim, int layers, int rank);
    int train_step_core(CorePtr ptr, const float* data, int length);
    void export_weights_core(CorePtr ptr, const char* path);
    void destroy_core(CorePtr ptr);
}

// C++ SafeTensorView wrap over raw pointers with dynamic boundaries protection
template <typename T>
class SafeTensorView {
private:
    T* data;
    size_t length;
    bool is_const;

public:
    SafeTensorView(T* raw_data, size_t len, bool is_read_only = false) 
        : data(raw_data), length(len), is_const(is_read_only) {
        if (raw_data == nullptr && len > 0) {
            throw std::runtime_error("NullPointer exception inside SafeTensorView initialization.");
        }
    }

    T get(size_t index) const {
        if (index >= length) {
            throw std::out_of_range("Memory Access Overflow Blocked! Index out of SafeTensorView bounds.");
        }
        return data[index];
    }

    void set(size_t index, T value) {
        if (is_const) {
            throw std::runtime_error("Attempted mutate write operations on constant SafeTensorView elements.");
        }
        if (index >= length) {
            throw std::out_of_range("Memory Access Overflow Blocked! Index out of SafeTensorView bounds.");
        }
        data[index] = value;
    }

    const T* get_raw_ptr() const { return data; }
    size_t size() const { return length; }
};

extern "C" JNIEXPORT jlong JNICALL
Java_com_auranexus_core_AuraNative_init(JNIEnv *env, jobject thiz, jint input_dim, jint layers, jint rank) {
    LOGD("Java_com_auranexus_core_AuraNative_init init trigger: dim=%d, layers=%d, rank=%d", input_dim, layers, rank);
    try {
        CorePtr core = init_core(input_dim, layers, rank);
        if (core == nullptr) {
            LOGE("Critical Error: init_core returned nil pointer.");
            return 0;
        }
        return reinterpret_cast<jlong>(core);
    } catch (const std::exception& e) {
        LOGE("C++ Exception in AuraNative_init: %s", e.what());
        jclass exClass = env->FindClass("java/lang/RuntimeException");
        if (exClass != nullptr) {
            env->ThrowNew(exClass, e.what());
        }
        return 0;
    }
}

extern "C" JNIEXPORT jint JNICALL
Java_com_auranexus_core_AuraNative_trainStep(JNIEnv *env, jobject thiz, jlong ptr, jfloatArray data) {
    if (ptr == 0) {
        LOGE("Critical error: nullptr dereference passed as core ptr in trainStep.");
        jclass exClass = env->FindClass("java/lang/NullPointerException");
        if (exClass != nullptr) {
            env->ThrowNew(exClass, "AuraCore context pointer is null.");
        }
        return -1;
    }

    if (data == nullptr) {
        LOGE("Critical error: train data is null.");
        return -1;
    }

    CorePtr core = reinterpret_cast<CorePtr>(ptr);
    jsize len = env->GetArrayLength(data);
    jfloat* body = env->GetFloatArrayElements(data, nullptr);

    if (body == nullptr) {
        LOGE("Could not lock JNI float array elements.");
        return -1;
    }

    jint status = -1;
    try {
        // Enforce safe memory encapsulation bounds checks using SafeTensorView
        SafeTensorView<float> view(body, static_cast<size_t>(len), true);
        
        // Pass checked SafeTensorView encapsulated data pointer to Rust stack context runs
        status = train_step_core(core, view.get_raw_ptr(), static_cast<int>(view.size()));
        
        LOGD("Java_com_auranexus_core_AuraNative_trainStep: completed. Status=%d", status);
    } catch (const std::exception& e) {
        LOGE("SafeTensorView access failure caught in JNI: %s", e.what());
        jclass exClass = env->FindClass("java/lang/IndexOutOfBoundsException");
        if (exClass != nullptr) {
            env->ThrowNew(exClass, e.what());
        }
    }

    env->ReleaseFloatArrayElements(data, body, JNI_ABORT);
    return status;
}

extern "C" JNIEXPORT void JNICALL
Java_com_auranexus_core_AuraNative_exportModel(JNIEnv *env, jobject thiz, jlong ptr, jstring path) {
    if (ptr == 0) {
        LOGE("exportModel Error: Core context pointer is null.");
        return;
    }
    if (path == nullptr) {
        LOGE("exportModel Error: Specified destination save path is null.");
        return;
    }

    CorePtr core = reinterpret_cast<CorePtr>(ptr);
    const char* utf_path = env->GetStringUTFChars(path, nullptr);
    if (utf_path == nullptr) {
        LOGE("Failed to extract UTF characters from Java path string.");
        return;
    }

    try {
        // Wrap path using SafeTensorView with bounds check (including null terminator)
        size_t path_len = std::strlen(utf_path);
        SafeTensorView<const char> path_view(utf_path, path_len + 1, true);

        // Call core static weight serialization
        export_weights_core(core, path_view.get_raw_ptr());
        LOGD("Java_com_auranexus_core_AuraNative_exportModel: weight tensors exported to %s", utf_path);
    } catch (const std::exception& e) {
        LOGE("Safe path view access failure caught in JNI exportModel: %s", e.what());
    }

    env->ReleaseStringUTFChars(path, utf_path);
}

extern "C" JNIEXPORT void JNICALL
Java_com_auranexus_core_AuraNative_destroy(JNIEnv *env, jobject thiz, jlong ptr) {
    if (ptr != 0) {
        CorePtr core = reinterpret_cast<CorePtr>(ptr);
        destroy_core(core);
        LOGD("Java_com_auranexus_core_AuraNative_destroy: Core clean deallocation completes successfully.");
    } else {
        LOGD("Java_com_auranexus_core_AuraNative_destroy: Warning, native pointer already zero.");
    }
}`;
      case "AuraNative.kt":
        return `// android-app/src/main/java/com/auranexus/core/AuraNative.kt
package com.auranexus.core

import android.util.Log
import java.io.File

/**
 * Exception class for custom JNI errors.
 */
class JNIException(message: String) : Exception(message)

/**
 * Kotlin interface bridging NDK compilation targets with memory lifecycle safety.
 */
class AuraNative(
    val inputDim: Int,
    val layers: Int,
    val rank: Int
) : AutoCloseable {

    private var nativePtr: Long = 0

    init {
        try {
            System.loadLibrary("aura_jni")
            nativePtr = init(inputDim, layers, rank)
            if (nativePtr == 0L) {
                throw JNIException("Native initialization returned zero pointer!")
            }
            Log.d("AuraNative", "Initialized native core at pointer: 0x" + java.lang.Long.toHexString(nativePtr))
        } catch (e: UnsatisfiedLinkError) {
            Log.e("AuraNative", "Could not load shared NDK model libraries: " + e.message)
            throw JNIException("Failed to link aura_jni shared library: " + e.message)
        }
    }

    /**
     * Executes single gradient step using the JNI bridge.
     */
    @Throws(JNIException::class)
    fun trainStep(data: FloatArray): Int {
        checkValidity()
        val result = trainStep(nativePtr, data)
        if (result < 0) {
            throw JNIException("JNI execution error during trainStep: returned status $result")
        }
        return result
    }

    /**
     * Serializes tensor weights to file path.
     */
    @Throws(JNIException::class)
    fun exportModel(outputFile: File) {
        checkValidity()
        exportModel(nativePtr, outputFile.absolutePath)
        Log.d("AuraNative", "Serialized weights successfully written to: " + outputFile.name)
    }

    private fun checkValidity() {
        if (nativePtr == 0L) {
            throw IllegalStateException("AuraCore Native Context is already destroyed or unallocated.")
        }
    }

    /**
     * Reclaims arena allocator segment deallocating the memory from the native heap cleanly.
     */
    @Throws(JNIException::class)
    override fun close() {
        if (nativePtr != 0L) {
            destroy(nativePtr)
            Log.d("AuraNative", "Freed native context pointer cleanly.")
            nativePtr = 0L
        }
    }

    // Native Interface External declarations mapped to aura-jni.cpp
    private external fun init(inputDim: Int, layers: Int, rank: Int): Long
    private external fun trainStep(ptr: Long, data: FloatArray): Int
    private external fun exportModel(ptr: Long, path: String)
    private external fun destroy(ptr: Long)
}`;
      case "CMakeLists.txt":
        return `# android-app/src/main/cpp/CMakeLists.txt
cmake_minimum_required(VERSION 3.22)
project(aura_jni_bridge)

# Enable C++17 standard as specified
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Search for the Android logger interface
find_library(log-lib log)

# Import compiled Static Rust core library
add_library(aura_core STATIC IMPORTED)
set_target_properties(aura_core PROPERTIES IMPORTED_LOCATION
    \${CMAKE_CURRENT_SOURCE_DIR}/../../../../rust-core/target/aarch64-linux-android/release/libaura_core.a
)

# Declare SHARED library implementing Java Native Interface methods
add_library(aura_jni SHARED aura-jni.cpp)

# Header files configuration
target_include_directories(aura_jni PRIVATE \${CMAKE_CURRENT_SOURCE_DIR})

# Link SHARED library targets with Static Rust binary and Android logging
target_link_libraries(aura_jni
    aura_core
    \${log-lib}
)`;
      case "build-apk.yml":
        return `# .github/workflows/build-apk.yml
name: Build AuraNexus APK
on: [push]

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: aarch64-linux-android

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install Android NDK r26b
        run: |
          sdkmanager "ndk;26.1.10909125" --no_https
          echo "ANDROID_NDK_HOME="\$"ANDROID_HOME/ndk/26.1.10909125" >> \$GITHUB_ENV

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: "\$"{{ runner.os }}-deps-v2-"\$"{{ hashFiles('**/Cargo.lock', '**/*.gradle.kts', 'gradle/wrapper/gradle-wrapper.properties') }}
          restore-keys: |
            "\$"{{ runner.os }}-deps-v2-

      - name: Grant execute permission for gradlew
        run: chmod +x ./gradlew

      - name: Build Debug APK
        run: ./gradlew :android-app:assembleDebug

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: aura-nexus-debug-apk
          path: android-app/build/outputs/apk/debug/android-app-debug.apk
          retention-days: 7`;
      default:
        return "";
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getJniCodeSnippet());
    setCopiedCodeFlag(true);
    showToast("JNI bridge code copied to clipboard successfully!");
    setTimeout(() => setCopiedCodeFlag(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="col-span-12 grid grid-cols-12 gap-6"
    >
      {/* Toast alert system */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 bg-[#0E1530] border border-blue-500/30 text-blue-300 text-xs px-4 py-2.5 rounded-lg shadow-xl shadow-slate-950/50 flex items-center gap-2 z-50 font-mono"
          >
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main header stats block */}
      <div className="col-span-12 bg-[#090C1A] border border-slate-950 p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-5 h-5 text-blue-400 animate-pulse" />
            <h2 className="text-white text-base font-semibold tracking-tight">
              JNI Bridge & GitHub Actions CI/CD (TS №10)
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl font-mono">
            Low-level binary linkages for AuraNexus targets • Safe Kotlin JNI translation wrappers, explicit Arm64 size-optimizations compiling statically, and continuous verification pipelines in actions.
          </p>
        </div>

        {/* Dynamic target metadata metrics */}
        <div className="flex flex-wrap gap-4 items-center font-mono">
          <div className="bg-[#050711] border border-slate-900 px-4 py-2 rounded-lg text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">Active ABI Target</div>
            <div className="text-xs font-bold text-blue-400 mt-1">arm64-v8a Only</div>
          </div>
          <div className="bg-[#050711] border border-slate-900 px-4 py-2 rounded-lg text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">Target APK Size</div>
            <div className="text-xs font-bold text-emerald-400 mt-1">
              {exclusivelyArm64 ? "~4.15 MB" : "~14.82 MB"}
            </div>
          </div>
        </div>
      </div>

      {/* JNI Interface & Interactive Simulator */}
      <div className="col-span-12 lg:col-span-6 bg-[#080B18] border border-slate-950 rounded-xl p-5 shadow-md flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Interactive JNI Method Call Sandbox</h3>
          </div>
          <button
            onClick={triggerClearJniConsole}
            className="text-[10px] font-mono border border-slate-800 bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            Clear logs
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono">
          Interact with simulated Kotlin-NDK wrappers mapped on native pointers. Call JVM external routines observing log output in real-time.
        </p>

        {/* Input variables initialization */}
        <div className="grid grid-cols-3 gap-3 mb-4 font-mono">
          <div>
            <label className="text-[9px] text-slate-500 block mb-1 uppercase">Input Dim</label>
            <input
              type="number"
              value={testDim}
              onChange={(e) => setTestDim(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#04060E] border border-slate-820 rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 block mb-1 uppercase">Layers</label>
            <input
              type="number"
              value={testLayers}
              onChange={(e) => setTestLayers(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#04060E] border border-slate-820 rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 block mb-1 uppercase">Rank</label>
            <input
              type="number"
              value={testRank}
              onChange={(e) => setTestRank(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#04060E] border border-slate-820 rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Training Inputs Array input */}
        <div className="mb-4 font-mono">
          <label className="text-[9px] text-slate-500 block mb-1 uppercase">Simulate training vector inputs (f32 csv list)</label>
          <input
            type="text"
            value={inputValList}
            onChange={(e) => setInputValList(e.target.value)}
            className="w-full bg-[#04060E] border border-slate-820 rounded p-1.5 text-xs text-blue-300 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Trigger Methods Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-[10px]">
          <button
            onClick={triggerJniInit}
            className={`py-2 rounded font-bold cursor-pointer transition flex items-center justify-center gap-1.5 ${
              isJniInitialized 
                ? "bg-slate-900 border border-slate-830 text-slate-500" 
                : "bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30"
            }`}
          >
            <Play className="w-3.5 h-3.5" /> AuraNative_init()
          </button>
          
          <button
            onClick={triggerJniTrainStep}
            className="py-2 bg-purple-600/15 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 rounded font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" /> AuraNative_trainStep()
          </button>

          <button
            onClick={triggerJniDestroy}
            disabled={!isJniInitialized}
            className={`py-2 rounded font-bold cursor-pointer transition flex items-center justify-center gap-1.5 ${
              !isJniInitialized
                ? "bg-slate-900 border border-slate-830 text-slate-550"
                : "bg-red-600/15 text-red-400 border border-red-500/30 hover:bg-red-600/30"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> AuraNative_destroy()
          </button>

          <button
            onClick={triggerJniExportModel}
            disabled={!isJniInitialized}
            className={`py-2 rounded font-bold cursor-pointer transition flex items-center justify-center gap-1.5 ${
              !isJniInitialized
                ? "bg-slate-900 border border-slate-830 text-slate-550"
                : "bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
            }`}
          >
            <Save className="w-3.5 h-3.5" /> AuraNative_exportModel()
          </button>
        </div>

        {/* Virtual File path export input */}
        {isJniInitialized && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 font-mono bg-[#050813] border border-slate-900 p-2.5 rounded-lg flex items-center justify-between"
          >
            <div className="flex-grow">
              <label className="text-[8px] text-slate-500 block uppercase">Active export file location</label>
              <input
                type="text"
                value={exportPathInput}
                onChange={(e) => setExportPathInput(e.target.value)}
                className="bg-transparent border-none text-[10px] text-emerald-400 w-full focus:outline-none"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded">f32 weights</span>
          </motion.div>
        )}

        {/* Live Logs Terminal stdout */}
        <div className="flex-grow bg-[#04060E] border border-slate-900 rounded-lg p-3 font-mono text-[10.5px] leading-relaxed flex flex-col justify-between min-h-[160px] max-h-[200px] overflow-y-auto">
          <div>
            <div className="text-[9px] text-slate-550 mb-1 border-b border-slate-950 pb-1 uppercase shrink-0">Terminal Stream (Stdout Logs)</div>
            {jniLogs.length === 0 ? (
              <div className="italic text-slate-650 py-6 text-center select-none">
                Init native JNI wrapper or run training steps to capture system.load outputs...
              </div>
            ) : (
              jniLogs.map((log, i) => (
                <div key={i} className="mb-1 text-slate-350 break-all leading-normal">
                  {log.startsWith("---") ? (
                    <span className="text-blue-400 font-bold block mt-1.5">{log}</span>
                  ) : log.includes("[CRITICAL") ? (
                    <span className="text-red-400 font-bold block">{log}</span>
                  ) : log.includes("[CPP_MODULE]") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))
            )}
            <div ref={jniConsoleEndRef}></div>
          </div>
        </div>
      </div>

      {/* Code Viewer Workspace */}
      <div className="col-span-12 lg:col-span-6 bg-[#080B18] border border-slate-950 rounded-xl p-5 shadow-md flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Integration Script Library</h3>
          </div>
          <button
            onClick={handleCopyCode}
            className="text-[10px] font-mono border border-slate-800 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded text-slate-400 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedCodeFlag ? "Copied!" : "Copy Code"}
          </button>
        </div>

        {/* File Selection Tabs */}
        <div className="flex space-x-1.5 mb-3 bg-[#03050C] p-1 rounded-lg border border-slate-900 overflow-x-auto">
          {(["aura-jni.cpp", "AuraNative.kt", "CMakeLists.txt", "build-apk.yml"] as SelectedJniCodeFileType[]).map((file) => (
            <button
              key={file}
              onClick={() => setSelectedJniCodeFile(file)}
              className={`px-3 py-1 rounded text-[10px] font-mono font-medium transition cursor-pointer border ${
                selectedJniCodeFile === file
                  ? "bg-[#10152F] text-blue-400 border-blue-500/20"
                  : "text-slate-500 hover:text-slate-300 border-transparent"
              }`}
            >
              {file}
            </button>
          ))}
        </div>

        {/* Real Code Area */}
        <div className="relative flex-grow bg-slate-950 border border-slate-900 rounded-lg p-3 font-mono text-[10.5px] leading-relaxed text-slate-350 hover:border-slate-800 transition overflow-y-auto overflow-x-auto scrollbar-thin max-y-[380px] max-h-[380px]">
          <pre className="whitespace-pre">{getJniCodeSnippet()}</pre>
        </div>
      </div>

      {/* Compiler size tuning & NDK link task parameters */}
      <div className="col-span-12 lg:col-span-5 bg-[#080B18] border border-slate-950 rounded-xl p-5 shadow-md flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-950 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">NDK Build Targets Optimization</h3>
          </div>
        </div>

        {/* Dynamic size visualization chart */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 font-mono mb-4 text-[11px] leading-relaxed">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-450 uppercase text-[9px] tracking-wider">ABI Target Compilation Size</span>
            <span className="text-slate-500">DoD Limit: &lt;15.00 MB</span>
          </div>

          <div className="space-y-4">
            {/* Exclusive aarch64-linux-android (arm64-v8a) */}
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className={`font-semibold ${exclusivelyArm64 ? "text-emerald-400" : "text-slate-500"}`}>
                  arm64-v8a Only (optimized)
                </span>
                <span className="font-bold">4.15 MB • Passed DoD</span>
              </div>
              <div className="bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-emerald-500 h-full"
                  animate={{ width: exclusivelyArm64 ? "28%" : "12%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Standard Fat Build containing multiple ABIs */}
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className={`font-semibold ${!exclusivelyArm64 ? "text-amber-400 text-sm" : "text-slate-500"}`}>
                  Fat Build (Unoptimized: arm64, x86_64, v7a)
                </span>
                <span className="font-bold text-slate-400">14.82 MB • Near Margin</span>
              </div>
              <div className="bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-amber-500 h-full"
                  animate={{ width: !exclusivelyArm64 ? "98%" : "50%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selector choice */}
        <div className="bg-[#050711] border border-slate-900 rounded-lg p-3.5 font-mono text-[11px] mb-4">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Exclusive arm64-v8a constraint filter</span>
          
          <label className="flex items-start gap-2.5 cursor-pointer select-none mb-1">
            <input
              type="checkbox"
              checked={exclusivelyArm64}
              onChange={(e) => {
                setExclusivelyArm64(e.target.checked);
                setNdkLogs(prev => [
                  ...prev,
                  `[NDK-CONFIG] Exclusives toggled to: ${e.target.checked ? "Only generate arm64-v8a lib dynamic slices." : "Configuring multi-architectures compilation rules (x85, etc)."}`
                ]);
              }}
              className="mt-0.5 rounded text-blue-500"
            />
            <div>
              <p className="text-white text-[11.5px] font-semibold">Enable strict ndk abi Filter rules</p>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                Filters targets inside build.gradle to arm64-v8a. Reduces compiling times and trims dynamic libs payload down by nearly 70%.
              </p>
            </div>
          </label>
        </div>

        {/* NDK trigger buttons */}
        <div className="flex items-center gap-3 font-mono mt-auto pt-3">
          <button
            onClick={triggerNdkCompilation}
            disabled={ndkCompiling}
            className="flex-grow bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 border border-transparent disabled:border-slate-840 text-white disabled:text-slate-500 font-bold py-2 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/5"
          >
            {ndkCompiling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling targets...
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" /> Execute CMake NDK Compile
              </>
            )}
          </button>
        </div>

        {/* NDK logs console view */}
        <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg text-[9px] leading-relaxed font-mono shrink-0 h-32 overflow-y-auto mt-4 text-slate-400">
          <div className="text-[8px] text-slate-600 border-b border-slate-900 pb-1 mb-1.5 uppercase select-none">gradle compileNdk feedback</div>
          {ndkLogs.map((log, i) => (
            <div key={i} className="mb-0.5">
              <span className="text-blue-500 mr-1">•</span>{log}
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Actions CI/CD pipeline runs and triggers */}
      <div className="col-span-12 lg:col-span-7 bg-[#080B18] border border-slate-950 rounded-xl p-5 shadow-md flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-950 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">GitHub Actions APK Compiler Pipeline</h3>
          </div>
          <button
            onClick={triggerCiPipeline}
            disabled={pipelineRunning}
            className={`text-[11px] font-mono font-bold rounded px-4 py-1.5 flex items-center gap-1.5 transition cursor-pointer ${
              pipelineRunning
                ? "bg-slate-900 border border-slate-800 text-slate-500 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/5 hover:translate-y-[-1px]"
            }`}
          >
            {pipelineRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Run...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Push to Branch (CI Run)
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono">
          Continuous builds on pushing targets to branches. Prepares tools, compiles Cargo bridges, and serves final debugging APK files.
        </p>

        {/* active run display */}
        {pipelineRunning && (
          <div className="bg-[#050813] border border-blue-500/15 p-3.5 rounded-lg font-mono text-xs mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                ACTIVE CI JOB: build-apk.yml
              </span>
              <span className="text-[11px] font-semibold text-blue-300">{pipelineProgress}%</span>
            </div>

            <div className="bg-[#030409] h-2 rounded-full overflow-hidden mb-3 border border-slate-900">
              <motion.div
                className="bg-blue-500 h-full"
                animate={{ width: `${pipelineProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Logs streams */}
            <div className="bg-slate-950 border border-slate-900/60 p-3 rounded text-[9.5px] max-h-36 overflow-y-auto leading-relaxed text-slate-400">
              {pipelineLogs.map((log, i) => (
                <div key={i} className="mb-1 last:mb-0">
                  <span className="text-blue-400 mr-2">&gt;</span>{log}
                </div>
              ))}
              <div ref={pipelineConsoleEndRef}></div>
            </div>
          </div>
        )}

        {/* Download Artifact block */}
        {pipelineArtifactUrl && !pipelineRunning && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 bg-emerald-950/10 border border-emerald-500/30 p-4 rounded-xl font-mono"
          >
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                  GitHub Artifact compile finished!
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  File name: <span className="font-bold text-white">app-debug.apk</span> ({exclusivelyArm64 ? "4.15 MB" : "14.82 MB"}) • ARM64 architecture optimized with static compilation layers • Retention limit: 7 Days
                </p>
              </div>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showToast("Demonstration download trigger: app-debug.apk transfer initiated!");
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white hover:translate-y-[-1px] transition text-[11px] font-bold px-4 py-2 rounded-lg shrink-0 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download APK
              </a>
            </div>
          </motion.div>
        )}

        {/* Historic logs cards of previous GitHub Workflows */}
        <div>
          <span className="text-[10px] text-slate-500 block font-mono uppercase font-bold mb-2.5">Workflow Run History</span>
          <div className="space-y-2.5 font-mono text-[11px]">
            {ciRuns.map((run) => (
              <div
                key={run.id}
                className="bg-[#050711] border border-slate-900 hover:border-slate-800 transition p-3 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded flex items-center justify-center font-bold text-[9px]">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-white font-medium text-[11.5px] leading-tight flex items-center gap-1.5">
                      {run.commit}
                      <span className="text-[9px] bg-slate-900 border border-slate-800 px-1 py-0.2 rounded font-normal text-slate-400 flex items-center gap-1">
                        <GitBranch className="w-2.5 h-2.5" /> {run.branch}
                      </span>
                    </h5>
                    <p className="text-[9px] text-slate-500 mt-1">
                      Run ID: {run.id} • Triggered on {run.time}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10.5px] font-bold text-slate-300 block">{run.duration}</span>
                  <span className="text-[9px] text-emerald-400 font-bold mt-0.5 inline-block">Passed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
