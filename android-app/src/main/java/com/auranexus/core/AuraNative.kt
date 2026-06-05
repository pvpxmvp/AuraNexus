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

    var nativePtr: Long = 0

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
    fun trainStep(data: FloatArray): TrainingMetrics {
        checkValidity()
        return trainStep(nativePtr, data) ?: throw JNIException("JNI execution error during trainStep: returned null metrics")
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
    private external fun trainStep(ptr: Long, data: FloatArray): TrainingMetrics
    private external fun exportModel(ptr: Long, path: String)
    private external fun destroy(ptr: Long)

    companion object {
        @JvmStatic
        external fun getWeights(ptr: Long): FloatArray

        @JvmStatic
        external fun getMeta(ptr: Long): IntArray
    }
}
