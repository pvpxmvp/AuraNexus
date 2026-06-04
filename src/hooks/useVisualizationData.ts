/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { useAuraContext } from "../store/AuraContext";

export function useVisualizationData() {
  const { trainingHistory, threshold } = useAuraContext();

  const visualizationData = useMemo(() => {
    if (!trainingHistory || trainingHistory.length === 0) {
      return {
        thresholdY: 100 - (threshold / 8) * 100,
        posPoints: "",
        negPoints: "",
        isEmpty: true
      };
    }

    const thresholdY = 100 - (threshold / 8) * 100;

    const posPoints = trainingHistory
      .map((pt, idx) => {
        const x = (idx / (trainingHistory.length - 1)) * 100;
        const y = 100 - Math.min(100, (pt.posGoodness / 8) * 100);
        return `${x},${y}`;
      })
      .join(" ");

    const negPoints = trainingHistory
      .map((pt, idx) => {
        const x = (idx / (trainingHistory.length - 1)) * 100;
        const y = 100 - Math.min(100, (pt.negGoodness / 8) * 100);
        return `${x},${y}`;
      })
      .join(" ");

    return {
      thresholdY,
      posPoints,
      negPoints,
      isEmpty: false
    };
  }, [trainingHistory, threshold]);

  return visualizationData;
}
