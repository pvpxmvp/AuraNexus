package com.auranexus.core

/**
 * Encapsulated training telemetry returned directly from native Rust constraints.
 */
data class TrainingMetrics(
    val goodness: Float,
    val rank: Int,
    val converged: Boolean,
    val expanded: Boolean
)
