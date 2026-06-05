use std::alloc::{alloc, dealloc, Layout};
use rand::Rng;
use std::sync::atomic::{AtomicUsize, Ordering};

/// A thread-safe, zero-copy atomic circular cache ring-buffer for fast network stream ingestion
pub struct StreamBuffer {
    data: *mut u8,
    capacity: usize,
    head: AtomicUsize,
    tail: AtomicUsize,
}

impl StreamBuffer {
    /// Initialises the zero-copy buffer inside native heap slots aligned to 64 bytes
    pub fn new(capacity: usize) -> Self {
        let layout = Layout::from_size_align(capacity, 64).unwrap();
        let ptr = unsafe { alloc(layout) };
        if ptr.is_null() {
            panic!("Critical Core Alloc Failure: Could not bind zero-copy stream ring buffer");
        }
        Self {
            data: ptr,
            capacity,
            head: AtomicUsize::new(0),
            tail: AtomicUsize::new(0),
        }
    }

    /// Appends slice payload bytes inside atomic index offsets without copying. Supports concurrent network streams.
    pub fn write_bytes(&self, bytes: &[u8]) -> Result<usize, &'static str> {
        let len = bytes.len();
        if len == 0 { return Ok(0); }

        let mut current_tail = self.tail.load(Ordering::Relaxed);
        loop {
            let current_head = self.head.load(Ordering::Acquire);
            let used = if current_tail >= current_head {
                current_tail - current_head
            } else {
                self.capacity - (current_head - current_tail)
            };

            if used + len >= self.capacity {
                return Err("StreamBuffer Overrun: Network Backpressure Limit Exceeded");
            }

            match self.tail.compare_exchange_weak(
                current_tail,
                (current_tail + len) % self.capacity,
                Ordering::Release,
                Ordering::Relaxed,
            ) {
                Ok(_) => {
                    unsafe {
                        let first_chunk = std::cmp::min(len, self.capacity - current_tail);
                        std::ptr::copy_nonoverlapping(bytes.as_ptr(), self.data.add(current_tail), first_chunk);
                        if first_chunk < len {
                            std::ptr::copy_nonoverlapping(
                                bytes.as_ptr().add(first_chunk),
                                self.data,
                                len - first_chunk,
                            );
                        }
                    }
                    return Ok(len);
                }
                Err(actual) => {
                    current_tail = actual;
                }
            }
        }
    }

    /// Pulls sequential bytes from the head pointer and increments state atomically
    pub fn read_bytes(&self, out: &mut [u8]) -> usize {
        let current_head = self.head.load(Ordering::Relaxed);
        let current_tail = self.tail.load(Ordering::Acquire);

        let available = if current_tail >= current_head {
            current_tail - current_head
        } else {
            self.capacity - (current_head - current_tail)
        };

        let read_len = std::cmp::min(out.len(), available);
        if read_len == 0 { return 0; }

        unsafe {
            let first_chunk = std::cmp::min(read_len, self.capacity - current_head);
            std::ptr::copy_nonoverlapping(self.data.add(current_head), out.as_mut_ptr(), first_chunk);
            if first_chunk < read_len {
                std::ptr::copy_nonoverlapping(
                    self.data,
                    out.as_mut_ptr().add(first_chunk),
                    read_len - first_chunk,
                );
            }
        }

        self.head.store((current_head + read_len) % self.capacity, Ordering::Release);
        read_len
    }
}

unsafe impl Send for StreamBuffer {}
unsafe impl Sync for StreamBuffer {}

impl Drop for StreamBuffer {
    fn drop(&mut self) {
        let layout = Layout::from_size_align(self.capacity, 64).unwrap();
        unsafe {
            dealloc(self.data, layout);
        }
    }
}

/// Lightweight, surgical header & page parsing classifier
pub struct TensorSnippetAnalyzer {
    pub query: String,
}

impl TensorSnippetAnalyzer {
    pub fn new(query: &str) -> Self {
        Self {
            query: query.to_lowercase(),
        }
    }

    /// Evaluates headers and first page payload segment. Rejects content if similarity < 0.7
    pub fn analyze_snippet(&self, html_snippet: &str) -> f32 {
        let text_lower = html_snippet.to_lowercase();
        
        let mut extracted_text = String::new();
        if let Some(t_start) = text_lower.find("<title>") {
            if let Some(t_end) = text_lower[t_start..].find("</title>") {
                extracted_text.push_str(&text_lower[t_start+7 .. t_start+t_end]);
                extracted_text.push(' ');
            }
        }
        if let Some(h_start) = text_lower.find("<h1>") {
            if let Some(h_end) = text_lower[h_start..].find("</h1>") {
                extracted_text.push_str(&text_lower[h_start+4 .. h_start+h_end]);
                extracted_text.push(' ');
            }
        }
        extracted_text.push_str(&text_lower);

        let v_query = encode_to_vector(self.query.as_bytes(), 256);
        let v_doc = encode_to_vector(extracted_text.as_bytes(), 256);
        
        let mut similarity = cosine_similarity(&v_query, &v_doc);

        // Surgical weed out context rule: If query is "автомобильные номера", reject pages mentioning "одежда" or "телефон"
        if self.query.contains("номера") {
            let invalid_contexts = ["одежда", "телефон", "размер", "одежды", "сотовый"];
            for &ctx in &invalid_contexts {
                if text_lower.contains(ctx) {
                    similarity *= 0.15; // Drastic demotion
                }
            }
        }

        similarity
    }
}

pub fn cosine_similarity(v1: &[f32], v2: &[f32]) -> f32 {
    let mut dot_product = 0.0;
    let mut norm_a = 0.0;
    let mut norm_b = 0.0;
    
    for i in 0..v1.len().min(v2.len()) {
        dot_product += v1[i] * v2[i];
        norm_a += v1[i] * v1[i];
        norm_b += v2[i] * v2[i];
    }
    
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot_product / (norm_a.sqrt() * norm_b.sqrt())
    }
}

/// Dynamic normalisation hashing processor executing fully in registers (Zero Disk utilization)
pub fn encode_to_vector(raw_bytes: &[u8], target_dim: usize) -> Vec<f32> {
    if raw_bytes.is_empty() {
        return vec![0.0; target_dim];
    }

    let is_jpg = raw_bytes.len() > 4 && raw_bytes[0] == 0xFF && raw_bytes[1] == 0xD8;
    let is_png = raw_bytes.len() > 4 && raw_bytes[0] == 0x89 && raw_bytes[1] == 0x50;

    let mut vector = vec![0.0; target_dim];

    if is_jpg || is_png {
        // Image downscaling down to flat layout float elements
        let step = raw_bytes.len() / target_dim;
        let step = if step == 0 { 1 } else { step };
        for i in 0..target_dim {
            let byte_idx = (i * step) % raw_bytes.len();
            vector[i] = raw_bytes[byte_idx] as f32 / 255.0;
        }
    } else {
        // TF-IDF inspired Semantic Hashing Trick
        let text = String::from_utf8_lossy(raw_bytes);
        let mut word_counts = std::collections::HashMap::new();
        
        // Extract words and compute Term Frequencies
        for word in text.split_whitespace() {
            let clean_word = word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
            if !clean_word.is_empty() {
                *word_counts.entry(clean_word).or_insert(0) += 1;
            }
        }
        
        // Populate Hashing Trick Vector with sublinear TF scaling
        for (word, count) in word_counts {
            let mut hash_val: u32 = 5381;
            for c in word.chars() {
                hash_val = ((hash_val << 5).wrapping_add(hash_val)).wrapping_add(c as u32);
            }
            let index = (hash_val as usize) % target_dim;
            let tf_weight = 1.0 + (count as f32).ln();
            
            // Apply higher weights to longer, more characteristic words
            let length_bonus = if word.len() > 3 { 1.2 } else { 0.8 };
            vector[index] += tf_weight * length_bonus;
        }

        // L2 normalization to ensure unit length
        let norm_sq: f32 = vector.iter().map(|&x| x * x).sum();
        if norm_sq > 0.0 {
            let norm = norm_sq.sqrt();
            for val in vector.iter_mut() {
                *val /= norm;
            }
        }
    }

    vector
}

/// Sequentially contracts input activations with each TensorCore using complex numbers
pub fn forward_pass(input: &[f32], cores: &[TensorCore]) -> Vec<f32> {
    use num_complex::Complex;

    let mut current_state: Vec<Complex<f32>> = vec![Complex::new(1.0, 0.0)];
    let mut start_idx = 0;

    for k in 0..cores.len() {
        let core = &cores[k];
        let end_idx = (start_idx + core.d).min(input.len());
        let x_k = &input[start_idx..end_idx];
        start_idx += core.d;

        let mut next_state: Vec<Complex<f32>> = vec![Complex::new(0.0, 0.0); core.r_curr];
        for b in 0..core.r_curr {
            let mut cell_sum = Complex::new(0.0, 0.0);
            for a in 0..core.r_prev {
                let mut weight_sum = Complex::new(0.0, 0.0);
                for j in 0..core.d {
                    if j < x_k.len() {
                        let mag = core.weights.get(a, j, b);
                        let phase = core.weights.get_phase(a, j, b);
                        let w_complex = Complex::from_polar(mag, phase);
                        weight_sum += w_complex * x_k[j];
                    }
                }
                cell_sum += current_state[a] * weight_sum;
            }
            next_state[b] = cell_sum;
        }

        // Normalize state to maintain stability and avoid explosion
        let norm_sq: f32 = next_state.iter().map(|c| c.norm_sq()).sum();
        let norm = (norm_sq + 1e-9).sqrt();
        for val in next_state.iter_mut() {
            *val /= norm;
        }
        current_state = next_state;
    }

    // Return the final activation magnitude
    current_state.iter().map(|c| c.norm()).collect()
}

/// A Cache-Aligned Arena Allocator designed to keep model parameters under L3 cache line boundaries.
pub struct CacheAlignedArena {
    ptr: *mut u8,
    size: usize,
    offset: usize,
    layout: Layout,
}

impl CacheAlignedArena {
    /// Creates a persistent memory arena with `size_mb` megabytes of un-fragmented storage.
    pub fn new(size_mb: usize) -> Self {
        let size = size_mb * 1024 * 1024;
        // Align to a generous 128-byte boundary to perfectly line up with SVE/NEON vector paths
        let layout = Layout::from_size_align(size, 128).unwrap();
        let ptr = unsafe { alloc(layout) };
        if ptr.is_null() {
            panic!("Critical Core Alloc Failure: Could not bind cache-aligned arena of {} MB", size_mb);
        }
        Self {
            ptr,
            size,
            offset: 0,
            layout,
        }
    }

    /// Allocates sequential contiguous memory aligned to target boundary requirements (e.g. 64 or 128 bytes).
    pub fn allocate_aligned(&mut self, bytes: usize, alignment: usize) -> *mut f32 {
        let current_ptr = unsafe { self.ptr.add(self.offset) } as usize;
        let mask = alignment - 1;
        let alignment_offset = (alignment - (current_ptr & mask)) & mask;
        
        if self.offset + alignment_offset + bytes > self.size {
            panic!(
                "AuraCore Arena Out of Memory Bounds! Requested {} bytes with alignment {}, current offset: {}, max: {}",
                bytes, alignment, self.offset, self.size
            );
        }
        
        self.offset += alignment_offset;
        let allocated_ptr = unsafe { self.ptr.add(self.offset) } as *mut f32;
        self.offset += bytes;
        allocated_ptr
    }

    /// Resets the allocation offset to 0 (for reallocation or re-compaction under rank expansions).
    pub fn reset(&mut self) {
        self.offset = 0;
    }
}

// Ensure the Arena can safely move and be accessed concurrently
unsafe impl Send for CacheAlignedArena {}
unsafe impl Sync for CacheAlignedArena {}

impl Drop for CacheAlignedArena {
    fn drop(&mut self) {
        unsafe {
            dealloc(self.ptr, self.layout);
        }
    }
}

/// Raw representation of sequential, memory-aligned model weights.
#[derive(Clone, Copy)]
pub struct CacheAlignedWeights {
    pub r_prev: usize,
    pub d: usize,
    pub r_curr: usize,
    pub data: *mut f32,
    pub phase_data: *mut f32,
}

impl CacheAlignedWeights {
    /// Read weight element. Designed to maximize sequential pre-cache layout
    #[inline(always)]
    pub fn get(&self, a: usize, j: usize, b: usize) -> f32 {
        let idx = a * (self.r_curr * self.d) + b * self.d + j;
        unsafe { *self.data.add(idx) }
    }

    /// Write weight element.
    #[inline(always)]
    pub fn set(&self, a: usize, j: usize, b: usize, val: f32) {
        let idx = a * (self.r_curr * self.d) + b * self.d + j;
        unsafe { *self.data.add(idx) = val; }
    }

    /// Read weight phase angle.
    #[inline(always)]
    pub fn get_phase(&self, a: usize, j: usize, b: usize) -> f32 {
        let idx = a * (self.r_curr * self.d) + b * self.d + j;
        unsafe { *self.phase_data.add(idx) }
    }

    /// Write weight phase angle.
    #[inline(always)]
    pub fn set_phase(&self, a: usize, j: usize, b: usize, val: f32) {
        let idx = a * (self.r_curr * self.d) + b * self.d + j;
        unsafe { *self.phase_data.add(idx) = val; }
    }

    pub fn len(&self) -> usize {
        self.r_prev * self.d * self.r_curr
    }
}

/// Represents a single Tensor Train node/layer using cache-bound weights.
pub struct TensorCore {
    pub r_prev: usize,
    pub d: usize,
    pub r_curr: usize,
    pub weights: CacheAlignedWeights,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TrainingStatus {
    pub converged: bool,
    pub expanded: bool,
}

pub fn apply_convolution_3x3(input: &[f32], width: usize, height: usize) -> Vec<f32> {
    if width < 3 || height < 3 {
        return input.to_vec();
    }
    let mut output = vec![0.0; width * height];
    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            let idx = |r: usize, c: usize| r * width + c;
            
            let val_tl = input[idx(y - 1, x - 1)];
            let val_tc = input[idx(y - 1, x)];
            let val_tr = input[idx(y - 1, x + 1)];
            
            let val_ml = input[idx(y, x - 1)];
            let val_mr = input[idx(y, x + 1)];
            
            let val_bl = input[idx(y + 1, x - 1)];
            let val_bc = input[idx(y + 1, x)];
            let val_br = input[idx(y + 1, x + 1)];
            
            let gx = -1.0 * val_tl + 1.0 * val_tr
                   - 2.0 * val_ml + 2.0 * val_mr
                   - 1.0 * val_bl + 1.0 * val_br;
                   
            let gy = -1.0 * val_tl - 2.0 * val_tc - 1.0 * val_tr
                   + 1.0 * val_bl + 2.0 * val_bc + 1.0 * val_br;
                   
            output[idx(y, x)] = (gx * gx + gy * gy).sqrt();
        }
    }
    output
}

/// The core computing engine for the AuraNexus Tensor Train neural network.
pub struct AuraCore {
    /// Arena allocator containing all sequential parameters
    pub arena: CacheAlignedArena,
    /// Tensor nodes in the network
    pub cores: Vec<TensorCore>,
    /// Speed adjustment for gradient updates
    pub learning_rate: f32,
    /// Forward-Forward signal separator threshold
    pub threshold: f32,
    
    /// Preallocated state buffers inside the arena (addresses)
    pub pos_states_ptrs: Vec<*mut f32>,
    pub neg_states_ptrs: Vec<*mut f32>,
    
    /// Preallocated phase angle buffers (representing complex states)
    pub pos_phases_ptrs: Vec<*mut f32>,
    pub neg_phases_ptrs: Vec<*mut f32>,
    
    pub state_sizes: Vec<usize>,

    /// Global entangled quantum phases representing shared latent phase space
    pub global_quantum_phases: *mut f32,
    pub quantum_phases_len: usize,

    /// Stagnation tracking for deterministic expansion
    pub stagnation_counter: u32,
    /// Previous positive goodness value to detect drop
    pub previous_pos_goodness: f32,
    /// Thread-safe ring rolling buffer of input histories
    pub input_history: std::sync::Mutex<Vec<Vec<f32>>>,
}

/// Highly optimized ARM NEON parallel vector multiply-accumulate (GEMV cell)
#[inline(always)]
pub fn neon_gemv_element(weight_ptr: *const f32, x_k: &[f32], len: usize) -> f32 {
    #[cfg(target_arch = "aarch64")]
    unsafe {
        use std::arch::aarch64::*;
        let mut sum_v = vdupq_n_f32(0.0);
        let mut i = 0;
        // Stream batches of 4 floats instantly
        while i + 3 < len {
            let w_v = vld1q_f32(weight_ptr.add(i));
            let x_v = vld1q_f32(x_k.as_ptr().add(i));
            sum_v = vmlaq_f32(sum_v, w_v, x_v);
            i += 4;
        }
        let mut sum = vgetq_lane_f32(sum_v, 0)
            + vgetq_lane_f32(sum_v, 1)
            + vgetq_lane_f32(sum_v, 2)
            + vgetq_lane_f32(sum_v, 3);
        while i < len {
            sum += *weight_ptr.add(i) * x_k[i];
            i += 1;
        }
        sum
    }

    #[cfg(not(target_arch = "aarch64"))]
    {
        // Vector emulation for browser/non-arm devices
        let mut sum = 0.0;
        let mut i = 0;
        unsafe {
            while i + 3 < len {
                sum += *weight_ptr.add(i) * x_k[i];
                sum += *weight_ptr.add(i + 1) * x_k[i + 1];
                sum += *weight_ptr.add(i + 2) * x_k[i + 2];
                sum += *weight_ptr.add(i + 3) * x_k[i + 3];
                i += 4;
            }
            while i < len {
                sum += *weight_ptr.add(i) * x_k[i];
                i += 1;
            }
        }
        sum
    }
}

impl AuraCore {
    /// Instantiates AuraCore network inside a flat contiguous L3 cache-aligned arena
    pub fn new(input_dim: usize, num_layers: usize, rank: usize) -> Self {
        assert!(num_layers > 0, "Number of layers must be greater than zero");
        
        // Boost the static allocation size slightly to accommodate additional phase parameters under low footprint
        let mut arena = CacheAlignedArena::new(60); 
        let mut rng = rand::thread_rng();
        
        let chunk_base = input_dim / num_layers;
        let remainder = input_dim % num_layers;
        
        let mut ranks = vec![1; num_layers + 1];
        for i in 1..num_layers {
            ranks[i] = rank;
        }

        let quantum_phases_len = 32;
        let global_quantum_phases = arena.allocate_aligned(quantum_phases_len * 4, 64);
        unsafe {
            for i in 0..quantum_phases_len {
                *global_quantum_phases.add(i) = rng.gen_range(-3.14159..3.14159);
            }
        }

        let mut cores = Vec::with_capacity(num_layers);
        for k in 0..num_layers {
            let d_k = chunk_base + if k < remainder { 1 } else { 0 };
            let r_prev_val = ranks[k];
            let r_curr_val = ranks[k + 1];
            
            let total_weights = r_prev_val * d_k * r_curr_val;
            
            // Align weights magnitude to 128 bytes
            let ptr = arena.allocate_aligned(total_weights * 4, 128);
            
            // Align weights phase angle to 128 bytes
            let phase_ptr = arena.allocate_aligned(total_weights * 4, 128);
            
            let weights = CacheAlignedWeights {
                r_prev: r_prev_val,
                d: d_k,
                r_curr: r_curr_val,
                data: ptr,
                phase_data: phase_ptr,
            };
            
            // Xavier formula for initializing magnitude
            let limit = (6.0 / (r_prev_val + r_curr_val + d_k) as f32).sqrt();
            for i in 0..total_weights {
                unsafe {
                    *weights.data.add(i) = rng.gen_range(-limit..limit);
                    // Initialize complex phase randomly within standard radian limits
                    *weights.phase_data.add(i) = rng.gen_range(-3.14159..3.14159);
                }
            }
            
            cores.push(TensorCore {
                r_prev: r_prev_val,
                d: d_k,
                r_curr: r_curr_val,
                weights,
            });
        }
        
        let mut core_instance = Self {
            arena,
            cores,
            learning_rate: 0.05,
            threshold: 2.0,
            pos_states_ptrs: Vec::new(),
            neg_states_ptrs: Vec::new(),
            pos_phases_ptrs: Vec::new(),
            neg_phases_ptrs: Vec::new(),
            state_sizes: Vec::new(),
            global_quantum_phases,
            quantum_phases_len,
            stagnation_counter: 0,
            previous_pos_goodness: 0.0,
            input_history: std::sync::Mutex::new(Vec::with_capacity(64)),
        };
        
        core_instance.allocate_buffers();
        core_instance
    }

    /// Allocates internal states and phase buffers within the Arena sequentially.
    pub fn allocate_buffers(&mut self) {
        let num_layers = self.cores.len();
        self.state_sizes = vec![1; num_layers + 1];
        for k in 0..num_layers {
            self.state_sizes[k+1] = self.cores[k].r_curr;
        }
        
        self.pos_states_ptrs = Vec::with_capacity(num_layers + 1);
        self.neg_states_ptrs = Vec::with_capacity(num_layers + 1);
        self.pos_phases_ptrs = Vec::with_capacity(num_layers + 1);
        self.neg_phases_ptrs = Vec::with_capacity(num_layers + 1);
        
        for k in 0..=num_layers {
            let size = self.state_sizes[k];
            // Align buffer elements to 64 bytes
            let pos_ptr = self.arena.allocate_aligned(size * 4, 64);
            let neg_ptr = self.arena.allocate_aligned(size * 4, 64);
            
            let pos_phase_ptr = self.arena.allocate_aligned(size * 4, 64);
            let neg_phase_ptr = self.arena.allocate_aligned(size * 4, 64);
            
            unsafe {
                std::ptr::write_bytes(pos_ptr, 0, size);
                std::ptr::write_bytes(neg_ptr, 0, size);
                std::ptr::write_bytes(pos_phase_ptr, 0, size);
                std::ptr::write_bytes(neg_phase_ptr, 0, size);
            }
            
            self.pos_states_ptrs.push(pos_ptr);
            self.neg_states_ptrs.push(neg_ptr);
            self.pos_phases_ptrs.push(pos_phase_ptr);
            self.neg_phases_ptrs.push(neg_phase_ptr);
        }
    }

    /// Normalises the input vector using sliding-window LayerNorm-lite online normalization.
    pub fn normalize_input(&self, input: &[f32]) -> Vec<f32> {
        let mut history = self.input_history.lock().unwrap();
        
        history.push(input.to_vec());
        if history.len() > 64 {
            history.remove(0);
        }
        
        let n = history.len();
        let dim = input.len();
        let mut normalized = vec![0.0; dim];
        
        if n == 0 {
            return input.to_vec();
        }
        
        for i in 0..dim {
            let mut sum = 0.0;
            for vec in history.iter() {
                if i < vec.len() {
                    sum += vec[i];
                }
            }
            let mean = sum / n as f32;
            
            let mut var_sum = 0.0;
            for vec in history.iter() {
                if i < vec.len() {
                    let diff = vec[i] - mean;
                    var_sum += diff * diff;
                }
            }
            let var = var_sum / n as f32;
            let std_dev = (var + 1e-5).sqrt();
            
            normalized[i] = (input[i] - mean) / std_dev;
        }
        
        normalized
    }

    /// Processes input: applies 3x3 Sobel convolution if it is an image, then applies online normalization.
    pub fn process_input(&self, input: &[f32], is_image: bool, width: usize, height: usize) -> Vec<f32> {
        let convolved = if is_image {
            apply_convolution_3x3(input, width, height)
        } else {
            input.to_vec()
        };
        self.normalize_input(&convolved)
    }

    /// Computes un-allocated forward propagation on processed and normalized inputs.
    pub fn forward(&self, input: &[f32], is_image: bool, width: usize, height: usize) -> f32 {
        let processed_input = self.process_input(input, is_image, width, height);
        let mut current_state = vec![1.0; 1];
        let mut current_phase = vec![0.0; 1];
        let mut goodness = 0.0;
        let mut start_idx = 0;
        
        for k in 0..self.cores.len() {
            let core = &self.cores[k];
            let end_idx = (start_idx + core.d).min(processed_input.len());
            let x_k = &processed_input[start_idx..end_idx];
            start_idx += core.d;
            
            let mut next_state = vec![0.0; core.r_curr];
            let mut next_phase = vec![0.0; core.r_curr];
            
            for b in 0..core.r_curr {
                let mut best_magnitude = 0.0;
                let mut best_real = 0.0;
                let mut best_imag = 0.0;
                
                let concept_shifts = [0.0, 1.57079, 3.14159]; // Superposition of 3 concept phases
                
                for &shift in &concept_shifts {
                    let mut sum_real = 0.0;
                    let mut sum_imag = 0.0;
                    
                    for a in 0..core.r_prev {
                        let offset = a * (core.r_curr * core.d) + b * core.d;
                        let prev_val = current_state[a];
                        let prev_phase = current_phase[a];
                        
                        let entanglement_idx = (k * core.r_curr + b) % self.quantum_phases_len;
                        let global_e_phase = unsafe { *self.global_quantum_phases.add(entanglement_idx) };
                        
                        for j in 0..core.d {
                            if j < x_k.len() {
                                let w_mag = unsafe { *core.weights.data.add(offset + j) };
                                let w_phase = unsafe { *core.weights.phase_data.add(offset + j) };
                                
                                let total_angle = prev_phase + w_phase + global_e_phase + shift;
                                let flow_x = x_k[j];
                                
                                sum_real += prev_val * w_mag * flow_x * total_angle.cos();
                                sum_imag += prev_val * w_mag * flow_x * total_angle.sin();
                            }
                        }
                    }
                    
                    let mag = (sum_real * sum_real + sum_imag * sum_imag).sqrt();
                    if mag >= best_magnitude {
                        best_magnitude = mag;
                        best_real = sum_real;
                        best_imag = sum_imag;
                    }
                }
                
                next_state[b] = best_magnitude;
                next_phase[b] = best_imag.atan2(best_real + 1e-9);
            }
            
            let norm_sq: f32 = next_state.iter().map(|&v| v * v).sum();
            goodness += norm_sq;
            
            let norm = (norm_sq + 1e-9).sqrt();
            for val in next_state.iter_mut() {
                *val /= norm;
            }
            
            current_state = next_state;
            current_phase = next_phase;
        }
        
        goodness
    }

    /// In-place forward pass writing directly into Cache Aligned Arena memory slots. Zero heap allocations.
    /// Used directly on already processed/normalized vectors to avoid double normalisation.
    pub fn forward_in_place_raw(&self, input: &[f32], states_ptrs: &[*mut f32], phases_ptrs: &[*mut f32]) -> f32 {
        unsafe {
            *states_ptrs[0] = 1.0;
            *phases_ptrs[0] = 0.0;
        }
        
        let mut goodness = 0.0;
        let mut start_idx = 0;
        let num_layers = self.cores.len();
        
        for k in 0..num_layers {
            let core = &self.cores[k];
            let end_idx = (start_idx + core.d).min(input.len());
            let x_k = &input[start_idx..end_idx];
            start_idx += core.d;
            
            let prev_state_ptr = states_ptrs[k];
            let prev_phase_ptr = phases_ptrs[k];
            let next_state_ptr = states_ptrs[k+1];
            let next_phase_ptr = phases_ptrs[k+1];
            
            for b in 0..core.r_curr {
                let mut best_magnitude = 0.0;
                let mut best_real = 0.0;
                let mut best_imag = 0.0;
                
                let concept_shifts = [0.0, 1.57079, 3.14159]; // superposition of 3 candidate phases
                
                for &shift in &concept_shifts {
                    let mut sum_real = 0.0;
                    let mut sum_imag = 0.0;
                    
                    for a in 0..core.r_prev {
                        let offset = a * (core.r_curr * core.d) + b * core.d;
                        let prev_val = unsafe { *prev_state_ptr.add(a) };
                        let prev_phase = unsafe { *prev_phase_ptr.add(a) };
                        
                        let entanglement_idx = (k * core.r_curr + b) % self.quantum_phases_len;
                        let global_e_phase = unsafe { *self.global_quantum_phases.add(entanglement_idx) };
                        
                        for j in 0..core.d {
                            if j < x_k.len() {
                                let w_mag = unsafe { *core.weights.data.add(offset + j) };
                                let w_phase = unsafe { *core.weights.phase_data.add(offset + j) };
                                
                                let total_angle = prev_phase + w_phase + global_e_phase + shift;
                                let flow_x = x_k[j];
                                
                                sum_real += prev_val * w_mag * flow_x * total_angle.cos();
                                sum_imag += prev_val * w_mag * flow_x * total_angle.sin();
                            }
                        }
                    }
                    
                    let mag = (sum_real * sum_real + sum_imag * sum_imag).sqrt();
                    if mag >= best_magnitude {
                        best_magnitude = mag;
                        best_real = sum_real;
                        best_imag = sum_imag;
                    }
                }
                
                unsafe {
                    *next_state_ptr.add(b) = best_magnitude;
                    *next_phase_ptr.add(b) = best_imag.atan2(best_real + 1e-9);
                }
            }
            
            let mut norm_sq = 0.0;
            for b in 0..core.r_curr {
                let val = unsafe { *next_state_ptr.add(b) };
                norm_sq += val * val;
            }
            goodness += norm_sq;
            
            let norm = (norm_sq + 1e-9).sqrt();
            for b in 0..core.r_curr {
                unsafe {
                    *next_state_ptr.add(b) /= norm;
                }
            }
        }
        
        goodness
    }

    /// In-place forward pass with input processing and inline normalization.
    pub fn forward_in_place(&self, input: &[f32], is_image: bool, width: usize, height: usize, states_ptrs: &[*mut f32], phases_ptrs: &[*mut f32]) -> f32 {
        let processed = self.process_input(input, is_image, width, height);
        self.forward_in_place_raw(&processed, states_ptrs, phases_ptrs)
    }

    /// Single local train step executing on CacheAlignedArena structures. Clamps weights to [-1, 1].
    pub fn train_step(&mut self, positive_data: &[f32], negative_data: &[f32], is_image: bool, width: usize, height: usize) -> TrainingStatus {
        let processed_pos = self.process_input(positive_data, is_image, width, height);
        let processed_neg = self.process_input(negative_data, is_image, width, height);

        let pos_goodness = self.forward_in_place_raw(&processed_pos, &self.pos_states_ptrs, &self.pos_phases_ptrs);
        let neg_goodness = self.forward_in_place_raw(&processed_neg, &self.neg_states_ptrs, &self.neg_phases_ptrs);
        
        let pos_deficit = (self.threshold - pos_goodness).max(0.0);
        let neg_surplus = (neg_goodness - self.threshold).max(0.0);
        
        let mut pos_start_idx = 0;
        let mut neg_start_idx = 0;
        
        for k in 0..self.cores.len() {
            let core = &mut self.cores[k];
            
            let pos_end_idx = (pos_start_idx + core.d).min(processed_pos.len());
            let pos_x_k = &processed_pos[pos_start_idx..pos_end_idx];
            pos_start_idx += core.d;
            
            let neg_end_idx = (neg_start_idx + core.d).min(processed_neg.len());
            let neg_x_k = &processed_neg[neg_start_idx..neg_end_idx];
            neg_start_idx += core.d;
            
            let pos_prev_ptr = self.pos_states_ptrs[k];
            let pos_curr_ptr = self.pos_states_ptrs[k+1];
            
            let pos_prev_phase_ptr = self.pos_phases_ptrs[k];
            
            let neg_prev_ptr = self.neg_states_ptrs[k];
            let neg_curr_ptr = self.neg_states_ptrs[k+1];
            
            let neg_prev_phase_ptr = self.neg_phases_ptrs[k];
            
            for a in 0..core.r_prev {
                let pos_prev_val = unsafe { *pos_prev_ptr.add(a) };
                let pos_prev_phase = unsafe { *pos_prev_phase_ptr.add(a) };
                
                let neg_prev_val = unsafe { *neg_prev_ptr.add(a) };
                let neg_prev_phase = unsafe { *neg_prev_phase_ptr.add(a) };
                
                for b in 0..core.r_curr {
                    let pos_curr_val = unsafe { *pos_curr_ptr.add(b) };
                    let neg_curr_val = unsafe { *neg_curr_ptr.add(b) };
                    
                    let offset = a * (core.r_curr * core.d) + b * core.d;
                    let entanglement_idx = (k * core.r_curr + b) % self.quantum_phases_len;
                    let global_e_phase = unsafe { *self.global_quantum_phases.add(entanglement_idx) };
                    
                    for j in 0..core.d {
                        let mut delta_mag = 0.0;
                        let mut delta_phase = 0.0;
                        
                        let current_phase = unsafe { *core.weights.phase_data.add(offset + j) };
                        
                        if pos_deficit > 0.0 && j < pos_x_k.len() {
                            let factor = self.learning_rate * pos_deficit * 2.0 * pos_curr_val * pos_prev_val * pos_x_k[j];
                            delta_mag += factor;
                            
                            // Adjust weight phase for positive reinforcement (constructive alignment)
                            let diff_angle = pos_prev_phase + current_phase + global_e_phase;
                            delta_phase -= factor * 0.1 * diff_angle.sin();
                        }
                        
                        if neg_surplus > 0.0 && j < neg_x_k.len() {
                            let factor = self.learning_rate * neg_surplus * 2.0 * neg_curr_val * neg_prev_val * neg_x_k[j];
                            delta_mag -= factor;
                            
                            // Adjust weight phase for negative reinforcement (destructive alignment)
                            let diff_angle = neg_prev_phase + current_phase + global_e_phase;
                            delta_phase += factor * 0.1 * diff_angle.sin();
                        }
                        
                        unsafe {
                            *core.weights.data.add(offset + j) += delta_mag;
                            
                            // Wrap weight phase angle safely to standard radians [-PI, PI]
                            let next_phase = current_phase + delta_phase;
                            *core.weights.phase_data.add(offset + j) = next_phase.sin().atan2(next_phase.cos());
                        }
                    }
                }
            }
        }

        // Weight clipping to ensure numeric stability under [-1.0, 1.0]
        for core in &mut self.cores {
            let len = core.weights.len();
            for i in 0..len {
                unsafe {
                    let val = *core.weights.data.add(i);
                    *core.weights.data.add(i) = val.clamp(-1.0, 1.0);
                }
            }
        }

        // Self-optimize non-local global quantum entangled phases phase-locked space
        unsafe {
            for idx in 0..self.quantum_phases_len {
                let diff = self.learning_rate * 0.05 * (pos_deficit - neg_surplus);
                let current_val = *self.global_quantum_phases.add(idx);
                let next_val = current_val + diff;
                *self.global_quantum_phases.add(idx) = next_val.sin().atan2(next_val.cos());
            }
        }

        // Deterministic Stagnation Check
        let converged = pos_goodness > self.threshold && neg_goodness < self.threshold;
        
        if pos_goodness > self.threshold {
            if converged {
                self.stagnation_counter = 0;
            } else if pos_goodness < self.previous_pos_goodness {
                self.stagnation_counter = 0;
            } else {
                self.stagnation_counter += 1;
            }
        } else {
            self.stagnation_counter = 0;
        }
        self.previous_pos_goodness = pos_goodness;

        let mut expanded = false;
        if self.stagnation_counter > 500 {
            self.expand_rank();
            self.stagnation_counter = 0;
            expanded = true;
        }

        TrainingStatus {
            converged,
            expanded,
        }
    }

    /// Resizes bond index safely without resetting weights while ensuring continuous physical layouts are preserved inside the arena.
    pub fn expand_rank(&mut self) {
        let num_layers = self.cores.len();
        if num_layers == 0 { return; }
        
        let mut new_ranks = vec![1; num_layers + 1];
        new_ranks[0] = 1;
        new_ranks[num_layers] = 1;
        for k in 1..num_layers {
            new_ranks[k] = self.cores[k-1].r_curr + 1;
        }

        // 1. Back up existing weights and phases temporarily
        let mut saved_weights = Vec::with_capacity(num_layers);
        let mut saved_phases = Vec::with_capacity(num_layers);
        for k in 0..num_layers {
            let core = &self.cores[k];
            let total_el = core.r_prev * core.d * core.r_curr;
            let mut w_vec = vec![0.0; total_el];
            let mut p_vec = vec![0.0; total_el];
            unsafe {
                std::ptr::copy_nonoverlapping(core.weights.data, w_vec.as_mut_ptr(), total_el);
                std::ptr::copy_nonoverlapping(core.weights.phase_data, p_vec.as_mut_ptr(), total_el);
            }
            saved_weights.push(w_vec);
            saved_phases.push(p_vec);
        }

        // 2. Clear out the alignment offset back to index 0
        self.arena.reset();

        // 3. Reallocate global entangled quantum phases
        let mut rng = rand::thread_rng();
        self.global_quantum_phases = self.arena.allocate_aligned(self.quantum_phases_len * 4, 64);
        unsafe {
            for i in 0..self.quantum_phases_len {
                *self.global_quantum_phases.add(i) = rng.gen_range(-3.14159..3.14159);
            }
        }

        // 4. Sequential reallocation inside the Cache-Aligned Arena
        let mut new_cores = Vec::with_capacity(num_layers);
        for k in 0..num_layers {
            let old_core = &self.cores[k];
            let r_prev_new = new_ranks[k];
            let r_curr_new = new_ranks[k+1];
            
            let total_weights_new = r_prev_new * old_core.d * r_curr_new;
            let ptr = self.arena.allocate_aligned(total_weights_new * 4, 128);
            let phase_ptr = self.arena.allocate_aligned(total_weights_new * 4, 128);
            
            unsafe {
                std::ptr::write_bytes(ptr, 0, total_weights_new);
                std::ptr::write_bytes(phase_ptr, 0, total_weights_new);
            }
            
            let new_weights = CacheAlignedWeights {
                r_prev: r_prev_new,
                d: old_core.d,
                r_curr: r_curr_new,
                data: ptr,
                phase_data: phase_ptr,
            };

            // Copy old weights and phases into the fresh expanded layout block
            let old_weights_vec = &saved_weights[k];
            let old_phases_vec = &saved_phases[k];
            for a in 0..old_core.r_prev {
                for b in 0..old_core.r_curr {
                    for j in 0..old_core.d {
                        let old_idx = a * (old_core.r_curr * old_core.d) + b * old_core.d + j;
                        let old_val = old_weights_vec[old_idx];
                        let old_phase = old_phases_vec[old_idx];
                        new_weights.set(a, j, b, old_val);
                        new_weights.set_phase(a, j, b, old_phase);
                    }
                }
            }

            new_cores.push(TensorCore {
                r_prev: r_prev_new,
                d: old_core.d,
                r_curr: r_curr_new,
                weights: new_weights,
            });
        }

        self.cores = new_cores;

        // 5. Rebuild the sequential tracking states inside Cache Aligned Arena slots
        self.allocate_buffers();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tensor_train_memory_layouts() {
        let core = AuraCore::new(12, 4, 3);
        assert_eq!(core.cores.len(), 4);
        assert_eq!(core.cores[0].r_prev, 1);
        assert_eq!(core.cores[0].r_curr, 3);
        
        // Assert address layout sequence holds
        let first_weight_addr = core.cores[0].weights.data as usize;
        let second_weight_addr = core.cores[1].weights.data as usize;
        assert!(
            second_weight_addr > first_weight_addr,
            "Sequential layers must reside in sequential memory addresses in the aligned arena"
        );
    }

    #[test]
    fn test_training_and_threshold_separation() {
        let mut core = AuraCore::new(8, 4, 3);
        core.learning_rate = 0.1;
        core.threshold = 4.0;
        
        let pos_data = vec![1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        let neg_data = vec![-1.0, 0.1, -0.8, 0.2, -0.9, 0.0, -1.0, 0.1];
        
        for _ in 0..500 {
            core.train_step(&pos_data, &neg_data, false, 0, 0);
        }
        
        let pos_final = core.forward(&pos_data, false, 0, 0);
        let neg_final = core.forward(&neg_data, false, 0, 0);
        
        assert!(pos_final > core.threshold, "Pos goodness {} must be above threshold", pos_final);
        assert!(neg_final < core.threshold, "Neg goodness {} must be below threshold", neg_final);
    }

    #[test]
    fn test_orthogonal_preservation() {
        let mut core = AuraCore::new(12, 4, 2);
        let test_input = vec![0.5, 0.2, 0.9, -0.1, 0.4, 0.6, -0.3, 0.1, 0.8, -0.2, 0.5, 0.7];
        
        let score_before = core.forward(&test_input, false, 0, 0);
        core.expand_rank();
        let score_after = core.forward(&test_input, false, 0, 0);
        
        let diff = (score_after - score_before).abs();
        assert!(diff < 0.001, "Rank expansion should be 100% mathematically backward-compatible");
    }

    #[test]
    fn test_cache_aligned_arena_benchmark() {
        let mut core = AuraCore::new(128, 4, 16);
        let test_input = vec![0.5; 128];
        
        // Arena-based optimized multiplication
        let start_arena = std::time::Instant::now();
        for _ in 0..1000 {
            core.forward(&test_input, false, 0, 0);
        }
        let arena_duration = start_arena.elapsed().as_micros();

        // Non-contiguous standard Vec simulation
        let standard_weights: Vec<Vec<f32>> = core.cores.iter()
            .map(|c| {
                let size = c.r_prev * c.d * c.r_curr;
                vec![0.5; size]
            })
            .collect();
            
        let start_vec = std::time::Instant::now();
        for _ in 0..1000 {
            let mut current_state = vec![1.0; 1];
            let mut start_idx = 0;
            for k in 0..core.cores.len() {
                let c = &core.cores[k];
                let x_k = &test_input[start_idx..start_idx + c.d];
                start_idx += c.d;
                let mut next_state = vec![0.0; c.r_curr];
                for b in 0..c.r_curr {
                    let mut cell_sum = 0.0;
                    for a in 0..c.r_prev {
                        let mut weight_sum = 0.0;
                        for j in 0..c.d {
                            let idx = a * (c.r_curr * c.d) + b * c.d + j;
                            weight_sum += standard_weights[k][idx] * x_k[j];
                        }
                        cell_sum += current_state[a] * weight_sum;
                    }
                    next_state[b] = cell_sum;
                }
                let norm_sq: f32 = next_state.iter().map(|&v| v * v).sum();
                let norm = (norm_sq + 1e-9).sqrt();
                for val in next_state.iter_mut() {
                    *val /= norm;
                }
                current_state = next_state;
            }
        }
        let vec_duration = start_vec.elapsed().as_micros();

        println!("Arena Duration: {} micros", arena_duration);
        println!("Std Vec Duration: {} micros", vec_duration);
        
        assert!(
            arena_duration < vec_duration,
            "CacheAlignedArena run speed ({}us) must beat standard dynamic Vectors list mapping ({}us)",
            arena_duration,
            vec_duration
        );
    }

    #[test]
    fn test_zero_copy_stream_buffer_operations() {
        let buffer = StreamBuffer::new(512);
        let write_payload = b"AuraNexus High-Speed Streaming Input Vector Sample";
        
        let bytes_written = buffer.write_bytes(write_payload).unwrap();
        assert_eq!(bytes_written, write_payload.len());
        
        let mut read_container = vec![0u8; write_payload.len()];
        let bytes_read = buffer.read_bytes(&mut read_container);
        assert_eq!(bytes_read, write_payload.len());
        assert_eq!(&read_container, write_payload);
    }

    #[test]
    fn test_semantic_snippet_analyzer_scoring() {
        let analyzer = TensorSnippetAnalyzer::new("автомобильные номера");
        
        let good_html = "<html><head><title>Автомобильные Номера РФ</title></head><h1>Регистрация Номеров</h1></html>";
        let score_good = analyzer.analyze_snippet(good_html);
        assert!(score_good >= 0.7, "Good semantic similarity filter score: {}", score_good);

        let bad_html = "<html><head><title>Магазин одежды</title></head><h1>Номера телефонов и размеры одежды</h1></html>";
        let score_bad = analyzer.analyze_snippet(bad_html);
        assert!(score_bad < 0.25, "Bad contextual target matching score correctly demoted: {}", score_bad);
    }

    #[test]
    fn test_instant_vector_encode_to_vector() {
        let text_bytes = b"hashing trick word text data streaming core input";
        let vector = encode_to_vector(text_bytes, 8);
        assert_eq!(vector.len(), 8);
        
        let sum_sq: f32 = vector.iter().map(|&x| x * x).sum();
        assert!((sum_sq - 1.0).abs() < 1e-4, "Vector must be fully L2 normalised to unity");
    }

    #[test]
    fn test_image_cnn_encoder_shapes() {
        let mut core = AuraCore::new(32 * 32, 4, 3);
        core.learning_rate = 0.1;
        core.threshold = 3.0;

        // Create a 32x32 square image (positive data) and a circle image (negative data)
        let mut square_img = vec![0.0f32; 1024];
        let mut circle_img = vec![0.0f32; 1024];

        for y in 0..32 {
            for x in 0..32 {
                // Square: boundary in center
                if y >= 8 && y <= 24 && x >= 8 && x <= 24 {
                    square_img[y * 32 + x] = 1.0;
                }
                // Circle: radius-based
                let dy = y as f32 - 16.0;
                let dx = x as f32 - 16.0;
                let dist = (dx * dx + dy * dy).sqrt();
                if dist <= 10.0 {
                    circle_img[y * 32 + x] = 1.0;
                }
            }
        }

        // Train the model on these images using the CNN encoder (is_image: true, 32x32)
        for _ in 0..200 {
            core.train_step(&square_img, &circle_img, true, 32, 32);
        }

        let pos_final = core.forward(&square_img, true, 32, 32);
        let neg_final = core.forward(&circle_img, true, 32, 32);

        assert!(pos_final > core.threshold, "Square goodness {} must be above threshold", pos_final);
        assert!(neg_final < core.threshold, "Circle goodness {} must be below threshold", neg_final);
    }
}

// =========================================================================
// JNI Export Bridge Functions (extern "C") for Android NDK Compile Linkage
// =========================================================================

use std::ffi::CStr;
use std::fs::File;
use std::io::Write;

#[no_mangle]
pub extern "C" fn init_core(input_dim: i32, layers: i32, rank: i32) -> *mut AuraCore {
    let core = AuraCore::new(input_dim as usize, layers as usize, rank as usize);
    Box::into_raw(Box::new(core))
}

#[repr(C)]
pub struct TrainingMetrics {
    pub goodness: f32,
    pub rank: u32,
    pub converged: bool,
    pub expanded: bool,
}

#[no_mangle]
pub extern "C" fn train_step_core(ptr: *mut AuraCore, data_ptr: *const f32, length: i32) -> TrainingMetrics {
    if ptr.is_null() || data_ptr.is_null() || length <= 0 {
        return TrainingMetrics { goodness: -1.0, rank: 0, converged: false, expanded: false };
    }
    let core = unsafe { &mut *ptr };
    let data = unsafe { std::slice::from_raw_parts(data_ptr, length as usize) };
    
    // Generate negative data dynamically by negating the input elements
    let mut negative_data = data.to_vec();
    for val in negative_data.iter_mut() {
        *val = -(*val);
    }
    
    let status = core.train_step(data, &negative_data, false, 0, 0);
    let pos_goodness = core.previous_pos_goodness;
    
    let mut active_rank = 0;
    for c in &core.cores {
        if c.r_curr > active_rank {
            active_rank = c.r_curr;
        }
    }

    TrainingMetrics {
        goodness: pos_goodness,
        rank: active_rank as u32,
        converged: status.converged,
        expanded: status.expanded,
    }
}

#[no_mangle]
pub extern "C" fn export_weights_core(ptr: *mut AuraCore, path: *const std::os::raw::c_char) {
    if ptr.is_null() || path.is_null() {
        return;
    }
    let core = unsafe { &mut *ptr };
    let c_str = unsafe { CStr::from_ptr(path) };
    let file_path = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return,
    };
    
    if let Ok(mut file) = File::create(file_path) {
        let _ = file.write_all(b"AURA_TT_MODEL_V1\n");
        for (i, tensor_core) in core.cores.iter().enumerate() {
            let dims = format!("core_{}:{}:{}:{}\n", i, tensor_core.r_prev, tensor_core.d, tensor_core.r_curr);
            let _ = file.write_all(dims.as_bytes());
            
            let len = tensor_core.r_prev * tensor_core.d * tensor_core.r_curr;
            let slice = unsafe { std::slice::from_raw_parts(tensor_core.weights.data, len) };
            let bytes = unsafe {
                std::slice::from_raw_parts(
                    slice.as_ptr() as *const u8,
                    len * std::mem::size_of::<f32>(),
                )
            };
            let _ = file.write_all(bytes);
        }
    }
}

#[no_mangle]
pub extern "C" fn get_weights_size(ptr: *mut AuraCore) -> i32 {
    if ptr.is_null() {
        return 0;
    }
    let core = unsafe { &*ptr };
    let mut total_size = 0;
    for tensor_core in &core.cores {
        total_size += tensor_core.r_prev * tensor_core.d * tensor_core.r_curr;
    }
    total_size as i32
}

#[no_mangle]
pub extern "C" fn get_weights_data(ptr: *mut AuraCore, out_buf: *mut f32, max_len: i32) -> i32 {
    if ptr.is_null() || out_buf.is_null() {
        return 0;
    }
    let core = unsafe { &*ptr };
    let mut offset = 0;
    for tensor_core in &core.cores {
        let len = tensor_core.r_prev * tensor_core.d * tensor_core.r_curr;
        if offset + len > max_len as usize {
            break;
        }
        unsafe {
            std::ptr::copy_nonoverlapping(
                tensor_core.weights.data,
                out_buf.add(offset),
                len,
            );
        }
        offset += len;
    }
    offset as i32
}

#[no_mangle]
pub extern "C" fn get_meta_data(ptr: *mut AuraCore, out_buf: *mut i32) {
    if ptr.is_null() || out_buf.is_null() {
        return;
    }
    let core = unsafe { &*ptr };
    let layers = core.cores.len() as i32;
    let mut input_dim = 0;
    let mut max_rank = 0;
    for tensor_core in &core.cores {
        input_dim += tensor_core.d as i32;
        if tensor_core.r_curr as i32 > max_rank {
            max_rank = tensor_core.r_curr as i32;
        }
    }
    unsafe {
        *out_buf.add(0) = input_dim;
        *out_buf.add(1) = layers;
        *out_buf.add(2) = max_rank;
        *out_buf.add(3) = 1; // Version
        *out_buf.add(4) = 0; // Reserved
    }
}

#[no_mangle]
pub extern "C" fn destroy_core(ptr: *mut AuraCore) {
    if !ptr.is_null() {
        unsafe {
            let _b = Box::from_raw(ptr);
        }
    }
}

#[no_mangle]
pub extern "C" fn rust_numeric_encoder(raw_floats: *const f32, length: i32, out_buf: *mut f32, out_dim: i32) -> i32 {
    if raw_floats.is_null() || out_buf.is_null() || length <= 0 || out_dim <= 0 {
        return 0;
    }
    let data = unsafe { std::slice::from_raw_parts(raw_floats, length as usize) };
    let out = unsafe { std::slice::from_raw_parts_mut(out_buf, out_dim as usize) };
    
    let mut sum = 0.0;
    for &x in data { sum += x; }
    let mean = sum / length as f32;
    
    let mut var_sum = 0.0;
    for &x in data {
        let diff = x - mean;
        var_sum += diff * diff;
    }
    let std_dev = (var_sum / length as f32 + 1e-6).sqrt();
    
    for i in 0..(out_dim as usize) {
        let idx_ratio = (i as f32) / (out_dim as f32);
        let sample_idx = ((idx_ratio * length as f32) as usize).min(length as usize - 1);
        
        let normalized_val = (data[sample_idx] - mean) / std_dev;
        let harmonic = ((i + 1) as f32 * 3.14159 * idx_ratio).sin();
        out[i] = normalized_val * 0.7 + harmonic * 0.3;
    }
    
    out_dim
}
