package com.auranexus.core

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import android.widget.LinearLayout
import android.view.Gravity
import android.graphics.Color
import android.util.Log
import java.io.File

class MainActivity : Activity() {
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
        }
        layout.addView(statusView)

        setContentView(layout)

        try {
            // Instantiate AuraNative loader with 8 input dimensions, 3 layers, and rank of 4
            val aura = AuraNative(8, 3, 4)
            val inputData = FloatArray(8) { it.toFloat() * 0.5f }
            val status = aura.trainStep(inputData)
            
            statusView.text = "AuraNexus Native loaded successfully!\nTrain step status result: $status\nCore Pointer: 0x${java.lang.Long.toHexString(aura.hashCode().toLong())}"
            statusView.setTextColor(Color.parseColor("#4AF626"))
        } catch (e: Exception) {
            Log.e("AuraNexus", "Failed to run NDK library checks: ${e.message}", e)
            statusView.text = "Error loading NDK Library:\n${e.message}"
            statusView.setTextColor(Color.parseColor("#FF5555"))
        }
    }
}
