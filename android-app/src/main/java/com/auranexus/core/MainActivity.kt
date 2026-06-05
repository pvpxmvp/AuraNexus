package com.auranexus.core

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import android.widget.Button
import android.widget.LinearLayout
import android.view.Gravity
import android.view.View
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.Log

class MainActivity : Activity() {
    private var aura: AuraNative? = null
    private var trainStepCount = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#121214"))
            setPadding(50, 50, 50, 50)
        }

        val titleView = TextView(this).apply {
            text = "AuraNexus Core"
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 20
            }
        }
        layout.addView(titleView)

        val statusView = TextView(this).apply {
            text = "Initializing AuraNexus Core..."
            textSize = 16f
            setTextColor(Color.parseColor("#A0A0A5"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 30
            }
        }
        layout.addView(statusView)

        val resultsView = TextView(this).apply {
            text = "Click below to test live training iterations."
            textSize = 14f
            setTextColor(Color.parseColor("#71717A"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 20
                bottomMargin = 40
            }
        }
        layout.addView(resultsView)

        // Initialize Native Core
        try {
            // Instantiate AuraNative loader with 8 input dimensions, 3 layers, and rank of 4
            aura = AuraNative(8, 3, 4)
            val initialInput = FloatArray(8) { it.toFloat() * 0.5f }
            val status = aura!!.trainStep(initialInput)
            trainStepCount++
            
            val nativePtrHex = java.lang.Long.toHexString(aura.hashCode().toLong())
            statusView.text = "AuraNexus Native loaded successfully!\nInitial train step status: $status\nCore Pointer: 0x$nativePtrHex"
            statusView.setTextColor(Color.parseColor("#4AF626"))
        } catch (e: Exception) {
            Log.e("AuraNexus", "Failed to run NDK library checks: ${e.message}", e)
            statusView.text = "Error loading NDK Library:\n${e.message}"
            statusView.setTextColor(Color.parseColor("#FF5555"))
            resultsView.text = "Unable to execute training due to model initialization error."
        }

        val customButtonBg = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 20f
            setColor(Color.parseColor("#1F1F23"))
            setStroke(2, Color.parseColor("#3F3F46"))
        }

        val testButton = Button(this).apply {
            text = "Run Test Train Step"
            setTextColor(Color.WHITE)
            textSize = 16f
            background = customButtonBg
            setPadding(40, 20, 40, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setOnClickListener {
                val currentAura = aura
                if (currentAura != null) {
                    try {
                        // Generate dynamic input data based on step count
                        val inputData = FloatArray(8) { index ->
                            (index + 1) * 0.125f * (trainStepCount + 1)
                        }
                        val status = currentAura.trainStep(inputData)
                        trainStepCount++

                        val inputStr = inputData.joinToString(", ") { String.format("%.3f", it) }
                        resultsView.text = "Train Step #$trainStepCount\n" +
                                "Input: [$inputStr]\n" +
                                "Resulting Status: $status (Converged/Expanded)"
                        resultsView.setTextColor(Color.parseColor("#60A5FA"))
                    } catch (e: Exception) {
                        Log.e("AuraNexus", "Training step execution error", e)
                        resultsView.text = "Training Step Failed:\n${e.message}"
                        resultsView.setTextColor(Color.parseColor("#EF4444"))
                    }
                } else {
                    resultsView.text = "Cannot execute: Native core not initialized or has crashed."
                    resultsView.setTextColor(Color.parseColor("#EF4444"))
                }
            }
        }
        layout.addView(testButton)

        setContentView(layout)
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            aura?.close()
        } catch (e: Exception) {
            Log.e("AuraNexus", "Error closing native instance during destroy", e)
        }
    }
}

