/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import { motion } from "motion/react";

export const RustCodeTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>("lib.rs");
  const [copied, setCopied] = useState<boolean>(false);

  const rustFilesData: Record<string, string> = {
    "lib.rs": `use std::alloc::{alloc, dealloc, Layout};
use rand::Rng;

pub struct CacheAlignedArena {
    ptr: *mut u8,
    size: usize,
    offset: usize,
    layout: Layout,
}

impl CacheAlignedArena {
    pub fn new(size_mb: usize) -> Self {
        let size = size_mb * 1024 * 1024;
        let layout = Layout::from_size_align(size, 128).unwrap();
        let ptr = unsafe { alloc(layout) };
        if ptr.is_null() {
            panic!("Critical Core Alloc Failure: Could not bind cache-aligned arena");
        }
        Self { ptr, size, offset: 0, layout }
    }

    pub fn allocate_aligned(&mut self, bytes: usize, alignment: usize) -> *mut f32 {
        let current_ptr = unsafe { self.ptr.add(self.offset) } as usize;
        let mask = alignment - 1;
        let alignment_offset = (alignment - (current_ptr & mask)) & mask;
        
        if self.offset + alignment_offset + bytes > self.size {
            panic!("AuraCore Arena Out of Memory Bounds!");
        }
        
        self.offset += alignment_offset;
        let allocated_ptr = unsafe { self.ptr.add(self.offset) } as *mut f32;
        self.offset += bytes;
        allocated_ptr
    }

    pub fn reset(&mut self) {
        self.offset = 0;
    }
}

pub struct TensorCore {
    pub r_prev: usize,
    pub d: usize,
    pub r_curr: usize,
    pub weights: Vec<Vec<Vec<f32>>>, // [r_prev, d, r_curr]
}

impl TensorCore {
    pub fn new(r_prev: usize, d: usize, r_curr: usize) -> Self {
        let mut rng = rand::thread_rng();
        let scale = 1.0 / (d as f32).sqrt();
        let weights = (0..r_prev)
            .map(|_| {
                (0..d)
                    .map(|_| (0..r_curr).map(|_| rng.gen_range(-scale..scale)).collect())
                    .collect()
            })
            .collect();
        Self { r_prev, d, r_curr, weights }
    }

    // Direct Forward-Only projection of incoming signal
    pub fn forward_step(&self, x_in: &[f32]) -> Vec<f32> {
        let mut next_s = vec![0.0; self.r_curr];
        for b in 0..self.r_curr {
            let mut sum_val = 0.0;
            for a in 0..self.r_prev {
                for j in 0..self.d {
                    sum_val += x_in[j] * self.weights[a][j][b];
                }
            }
            next_s[b] = sum_val;
        }
        next_s
    }
}`,
    "arena.rs": `// AuraCore Aligned Arena Memory Module
// Restricts GC footprints & limits allocation barriers

pub const CACHE_LINE_SIZE: usize = 128; // Avoid false sharing in multi-core context

#[repr(align(128))]
pub struct AlignedTensorSegment {
    pub data: [f32; 1024],
    pub valid_length: usize,
}

impl AlignedTensorSegment {
    pub fn zeroed() -> Self {
        Self {
            data: [0.0; 1024],
            valid_length: 0,
        }
    }

    pub fn compute_vector_goodness(&self) -> f32 {
        // SSE/AVX register simulation
        let mut goodness = 0.0;
        for i in 0..self.valid_length {
            let val = self.data[i];
            goodness += val * val; // Hinton Goodness (Sum of squares)
        }
        goodness / (self.valid_length as f32).max(1.0)
    }
}`,
    "stabilization.rs": `// Stability and Precision Module
// Eliminates weight explosion risk & implements deterministic expansion threshold

pub struct AntiExplosionKit {
    weight_clip_limit: f32,
    goodness_scale_factor: f32,
}

impl AntiExplosionKit {
    pub fn new(clip_val: f32, scale_val: f32) -> Self {
        Self {
            weight_clip_limit: clip_val,
            goodness_scale_factor: scale_val,
        }
    }

    // Applies Weight Clipping
    pub fn enforce_weight_clip(&self, weights: &mut [f32]) {
        for val in weights.iter_mut() {
            if *val > self.weight_clip_limit {
                *val = self.weight_clip_limit;
            } else if *val < -self.weight_clip_limit {
                *val = -self.weight_clip_limit;
            }
        }
    }

    // Deterministic orthogonal Expansion criterion logic
    pub fn check_requires_expansion(&self, current_goodness: f32, threshold: f32, epochs_stagnant: usize) -> bool {
        // If goodness is below the target threshold for more than 15 epochs, expand!
        if current_goodness < threshold && epochs_stagnant >= 15 {
            return true;
        }
        false
    }
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rustFilesData[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 text-[#A0AEC0]"
    >
      {/* File Sidebar */}
      <div className="md:col-span-3 space-y-3">
        <div className="bg-[#0A0D1A] rounded-2xl border border-slate-900/85 p-4 space-y-2">
          <span className="text-[10px] font-mono text-slate-500 block font-semibold mb-2">KERNEL MODULE DETAILS</span>
          
          {Object.keys(rustFilesData).map((fileName) => (
            <button
              key={fileName}
              onClick={() => setSelectedFile(fileName)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono transition flex items-center gap-2 cursor-pointer ${
                selectedFile === fileName
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-950/40 text-slate-400 border border-transparent hover:bg-slate-900/60"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {fileName}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/15 p-4 rounded-xl border border-slate-900 text-[11px] leading-relaxed">
          <span className="text-emerald-400 font-semibold block mb-1">Architecture Note:</span>
          These native core files are compiled with <span className="font-mono text-slate-300">rustc -O</span> compiling targeted instructions directly down to Android ARM64 assembly with maximum cache alignment.
        </div>
      </div>

      {/* Code viewer panel */}
      <div className="md:col-span-9 bg-[#0A0D1A] rounded-2xl border border-slate-900 p-5 space-y-3 flex flex-col h-[520px]">
        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-emerald-400 text-xs">src/</span>
            <span className="text-white text-xs font-semibold">{selectedFile}</span>
          </div>

          <button
            onClick={handleCopy}
            className="bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "COPIED!" : "COPY SHIELD CODE"}
          </button>
        </div>

        {/* Dynamic code window */}
        <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 border border-slate-900 select-all whitespace-pre">
          {rustFilesData[selectedFile]}
        </div>
      </div>
    </motion.div>
  );
};
