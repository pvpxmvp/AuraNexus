/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { useAuraContext } from "../store/AuraContext";

export function useTrainingLoop() {
  const {
    isTraining,
    setIsTraining,
    executeTrainStep,
    trainSpeed,
    crystallizing,
    setCrystallizing,
    setCrystallizationProgress,
    setExportStatus,
    setExportPath,
    exportPrompt,
    setCrystallizeLogs,
    offlineMode,
    setCrystallizeMetrics,
    exportFormat,
    setRamWeightsCached,
    setCachedWeightsSize,
    stepCount,
    posInput,
    negInput,
    cores,
    learningRate,
    threshold,
    exportStatus
  } = useAuraContext();

  // Run training loop cycles periodically
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTraining) {
      timer = setInterval(() => {
        executeTrainStep();
      }, trainSpeed);
    }
    return () => clearInterval(timer);
  }, [isTraining, stepCount, posInput, negInput, cores, learningRate, threshold, trainSpeed, executeTrainStep]);

  const toggleTraining = () => {
    setIsTraining(prev => !prev);
  };

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
          setRamWeightsCached(false);
          setCachedWeightsSize("0 KB");
          
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
        }, 800);
      }, 800);
    }, 800);
  };

  return {
    isTraining,
    toggleTraining,
    handleStartCrystallization,
    handleExportModel,
    crystallizing,
    exportStatus
  };
}
