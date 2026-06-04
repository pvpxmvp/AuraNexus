/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { useAuraContext } from "../store/AuraContext";

export function useThermalMonitor() {
  const {
    cpuTemp,
    setCpuTemp,
    setPacingStatus,
    setPacingDelay,
    androidLifecycle,
    tempHistory,
    setTempHistory,
    autoHeatEnabled,
    setPacingIterationHz,
    setNdkLogs
  } = useAuraContext();

  const prevPacingStatusRef = useRef<string>("Full Speed");

  // Keep polling thermal state and adjusting dynamic delays
  useEffect(() => {
    if (androidLifecycle !== "Active") {
      setPacingIterationHz(0);
      return;
    }

    let status: "Full Speed" | "Throttling" | "Emergency Stop" = "Full Speed";
    let delay = 0;
    let hz = 120;

    if (cpuTemp < 38.0) {
      status = "Full Speed";
      delay = 0;
      hz = Math.round(112 + Math.random() * 12);
    } else if (cpuTemp >= 38.0 && cpuTemp <= 42.0) {
      status = "Throttling";
      delay = 5;
      hz = Math.round(48 + Math.random() * 10);
    } else {
      status = "Emergency Stop";
      delay = 9999;
      hz = 0;
    }

    setPacingStatus(status);
    setPacingDelay(delay);
    setPacingIterationHz(hz);

    const currentTimeString = new Date().toTimeString().split(" ")[0];

    if (status !== prevPacingStatusRef.current) {
      let logMsg = "";
      if (status === "Full Speed") {
        logMsg = `THERM: Temperature cooled below 38°C (${cpuTemp.toFixed(1)}°C). Cooldown complete. Restoring Full Core Capacity. Atomic register delay reset to 0ms.`;
      } else if (status === "Throttling") {
        logMsg = `THERM: Temperature warm at ${cpuTemp.toFixed(1)}°C (≥ 38°C). HardwarePropertiesManager engaged. Activating digital PWM throttling (inserting 5ms delay per epoch cycle).`;
      } else if (status === "Emergency Stop") {
        logMsg = `THERM: CRITICAL HEAT OVERLOAD ERROR! CPU temperature at ${cpuTemp.toFixed(1)}°C exceeds 42.0°C limit! Native train threads suspended instantly (cooldown active).`;
      }

      setNdkLogs(prev => [
        {
          id: Date.now().toString(),
          time: currentTimeString,
          service: "THERM",
          msg: logMsg
        },
        ...prev
      ]);
      prevPacingStatusRef.current = status;
    }
  }, [cpuTemp, androidLifecycle, setPacingStatus, setPacingDelay, setPacingIterationHz, setNdkLogs]);

  // Simulated auto heater loops
  useEffect(() => {
    let intervalId: any = null;

    if (autoHeatEnabled && androidLifecycle === "Active") {
      intervalId = setInterval(() => {
        setCpuTemp(prev => {
          let nextTemp = prev;
          if (prev > 42.0) {
            nextTemp = prev - 0.75;
            if (nextTemp <= 38.8) {
              nextTemp = 38.8;
            }
          } else if (prev >= 38.0) {
            nextTemp = prev + (Math.random() > 0.4 ? 0.15 : -0.1);
          } else {
            nextTemp = prev + 0.38;
          }

          const roundedTemp = parseFloat(nextTemp.toFixed(1));

          setTempHistory(history => {
            const lastTime = history[history.length - 1]?.time || "0s";
            const lastSecs = parseInt(lastTime.replace("s", "")) || 0;
            const newTime = `${lastSecs + 2}s`;
            let usagePercent = 100;
            if (prev > 42.0) usagePercent = 0;
            else if (prev >= 38.0) usagePercent = 45;
            
            const newHistory = [...history, { time: newTime, temp: roundedTemp, rate: usagePercent }];
            if (newHistory.length > 15) newHistory.shift();
            return newHistory;
          });

          return roundedTemp;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoHeatEnabled, androidLifecycle, setCpuTemp, setTempHistory]);

  return {
    cpuTemp,
    tempHistory
  };
}
