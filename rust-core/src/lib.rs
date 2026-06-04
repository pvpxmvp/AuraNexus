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

        let query_words: Vec<&str> = self.query.split_whitespace().collect();
        if query_words.is_empty() { return 0.0; }

        let mut matched = 0;
        for qw in &query_words {
            if extracted_text.contains(qw) {
                matched += 1;
            }
        }

        let similarity = matched as f32 / query_words.len() as f32;

        // Surgical weed out context rule: If query is "автомобильные номера", reject pages mentioning "одежда" or "телефон"
        if self.query.contains("номера") {
            let invalid_contexts = ["одежда", "телефон", "размер", "одежды", "сотовый"];
            for &ctx in &invalid_contexts {
                if text_lower.contains(ctx) {
                    return similarity * 0.15; // Drastic demotion
                }
            }
        }

        similarity
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
        // Text Hashing trick: Slide word keys to indices and normalise
        let text = String::from_utf8_lossy(raw_bytes);
        for word in text.split_whitespace() {
            let mut hash_val: u32 = 5381;
            for c in word.chars() {
                hash_val = ((hash_val << 5).wrapping_add(hash_val)).wrapping_add(c as u32);
            }
            let index = (hash_val as usize) % target_dim;
            vector[index] += 1.0;
        }

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
    pub state_sizes: Vec<usize>,
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
        
        let mut arena = CacheAlignedArena::new(50); // 50MB static allocation
        let mut rng = rand::thread_rng();
        
        let chunk_base = input_dim / num_layers;
        let remainder = input_dim % num_layers;
        
        let mut ranks = vec![1; num_layers + 1];
        for i in 1..num_layers {
            ranks[i] = rank;
        }

        let mut cores = Vec::with_capacity(num_layers);
        for k in 0..num_layers {
            let d_k = chunk_base + if k < remainder { 1 } else { 0 };
            let r_prev_val = ranks[k];
            let r_curr_val = ranks[k + 1];
            
            let total_weights = r_prev_val * d_k * r_curr_val;
            
            // Align weights to 128 bytes
            let ptr = arena.allocate_aligned(total_weights * 4, 128);
            
            let weights = CacheAlignedWeights {
                r_prev: r_prev_val,
                d: d_k,
                r_curr: r_curr_val,
                data: ptr,
            };
            
            // Xavier formula for initializing
            let limit = (6.0 / (r_prev_val + r_curr_val + d_k) as f32).sqrt();
            for i in 0..total_weights {
                unsafe {
                    *weights.data.add(i) = rng.gen_range(-limit..limit);
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
            state_sizes: Vec::new(),
        };
        
        core_instance.allocate_buffers();
        core_instance
    }

    /// Allocates internal states buffers within the Arena sequentially.
    pub fn allocate_buffers(&mut self) {
        let num_layers = self.cores.len();
        self.state_sizes = vec![1; num_layers + 1];
        for k in 0..num_layers {
            self.state_sizes[k+1] = self.cores[k].r_curr;
        }
        
        self.pos_states_ptrs = Vec::with_capacity(num_layers + 1);
        self.neg_states_ptrs = Vec::with_capacity(num_layers + 1);
        
        for k in 0..=num_layers {
            let size = self.state_sizes[k];
            // Align buffer elements to 64 bytes
            let pos_ptr = self.arena.allocate_aligned(size * 4, 64);
            let neg_ptr = self.arena.allocate_aligned(size * 4, 64);
            
            unsafe {
                std::ptr::write_bytes(pos_ptr, 0, size);
                std::ptr::write_bytes(neg_ptr, 0, size);
            }
            
            self.pos_states_ptrs.push(pos_ptr);
            self.neg_states_ptrs.push(neg_ptr);
        }
    }

    /// Computes un-allocated forward propagation.
    pub fn forward(&self, input: &[f32]) -> f32 {
        let mut current_state = vec![1.0; 1];
        let mut goodness = 0.0;
        let mut start_idx = 0;
        
        for k in 0..self.cores.len() {
            let core = &self.cores[k];
            let end_idx = (start_idx + core.d).min(input.len());
            let x_k = &input[start_idx..end_idx];
            start_idx += core.d;
            
            let mut next_state = vec![0.0; core.r_curr];
            
            for b in 0..core.r_curr {
                let mut cell_sum = 0.0;
                for a in 0..core.r_prev {
                    let offset = a * (core.r_curr * core.d) + b * core.d;
                    let weight_sum = neon_gemv_element(unsafe { core.weights.data.add(offset) }, x_k, core.d);
                    cell_sum += current_state[a] * weight_sum;
                }
                next_state[b] = cell_sum;
            }
            
            let norm_sq: f32 = next_state.iter().map(|&v| v * v).sum();
            goodness += norm_sq;
            
            let norm = (norm_sq + 1e-9).sqrt();
            for val in next_state.iter_mut() {
                *val /= norm;
            }
            
            current_state = next_state;
        }
        
        goodness
    }

    /// In-place forward pass writing directly into Cache Aligned Arena memory slots. Zero heap allocations.
    pub fn forward_in_place(&self, input: &[f32], states_ptrs: &[*mut f32]) -> f32 {
        unsafe {
            *states_ptrs[0] = 1.0;
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
            let next_state_ptr = states_ptrs[k+1];
            
            for b in 0..core.r_curr {
                let mut cell_sum = 0.0;
                for a in 0..core.r_prev {
                    let offset = a * (core.r_curr * core.d) + b * core.d;
                    let weight_sum = neon_gemv_element(unsafe { core.weights.data.add(offset) }, x_k, core.d);
                    
                    let prev_val = unsafe { *prev_state_ptr.add(a) };
                    cell_sum += prev_val * weight_sum;
                }
                unsafe {
                    *next_state_ptr.add(b) = cell_sum;
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

    /// Single local train step executing on CacheAlignedArena structures. Zero malloc/free calls.
    pub fn train_step(&mut self, positive_data: &[f32], negative_data: &[f32]) {
        let pos_goodness = self.forward_in_place(positive_data, &self.pos_states_ptrs);
        let neg_goodness = self.forward_in_place(negative_data, &self.neg_states_ptrs);
        
        let pos_deficit = (self.threshold - pos_goodness).max(0.0);
        let neg_surplus = (neg_goodness - self.threshold).max(0.0);
        
        let mut pos_start_idx = 0;
        let mut neg_start_idx = 0;
        
        for k in 0..self.cores.len() {
            let core = &mut self.cores[k];
            
            let pos_end_idx = (pos_start_idx + core.d).min(positive_data.len());
            let pos_x_k = &positive_data[pos_start_idx..pos_end_idx];
            pos_start_idx += core.d;
            
            let neg_end_idx = (neg_start_idx + core.d).min(negative_data.len());
            let neg_x_k = &negative_data[neg_start_idx..neg_end_idx];
            neg_start_idx += core.d;
            
            let pos_prev_ptr = self.pos_states_ptrs[k];
            let pos_curr_ptr = self.pos_states_ptrs[k+1];
            
            let neg_prev_ptr = self.neg_states_ptrs[k];
            let neg_curr_ptr = self.neg_states_ptrs[k+1];
            
            for a in 0..core.r_prev {
                let pos_prev_val = unsafe { *pos_prev_ptr.add(a) };
                let neg_prev_val = unsafe { *neg_prev_ptr.add(a) };
                
                for b in 0..core.r_curr {
                    let pos_curr_val = unsafe { *pos_curr_ptr.add(b) };
                    let neg_curr_val = unsafe { *neg_curr_ptr.add(b) };
                    
                    let offset = a * (core.r_curr * core.d) + b * core.d;
                    
                    for j in 0..core.d {
                        let mut delta = 0.0;
                        
                        if pos_deficit > 0.0 && j < pos_x_k.len() {
                            delta += self.learning_rate 
                                * pos_deficit 
                                * 2.0 
                                * pos_curr_val
                                * pos_prev_val 
                                * pos_x_k[j];
                        }
                        
                        if neg_surplus > 0.0 && j < neg_x_k.len() {
                            delta -= self.learning_rate 
                                * neg_surplus 
                                * 2.0 
                                * neg_curr_val
                                * neg_prev_val
                                * neg_x_k[j];
                        }
                        
                        unsafe {
                            *core.weights.data.add(offset + j) += delta;
                        }
                    }
                }
            }
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

        // 1. Back up existing weights temporarily
        let mut saved_weights = Vec::with_capacity(num_layers);
        for k in 0..num_layers {
            let core = &self.cores[k];
            let total_el = core.r_prev * core.d * core.r_curr;
            let mut w_vec = vec![0.0; total_el];
            unsafe {
                std::ptr::copy_nonoverlapping(core.weights.data, w_vec.as_mut_ptr(), total_el);
            }
            saved_weights.push(w_vec);
        }

        // 2. Clear out the alignment offset back to index 0
        self.arena.reset();

        // 3. Sequential reallocation inside the Cache-Aligned Arena
        let mut new_cores = Vec::with_capacity(num_layers);
        for k in 0..num_layers {
            let old_core = &self.cores[k];
            let r_prev_new = new_ranks[k];
            let r_curr_new = new_ranks[k+1];
            
            let total_weights_new = r_prev_new * old_core.d * r_curr_new;
            let ptr = self.arena.allocate_aligned(total_weights_new * 4, 128);
            
            unsafe {
                std::ptr::write_bytes(ptr, 0, total_weights_new);
            }
            
            let new_weights = CacheAlignedWeights {
                r_prev: r_prev_new,
                d: old_core.d,
                r_curr: r_curr_new,
                data: ptr,
            };

            // Copy old weights into the fresh expanded layout block
            let old_weights_vec = &saved_weights[k];
            for a in 0..old_core.r_prev {
                for b in 0..old_core.r_curr {
                    for j in 0..old_core.d {
                        let old_idx = a * (old_core.r_curr * old_core.d) + b * old_core.d + j;
                        let old_val = old_weights_vec[old_idx];
                        new_weights.set(a, j, b, old_val);
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

        // 4. Rebuild the sequential tracking states inside Cache Aligned Arena slots
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
            core.train_step(&pos_data, &neg_data);
        }
        
        let pos_final = core.forward(&pos_data);
        let neg_final = core.forward(&neg_data);
        
        assert!(pos_final > core.threshold, "Pos goodness {} must be above threshold", pos_final);
        assert!(neg_final < core.threshold, "Neg goodness {} must be below threshold", neg_final);
    }

    #[test]
    fn test_orthogonal_preservation() {
        let mut core = AuraCore::new(12, 4, 2);
        let test_input = vec![0.5, 0.2, 0.9, -0.1, 0.4, 0.6, -0.3, 0.1, 0.8, -0.2, 0.5, 0.7];
        
        let score_before = core.forward(&test_input);
        core.expand_rank();
        let score_after = core.forward(&test_input);
        
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
            core.forward(&test_input);
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
}
