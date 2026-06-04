/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function generateSineWave(length: number, frequency = 1.0): number[] {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push(Math.sin((i / (length - 1)) * Math.PI * 2 * frequency));
  }
  return data;
}

export function generateNoisySignal(length: number): number[] {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push((Math.random() - 0.5) * 2.0);
  }
  return data;
}
