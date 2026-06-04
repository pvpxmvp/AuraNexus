/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BookOpen, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

export const MathGuideTab: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 text-[#A0AEC0]"
    >
      {/* Introduction column */}
      <div className="md:col-span-7 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-5 space-y-4">
        <div className="flex items-center space-x-2 text-slate-200 border-b border-slate-900 pb-3">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold tracking-tight uppercase font-mono">FORWARD-FORWARD HINTON CRITERIA</h2>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            Traditional neural architectures rely on **Backpropagation**—requiring a full backward pass of loss gradients through every layer. In mobile scenarios, preserving active network steps in memory bounds is expensive and blocks parallel SIMD caching.
          </p>

          <p>
            **Hinton's Forward-Forward Algorithm (FFA)** substitutes the backward pass with two competing forward passes:
          </p>

          {/* Formulas block */}
          <div className="p-4 bg-slate-950 rounded-xl space-y-3.5 border border-slate-920">
            <div className="flex flex-col gap-1.5 border-b border-slate-900/40 pb-2">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase font-mono">1. Positive Pass (Real Signals)</span>
              <p className="text-slate-400">Maximize energy for true datasets:</p>
              <div className="bg-slate-900 p-2 text-center rounded text-white font-mono text-[11px] font-semibold border border-slate-900">
                Goodness(y_pos) = 1/D * ∑ [ (W * pos_in)^2 ] &gt; θ
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-indigo-400 font-semibold uppercase font-mono">2. Negative Pass (Noisy Signals)</span>
              <p className="text-slate-400">Minimize energy for synthetic or corrupted inputs:</p>
              <div className="bg-slate-900 p-2 text-center rounded text-white font-mono text-[11px] font-semibold border border-slate-900">
                Goodness(y_neg) = 1/D * ∑ [ (W * neg_in)^2 ] &lt; θ
              </div>
            </div>
          </div>

          <p>
            By computing optimization metrics locally within each independent **Tensor Train Core**, backpropagation is completely bypassed. Cores train natively parallel, maximizing hardware thread caching during streaming.
          </p>
        </div>
      </div>

      {/* Guide details column */}
      <div className="md:col-span-5 space-y-4">
        <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900 p-5 space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-200 border-b border-slate-900 pb-2">
            <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold tracking-tight uppercase">Low-Rank Core Connections</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Instead of dense weights matrices which consume valuable system L3 cache, we represent weights using a low-rank **Tensor Train Core** decompose structure.
          </p>

          <p className="text-xs text-slate-400 leading-relaxed">
            A dense weight dimension of size <span className="font-mono text-[#E2E8F0]">(D × M)</span> is structured dynamically as a sequence of linked orthogonal cores:
          </p>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-center text-slate-300 font-mono text-[10px] font-semibold">
            G_n ∈ ℝ^(r_(n-1) × d_n × r_n)
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The link rank <span className="text-emerald-400 font-semibold font-mono">r_n</span> dynamically contracts or expands based on feedback. In doing so, we scale representational storage size dynamically on-device with <span className="text-indigo-400 font-semibold">zero network rebuild overhead</span>!
          </p>
        </div>

        <div className="bg-slate-900/15 p-4 rounded-xl border border-slate-900 text-xs leading-relaxed">
          <span className="text-indigo-400 font-bold block mb-1">Crystallization Equation:</span>
          When training finishes, JNI crystallizes the active pathways into static FlatBuffer matrices, ready for embedded .tflite compilers.
        </div>
      </div>
    </motion.div>
  );
};
