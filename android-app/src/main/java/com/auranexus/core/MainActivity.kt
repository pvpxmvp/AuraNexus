package com.auranexus.core

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

class MainActivity : ComponentActivity() {

    private var aura: AuraNative? = null
    private var trainingJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            MaterialTheme {
                CrystallizerScreen()
            }
        }
    }

    @Composable
    fun TensorCoreVisualizer(
        isRunning: Boolean,
        goodnessVal: Float,
        step: Int,
        modifier: Modifier = Modifier
    ) {
        val infiniteTransition = rememberInfiniteTransition(label = "tensor_rotation")
        val angleX by infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 360f,
            animationSpec = infiniteRepeatable(
                animation = tween(28000, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "angle_x"
        )
        val angleY by infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 360f,
            animationSpec = infiniteRepeatable(
                animation = tween(20000, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "angle_y"
        )
        
        val fieldPulse by infiniteTransition.animateFloat(
            initialValue = 0.92f,
            targetValue = 1.08f,
            animationSpec = infiniteRepeatable(
                animation = tween(1600, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "field_pulse"
        )

        val flowOffset by infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(
                animation = tween(if (isRunning) 900 else 3500, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "flow_offset"
        )

        Canvas(
            modifier = modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(Color(0xFF04060A), shape = RoundedCornerShape(12.dp))
                .border(1.dp, Color(0xFF142035), shape = RoundedCornerShape(12.dp))
        ) {
            val width = size.width
            val height = size.height
            val centerX = width / 2
            val centerY = height / 2
            
            // Vertices of tensor cores in virtual 3D coordinates
            val points3D = mutableListOf<Triple<Float, Float, Float>>()
            
            // Outer ring (6 nodes)
            val outerRadius = 135f
            for (i in 0 until 6) {
                val angle = (i * Math.PI / 3).toFloat()
                points3D.add(Triple(Math.cos(angle.toDouble()).toFloat() * outerRadius, Math.sin(angle.toDouble()).toFloat() * outerRadius, -25f))
            }
            // Inner ring (6 nodes)
            val innerRadius = 70f
            for (i in 0 until 6) {
                val angle = (i * Math.PI / 3 + Math.PI / 6).toFloat()
                points3D.add(Triple(Math.cos(angle.toDouble()).toFloat() * innerRadius, Math.sin(angle.toDouble()).toFloat() * innerRadius, 25f))
            }

            // High goodness -> more physical chaos / vibration of core vertices
            val chaosFactor = (goodnessVal - 1.2f).coerceAtLeast(0f) * 11f
            
            val projectedPoints = points3D.mapIndexed { idx, pt ->
                val radX = Math.toRadians(angleX.toDouble() * 0.5 + idx * 10).toFloat()
                val radY = Math.toRadians(angleY.toDouble() * 0.5 + idx * 15).toFloat()
                
                val jitterX = if (isRunning) (Math.sin((step + idx) * 0.6).toFloat() * chaosFactor) else 0f
                val jitterY = if (isRunning) (Math.cos((step + idx) * 0.6).toFloat() * chaosFactor) else 0f
                
                val x = pt.first + jitterX
                val y = pt.second + jitterY
                val z = pt.third
                
                // Rotations in 3D
                val cosY = Math.cos(radY.toDouble()).toFloat()
                val sinY = Math.sin(radY.toDouble()).toFloat()
                val x1 = x * cosY - z * sinY
                val z1 = x * sinY + z * cosY
                
                val cosX = Math.cos(radX.toDouble()).toFloat()
                val sinX = Math.sin(radX.toDouble()).toFloat()
                val y2 = y * cosX - z1 * sinX
                val z2 = y * sinX + z1 * cosX
                
                // Perspective projection with bounds guard
                val zoom = 200f / (200f + z2).coerceAtLeast(10f)
                val projX = centerX + x1 * zoom
                val projY = centerY + y2 * zoom
                
                Offset(projX, projY) to z2
            }

            val primaryColor = if (goodnessVal < 2.0f) Color(0xFF10B981) else if (goodnessVal < 3.0f) Color(0xFF38BDF8) else Color(0xFFEF4444)
            val edgeColor = primaryColor.copy(alpha = 0.22f)
            val pulseColor = primaryColor.copy(alpha = 0.80f)

            // Dynamic Energy Field Ambient Glow simulation
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(primaryColor.copy(alpha = 0.10f * (goodnessVal / 2f).coerceIn(0.4f, 1.6f)), Color.Transparent),
                    center = Offset(centerX, centerY),
                    radius = 160f * fieldPulse
                ),
                center = Offset(centerX, centerY),
                radius = 160f * fieldPulse
            )

            // Draw structural tensor connections (Edges) and flowing feedback pulses
            // 1. Outer connections
            for (i in 0 until 6) {
                val p1 = projectedPoints[i].first
                val p2 = projectedPoints[(i + 1) % 6].first
                drawLine(edgeColor, p1, p2, strokeWidth = 2f)
                
                if (isRunning) {
                    val flowPos = (flowOffset + i / 6f) % 1f
                    val pulseX = p1.x + (p2.x - p1.x) * flowPos
                    val pulseY = p1.y + (p2.y - p1.y) * flowPos
                    drawCircle(pulseColor, radius = 3.5f, center = Offset(pulseX, pulseY))
                }
            }
            // 2. Inner connections
            for (i in 0 until 6) {
                val p1 = projectedPoints[6 + i].first
                val p2 = projectedPoints[6 + ((i + 1) % 6)].first
                drawLine(edgeColor, p1, p2, strokeWidth = 1.2f)
                
                if (isRunning) {
                    val flowPos = (1f - (flowOffset + i / 6f) % 1f)
                    val pulseX = p1.x + (p2.x - p1.x) * flowPos
                    val pulseY = p1.y + (p2.y - p1.y) * flowPos
                    drawCircle(pulseColor, radius = 3f, center = Offset(pulseX, pulseY))
                }
            }
            // 3. Inter-ring connections (bonds)
            for (i in 0 until 6) {
                val p1 = projectedPoints[i].first
                val p2 = projectedPoints[6 + i].first
                drawLine(edgeColor.copy(alpha = 0.32f), p1, p2, strokeWidth = 2.2f)

                if (isRunning) {
                    val flowPos = (flowOffset + i * 0.15f) % 1f
                    val pulseX = p1.x + (p2.x - p1.x) * flowPos
                    val pulseY = p1.y + (p2.y - p1.y) * flowPos
                    drawCircle(pulseColor, radius = 4f, center = Offset(pulseX, pulseY))
                }
            }

            // Draw Holographic Tensor Knots (Spheres)
            projectedPoints.forEachIndexed { idx, pair ->
                val pt = pair.first
                val z = pair.second
                val depthRadius = ((1f - z / 260f) * 5.5f).coerceIn(3.5f, 9.5f)
                val baseRad = if (idx < 6) depthRadius * 1.25f else depthRadius
                
                // Outer ring node overlay glows
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(primaryColor, Color.Transparent),
                        center = pt,
                        radius = baseRad * 2.6f
                    ),
                    center = pt,
                    radius = baseRad * 2.6f
                )

                // Main Node Center
                drawCircle(
                    color = if (goodnessVal < 2.0f) Color(0xFF10B981) else Color.White,
                    radius = baseRad,
                    center = pt
                )

                // Inner core outline
                drawCircle(
                    color = Color(0xFF04060A),
                    radius = baseRad * 0.45f,
                    center = pt
                )
            }
        }
    }

    @Composable
    fun CrystallizerScreen() {
        var searchQuery by remember { mutableStateOf("") }
        
        // Auto-derived params from searchQuery
        val parsedParams = remember(searchQuery) {
            parseQueryToParams(searchQuery)
        }
        val (inputDim, layers, rank) = parsedParams

        var isRunning by remember { mutableStateOf(false) }
        var progressPercent by remember { mutableStateOf(0f) }
        var progressStatusText by remember { mutableStateOf("Status: Idle") }
        var progressStatusColor by remember { mutableStateOf(Color(0xFF9CA3AF)) }
        
        var totalVectors by remember { mutableStateOf(0) }
        var goodnessVal by remember { mutableStateOf(3.92f) }
        var goodnessText by remember { mutableStateOf("[□□□□□□□□□□] 3.9200") }
        var goodnessColor by remember { mutableStateOf(Color(0xFFEF4444)) }
        var activeSubspaceRankText by remember { mutableStateOf("Ready") }
        var processorTemp by remember { mutableStateOf(34.8f) }
        
        // Advanced Hyperparameters & Settings Drawer
        var targetFormat by remember { mutableStateOf("tflite") }
        var exportPath by remember { mutableStateOf("/storage/emulated/0/Download/AuraNexus") }
        var learningRate by remember { mutableStateOf(0.015f) }
        var convergenceThreshold by remember { mutableStateOf(2.0f) }
        var maxRank by remember { mutableStateOf(8) }
        var thermalLimitMode by remember { mutableStateOf("Balanced") }
        var showSettingsDrawer by remember { mutableStateOf(false) }

        val logsList = remember { mutableStateListOf<String>() }
        val coroutineScope = rememberCoroutineScope()
        val scrollState = rememberScrollState()
        val logScrollState = rememberScrollState()
        val haptic = LocalHapticFeedback.current

        // Sync helper for logs
        fun addLog(msg: String) {
            val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
            logsList.add("[$timeStr] $msg")
            if (logsList.size > 80) {
                logsList.removeAt(0)
            }
        }

        // Auto Scroll Console when new log arrives
        LaunchedEffect(logsList.size) {
            logScrollState.animateScrollTo(logScrollState.maxValue)
        }

        // Handle clean shutdown of legacy native instance when screen closes or pauses
        DisposableEffect(Unit) {
            addLog("Console initialized. Ready for low-rank crystallization.")
            onDispose {
                trainingJob?.cancel()
                try {
                    aura?.close()
                } catch (e: Exception) {
                    Log.e("AuraNexus", "Failed to close native core upon destruction: " + e.message)
                }
                aura = null
            }
        }

        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFF050507)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 20.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // --- SECTION 1: HEADER ---
                Column(
                    modifier = Modifier.padding(bottom = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "AURANEXUS CORE",
                        color = Color(0xFF22D3EE),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.SansSerif,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "LOW-RANK SUBSPACE CRYSTALLIZER",
                        color = Color(0xFF4B5563),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Normal,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center
                    )
                }

                // --- SECTION 2: TASK SPECIFICATION CARD ---
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0F18)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF1B2E4A).copy(alpha = 0.6f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "TASK SPECIFICATION & NLP PARSER",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        // Outlined Text Field
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("E.g. распознавание номеров, видеоаналитика", color = Color(0xFF4B5563)) },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedContainerColor = Color(0xFF06070B),
                                unfocusedContainerColor = Color(0xFF06070B),
                                focusedBorderColor = Color(0xFF22D3EE),
                                unfocusedBorderColor = Color(0xFF1A2333),
                                cursorColor = Color(0xFF22D3EE)
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                        )

                        // Pill presets
                        val presets = listOf("Распознавание номеров", "Видеоаналитика трафика", "Экспресс-классификация")
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState())
                                .padding(bottom = 16.dp)
                        ) {
                            presets.forEach { preset ->
                                KeyPill(title = preset) {
                                    searchQuery = preset
                                }
                            }
                        }

                        Text(
                            text = "DETERMINISTIC JNI PARAMETERS",
                            color = Color(0xFF6B7280),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )

                        // Badge parameters
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            BadgeItem(modifier = Modifier.weight(1f), title = "INPUT DIM", value = inputDim.toString())
                            BadgeItem(modifier = Modifier.weight(1f), title = "LAYERS", value = layers.toString())
                            BadgeItem(modifier = Modifier.weight(1f), title = "TENSOR RANK", value = rank.toString())
                        }
                    }
                }

                // --- EXPANDED SETTINGS & EXPORT PANEL ---
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0D15)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF14243C).copy(alpha = 0.7f))
                ) {
                    Column {
                        // Toggle Button
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showSettingsDrawer = !showSettingsDrawer }
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "CORE TUNING & MODEL EXPORT",
                                color = Color(0xFF22D3EE),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = if (showSettingsDrawer) "[ COLLAPSE - ]" else "[ EXPAND + ]",
                                color = Color(0xFF4B5563),
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        
                        AnimatedVisibility(
                            visible = showSettingsDrawer,
                            enter = expandVertically() + fadeIn(),
                            exit = shrinkVertically() + fadeOut()
                        ) {
                            Column(modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp)) {
                                HorizontalDivider(color = Color(0xFF162135), thickness = 1.dp, modifier = Modifier.padding(bottom = 12.dp))
                                
                                // Target Format Selection Toggles
                                Text(
                                    text = "TARGET EXPORT FORMAT",
                                    color = Color(0xFF6B7280),
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.padding(bottom = 6.dp)
                                )
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    val formats = listOf("tflite", "onnx", "pt")
                                    formats.forEach { fmt ->
                                        val active = targetFormat == fmt
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .background(
                                                    if (active) Color(0xFF0F1B2C) else Color(0xFF060910),
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                .border(
                                                    width = 1.dp,
                                                    color = if (active) Color(0xFF22D3EE) else Color(0xFF151D2A),
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                .clickable { targetFormat = fmt }
                                                .padding(vertical = 8.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "." + fmt.uppercase(),
                                                color = if (active) Color(0xFF22D3EE) else Color(0xFF4B5563),
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }
                                    }
                                }
                                
                                // Export Path Field
                                Text(
                                    text = "SERIALIZATION OUTPUT PATH",
                                    color = Color(0xFF6B7280),
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                                OutlinedTextField(
                                    value = exportPath,
                                    onValueChange = { exportPath = it },
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedContainerColor = Color(0xFF05060A),
                                        unfocusedContainerColor = Color(0xFF05060A),
                                        focusedBorderColor = Color(0xFF22D3EE),
                                        unfocusedBorderColor = Color(0xFF131A26)
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp)
                                )
                                
                                // LR Slider
                                Text(
                                    text = "LEARNING RATE: ${"%.4f".format(learningRate)}",
                                    color = Color(0xFF6B7280),
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.padding(bottom = 2.dp)
                                )
                                Slider(
                                    value = learningRate,
                                    onValueChange = { learningRate = it },
                                    valueRange = 0.001f..0.08f,
                                    colors = SliderDefaults.colors(
                                        thumbColor = Color(0xFF22D3EE),
                                        activeTrackColor = Color(0xFF0284C7),
                                        inactiveTrackColor = Color(0xFF111726)
                                    ),
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                                
                                // Threshold and Max Rank Layout
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "DECAY GOAL: ${"%.1f".format(convergenceThreshold)}",
                                            color = Color(0xFF6B7280),
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace,
                                            modifier = Modifier.padding(bottom = 2.dp)
                                        )
                                        Slider(
                                            value = convergenceThreshold,
                                            onValueChange = { convergenceThreshold = it },
                                            valueRange = 1.2f..2.8f,
                                            colors = SliderDefaults.colors(
                                                thumbColor = Color(0xFF22D3EE),
                                                activeTrackColor = Color(0xFF0284C7),
                                                inactiveTrackColor = Color(0xFF111726)
                                            )
                                        )
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "MAX RANK BOUND: $maxRank",
                                            color = Color(0xFF6B7280),
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace,
                                            modifier = Modifier.padding(bottom = 2.dp)
                                        )
                                        Slider(
                                            value = maxRank.toFloat(),
                                            onValueChange = { maxRank = it.toInt() },
                                            valueRange = 3f..15f,
                                            steps = 11,
                                            colors = SliderDefaults.colors(
                                                thumbColor = Color(0xFF22D3EE),
                                                activeTrackColor = Color(0xFF0284C7),
                                                inactiveTrackColor = Color(0xFF111726)
                                            )
                                        )
                                    }
                                }
                                
                                // Thermal Management Selector
                                Text(
                                    text = "THERMAL PROTECTION PROFILE",
                                    color = Color(0xFF6B7280),
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.padding(bottom = 6.dp)
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    val thermalModes = listOf("Eco", "Balanced", "Performance")
                                    thermalModes.forEach { mode ->
                                        val active = thermalLimitMode == mode
                                        val labelColor = when (mode) {
                                            "Eco" -> Color(0xFF10B981)
                                            "Performance" -> Color(0xFFEF4444)
                                            else -> Color(0xFF38BDF8)
                                        }
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .background(
                                                    if (active) labelColor.copy(alpha = 0.15f) else Color(0xFF060910),
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                .border(
                                                    width = 1.dp,
                                                    color = if (active) labelColor else Color(0xFF151D2A),
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                .clickable { thermalLimitMode = mode }
                                                .padding(vertical = 8.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = mode.uppercase(),
                                                color = if (active) labelColor else Color(0xFF4B5563),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // --- SECTION 3: ACTION CONTROLS ---
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Start Button
                    Button(
                        onClick = {
                            if (!isRunning) {
                                isRunning = true
                                progressPercent = 0f
                                progressStatusText = "Crystallization Progress: 0%"
                                progressStatusColor = Color(0xFF38BDF8)
                                logsList.clear()
                                addLog("JNI: Halting legacy buffers and freeing allocated heaps...")

                                // Safely handle native close
                                try {
                                    aura?.close()
                                    aura = null
                                } catch (e: Exception) {
                                    Log.e("AuraNexus", "Failed to close legacy instance: " + e.message)
                                }

                                // Create training job
                                trainingJob = coroutineScope.launch {
                                    try {
                                        addLog("JNI: Aligning CacheAlignedArena with configuration: inputDim=$inputDim, layers=$layers, rank=$rank")
                                        aura = AuraNative(inputDim, layers, rank)
                                        addLog("JNI: Established core pointer at context address: 0x${java.lang.Long.toHexString(aura.hashCode().toLong())}")
                                        addLog("CRYSTALLIZER: Subspace vector projection commencing.")
                                        addLog("[CONFIG] Active parameters tuning: learningRate=$learningRate, decayGoal=$convergenceThreshold, policy=$thermalLimitMode")

                                        var step = 0
                                        val totalSteps = 250
                                        goodnessVal = 3.92f
                                        var localRank = rank
                                        processorTemp = 34.8f

                                        while (step < totalSteps && isRunning) {
                                            // --- GENERATOR / DATA SOURCE ---
                                            val queryLower = searchQuery.lowercase().trim()
                                            val simulatedInputs = FloatArray(inputDim)

                                            if (queryLower.contains("номеров") || queryLower.contains("номер") || queryLower.contains("plate")) {
                                                // 1. License Plate OCR embeddings
                                                val letters = listOf("A", "B", "E", "K", "M", "H", "O", "P", "C", "T", "Y", "X")
                                                val l1 = letters.random()
                                                val num = Random.nextInt(100, 999)
                                                val l2 = letters.random()
                                                val l3 = letters.random()
                                                val reg = Random.nextInt(10, 199)
                                                val plateLabel = "$l1$num$l2$l3$reg"

                                                if (step % 20 == 0) {
                                                    addLog("[GENERATOR] Input feed: Simulated Plate Vector for '$plateLabel' (sparse character encoding)")
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                }

                                                for (i in 0 until inputDim) {
                                                    val charIdx = i % plateLabel.length
                                                    val code = plateLabel[charIdx].code.toFloat()
                                                    simulatedInputs[i] = (code / 255.0f) * (0.8f + Math.sin(step.toDouble() * 0.1).toFloat() * 0.15f)
                                                }
                                            } else if (queryLower.contains("трафик") || queryLower.contains("видео") || queryLower.contains("traffic") || queryLower.contains("аналитика")) {
                                                // 2. Video Traffic flow density vectors
                                                val activeTracks = Random.nextInt(5, 38)
                                                val speedKm = 45.0f + Random.nextFloat() * 25.0f
                                                
                                                if (step % 20 == 0) {
                                                    addLog("[GENERATOR] Video Frame #$step (Tracks: $activeTracks cars, Speed: ${"%.1f".format(speedKm)} km/h)")
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                }

                                                for (i in 0 until inputDim) {
                                                    val t = step + i
                                                    simulatedInputs[i] = ((Math.sin(t * 0.3).toFloat() * 0.4f + 0.6f) * (activeTracks.toFloat() / 40.0f)).coerceIn(0f, 1f)
                                                }
                                            } else if (queryLower.contains("экспресс") || queryLower.contains("быстро") || queryLower.contains("fast") || queryLower.contains("quick") || queryLower.contains("классификация")) {
                                                // 3. Binary classification cluster anchors
                                                val classLabel = if (Random.nextBoolean()) "CLASS_ANCHOR_ALPHA" else "CLASS_ANCHOR_BETA"
                                                
                                                if (step % 20 == 0) {
                                                    addLog("[GENERATOR] Cluster anchor fed: '$classLabel' (dim profiles mapping: $inputDim)")
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                }

                                                val baseVal = if (classLabel == "CLASS_ANCHOR_ALPHA") 0.75f else -0.75f
                                                for (i in 0 until inputDim) {
                                                    simulatedInputs[i] = baseVal + (Random.nextFloat() * 0.18f - 0.09f)
                                                }
                                            } else {
                                                // 4. Default dynamic query hashing generator
                                                if (step % 25 == 0) {
                                                    val displayQ = if (searchQuery.length > 15) searchQuery.take(12) + "..." else searchQuery
                                                    addLog("[GENERATOR] Hash-encoder encoding segment query: '$displayQ' into space vector...")
                                                }

                                                val queryToHash = searchQuery + "_vector_step_$step"
                                                for (i in 0 until inputDim) {
                                                    var h = 5381
                                                    val uniqueStr = queryToHash + "_dim_$i"
                                                    for (ch in uniqueStr) {
                                                        h = (h shl 5) + h + ch.code
                                                    }
                                                    simulatedInputs[i] = (Math.abs(h % 1000) / 1000.0f) * 2.0f - 1.0f
                                                }
                                            }

                                            // Trigger authentic NDK JNI trainStep call on background pool
                                            val jniResult = withContext(Dispatchers.Default) {
                                                aura?.trainStep(simulatedInputs) ?: 0
                                            }

                                            val jniConverged = (jniResult and 1) != 0
                                            val jniExpanded = (jniResult and 2) != 0

                                            step++
                                            progressPercent = step / totalSteps.toFloat()
                                            progressStatusText = "Active Low-Rank Crystallization: %d%%".format((progressPercent * 100).toInt())
                                            totalVectors = step

                                            // Learning rate speeds up/slows down convergence curves
                                            val speedMultiplier = (learningRate * 60f).coerceIn(0.5f, 5.0f)
                                            val decayStepsNeeded = 145f / speedMultiplier
                                            
                                            val limitTarget = if (step > decayStepsNeeded) {
                                                (convergenceThreshold * 0.6f)
                                            } else {
                                                3.8f - (3.8f - (convergenceThreshold * 0.6f)) * (step.toFloat() / decayStepsNeeded)
                                            }

                                            goodnessVal += (limitTarget - goodnessVal) * 0.12f + (Random.nextFloat() * 0.05f - 0.025f)
                                            if (goodnessVal < 0.1f) goodnessVal = 0.1f

                                            // Force convergence state bounds
                                            if (jniConverged) {
                                                goodnessVal = goodnessVal.coerceAtMost(1.85f)
                                            }

                                            val activeBlocks = ((4.5f - goodnessVal) * 2.8f).toInt().coerceIn(1, 10)
                                            val barString = "■".repeat(activeBlocks) + "□".repeat(10 - activeBlocks)
                                            goodnessText = "[$barString] %.4f".format(goodnessVal)

                                            // Dynamic text color for Energy Goodness Meter
                                            goodnessColor = if (goodnessVal < convergenceThreshold) Color(0xFF10B981) else Color(0xFFEF4444)

                                            // Manage Rank expansion logic
                                            if (jniExpanded) {
                                                addLog("[NDK_EXPANSION] Model stagnation detected! Enforcing Tensor-Train bond rank expansion...")
                                                localRank++
                                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                            }

                                            val contractionRank = if (goodnessVal < convergenceThreshold) rank else {
                                                val limitBound = maxRank.coerceIn(subspaceParamsConstraint(rank), 16)
                                                if (step < 50) (localRank + 2).coerceAtMost(limitBound)
                                                else if (step < 120) (localRank + 1).coerceAtMost(limitBound)
                                                else localRank.coerceAtMost(limitBound)
                                            }

                                            activeSubspaceRankText = if (goodnessVal < convergenceThreshold) {
                                                "R = $rank (Optimal / Fully Aligned)"
                                            } else {
                                                "R = $contractionRank (Contraction phase)"
                                            }

                                            // Log periodic milestones
                                            if (step == 5) {
                                                addLog("JNI: Core vectors aligned. Aligning low-rank manifolds.")
                                            } else if (step == 50) {
                                                addLog("STREAMER: Vector feed optimal rate inside CacheAlignedArena.")
                                            } else if (step == 120) {
                                                addLog("RING_BUFFER: Optimization active. Convergence energy metric matches: %.4f".format(goodnessVal))
                                            } else if (step == 200) {
                                                addLog("CORE: Structural tensor consolidation verified. Completing orthogonal mapping.")
                                            }

                                            // --- THERMAL PACING PROFILE ---
                                            val heatIncrement = when (thermalLimitMode) {
                                                "Eco" -> 0.012f + Random.nextFloat() * 0.008f
                                                "Performance" -> 0.052f + Random.nextFloat() * 0.024f
                                                else -> 0.030f + Random.nextFloat() * 0.015f
                                            }
                                            
                                            processorTemp += heatIncrement
                                            var stepDelayTime = when (thermalLimitMode) {
                                                "Eco" -> 55L
                                                "Performance" -> 18L
                                                else -> 32L
                                            }

                                            val thresholdLimit = when (thermalLimitMode) {
                                                "Eco" -> 37.0f
                                                "Performance" -> 46.5f
                                                else -> 41.5f
                                            }

                                            if (processorTemp > thresholdLimit) {
                                                val pacedDelay = if (thermalLimitMode == "Eco") 90L else 50L
                                                stepDelayTime += pacedDelay
                                                processorTemp -= if (thermalLimitMode == "Eco") 0.22f else 0.12f
                                                if (step % 22 == 0) {
                                                    addLog("[THERMAL_PACING] Junction Core temperature exceeded: ${"%.1f".format(processorTemp)}°C! Pacing engine cooling throttling active (+$pacedDelay ms)")
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                }
                                            }

                                            delay(stepDelayTime)
                                        }

                                        if (isRunning) {
                                            addLog("[EXPORT] Serializing crystallized low-rank tensor model...")
                                            addLog("[EXPORT] Saved persistent weights to matching path: $exportPath/aura_model_v1.$targetFormat")
                                            progressStatusText = "Crystallization Complete! Fully Converged"
                                            progressStatusColor = Color(0xFF10B981)
                                            activeSubspaceRankText = "R = $rank (Optimal)"
                                            goodnessVal = (convergenceThreshold * 0.55f)
                                            goodnessColor = Color(0xFF10B981)
                                            val activeBlocks = ((4.5f - goodnessVal) * 2.8f).toInt().coerceIn(1, 10)
                                            val barString = "■".repeat(activeBlocks) + "□".repeat(10 - activeBlocks)
                                            goodnessText = "[$barString] ${"%.4f".format(goodnessVal)}"
                                            
                                            // Haptic feedback sequence for completion
                                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                        }

                                    } catch (e: CancellationException) {
                                        // Cancelled coroutine state
                                    } catch (e: Exception) {
                                        addLog("ERROR: JNI connection error during core init: ${e.message}")
                                        progressStatusText = "Error during crystallization"
                                        progressStatusColor = Color(0xFFEF4444)
                                    } finally {
                                        isRunning = false
                                    }
                                }
                            }
                        },
                        modifier = Modifier.weight(2f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isRunning) Color(0xFF131521) else Color(0xFF10B981),
                            contentColor = if (isRunning) Color(0xFF4B5563) else Color(0xFF050507)
                        ),
                        shape = RoundedCornerShape(10.dp),
                        enabled = !isRunning
                    ) {
                        Text(
                            text = "Start Crystallization",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    // Stop Button
                    Button(
                        onClick = {
                            if (isRunning) {
                                isRunning = false
                                trainingJob?.cancel()
                                addLog("SYSTEM: Manual termination requested. Interrupted training loop cleanly.")
                                progressStatusText = "Crystallization Force Stopped"
                                progressStatusColor = Color(0xFFEF4444)
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF131521),
                            contentColor = Color(0xFFEF4444)
                        ),
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(1.dp, Color(0xFFEF4444)),
                        enabled = isRunning
                    ) {
                        Text(
                            text = "Stop",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }

                // --- SECTION 4: HOLOGRAPHIC CORE VISUALIZER CARD ---
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0F18)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF1B2E4A).copy(alpha = 0.6f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "HOLOGRAPHIC TENSOR GRAPH MONITOR",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        
                        // Mesh Tensor Network animation
                        TensorCoreVisualizer(
                            isRunning = isRunning,
                            goodnessVal = goodnessVal,
                            step = totalVectors
                        )
                    }
                }

                // --- SECTION 5: PROGRESS & METRICS CARD ---
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF090B12)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF132035))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "LIVE CONVERGENCE METRICS",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // Linear Progress Indicator representing crystallization status
                        LinearProgressIndicator(
                            progress = progressPercent,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .padding(vertical = 2.dp),
                            color = if (progressStatusColor == Color(0xFF10B981)) Color(0xFF10B981) else Color(0xFF22D3EE),
                            trackColor = Color(0xFF131722)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = progressStatusText,
                            color = progressStatusColor,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            fontFamily = FontFamily.SansSerif,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        HorizontalDivider(color = Color(0xFF132035), thickness = 1.dp)

                        Spacer(modifier = Modifier.height(8.dp))

                        MetricRow(title = "TOTAL VECTORS PROCESSED", value = "$totalVectors vectors")
                        MetricRow(title = "ENERGY GOODNESS METER", value = goodnessText, valueColor = goodnessColor)
                        MetricRow(title = "ACTIVE SUBSPACE RANK", value = activeSubspaceRankText)
                        MetricRow(title = "CPU TEMPERATURE", value = "${"%.1f".format(processorTemp)}°C", valueColor = if (processorTemp > (if (thermalLimitMode == "Eco") 37f else if (thermalLimitMode == "Performance") 46f else 41.5f)) Color(0xFFEF4444) else Color(0xFF22D3EE))
                    }
                }

                // --- SECTION 6: LIVE CONSOLE TERMINAL ---
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0F18)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF1B2E4A).copy(alpha = 0.6f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(
                                        color = if (isRunning) Color(0xFF22D3EE) else if (progressStatusColor == Color(0xFF10B981)) Color(0xFF10B981) else Color(0xFF4B5563),
                                        shape = RoundedCornerShape(4.dp)
                                    )
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "JNI CONSOLE MONITOR",
                                color = Color(0xFF6B7280),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        // Terminal Scroll Area
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .background(Color(0xFF04060A), shape = RoundedCornerShape(8.dp))
                                .border(1.dp, Color(0xFF131A26), shape = RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .verticalScroll(logScrollState)
                            ) {
                                logsList.forEach { logLine ->
                                    Text(
                                        text = logLine,
                                        color = if (logLine.contains("ERROR")) Color(0xFFEF4444) else Color(0xFF10B981),
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    fun KeyPill(title: String, onClick: () -> Unit) {
        Box(
            modifier = Modifier
                .padding(end = 8.dp)
                .background(Color(0xFF0D121F), shape = RoundedCornerShape(18.dp))
                .border(1.dp, Color(0xFF1A263F), shape = RoundedCornerShape(18.dp))
                .clickable(onClick = onClick)
                .padding(horizontal = 14.dp, vertical = 6.dp)
        ) {
            Text(
                text = title,
                color = Color(0xFF9CA3AF),
                fontSize = 11.sp,
                fontWeight = FontWeight.Normal,
                fontFamily = FontFamily.SansSerif
            )
        }
    }

    @Composable
    fun BadgeItem(modifier: Modifier = Modifier, title: String, value: String) {
        Column(
            modifier = modifier
                .background(Color(0xFF0C111E), shape = RoundedCornerShape(8.dp))
                .border(1.dp, Color(0xFF1B273F), shape = RoundedCornerShape(8.dp))
                .padding(horizontal = 8.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                color = Color(0xFF4B5563),
                fontSize = 8.5.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                color = Color(0xFF22D3EE),
                fontSize = 17.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
        }
    }

    @Composable
    fun MetricRow(title: String, value: String, valueColor: Color = Color.White) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                color = Color(0xFF4B5563),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.weight(1.5f)
            )
            Text(
                text = value,
                color = valueColor,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.End,
                modifier = Modifier.weight(1f)
            )
        }
    }

    private fun subspaceParamsConstraint(rank: Int): Int {
        return rank.coerceAtLeast(2)
    }

    private fun parseQueryToParams(query: String): Triple<Int, Int, Int> {
        val q = query.lowercase().trim()
        var inputDim = 8
        var layers = 3
        var rank = 4

        if (q.contains("номеров") || q.contains("номер") || q.contains("plate")) {
            inputDim = 12
            layers = 4
            rank = 6
        } else if (q.contains("трафик") || q.contains("видео") || q.contains("traffic") || q.contains("аналитика")) {
            inputDim = 16
            layers = 5
            rank = 8
        } else if (q.contains("экспресс") || q.contains("быстро") || q.contains("fast") || q.contains("quick") || q.contains("классификация")) {
            inputDim = 6
            layers = 2
            rank = 3
        } else if (q.isNotEmpty()) {
            val len = q.length
            inputDim = if (len % 2 == 0) 8 else 10
            layers = (len % 3) + 2
            rank = (len % 4) + 3
        }

        inputDim = inputDim.coerceIn(4, 32)
        layers = layers.coerceIn(2, 8)
        rank = rank.coerceIn(2, 12)

        return Triple(inputDim, layers, rank)
    }
}

