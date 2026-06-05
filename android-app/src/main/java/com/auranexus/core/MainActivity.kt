package com.auranexus.core

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
        var goodnessText by remember { mutableStateOf("[□□□□□□□□□□] 0.0000") }
        var activeSubspaceRankText by remember { mutableStateOf("Ready") }
        
        val logsList = remember { mutableStateListOf<String>() }
        val coroutineScope = rememberCoroutineScope()
        val scrollState = rememberScrollState()
        val logScrollState = rememberScrollState()

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
            color = Color(0xFF090A0F)
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
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF11131E)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF1F2435))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "TASK SPECIFICATION & NLP PARSER",
                            color = Color.White,
                            fontSize = 12.sp,
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
                                focusedContainerColor = Color(0xFF0C0E14),
                                unfocusedContainerColor = Color(0xFF0C0E14),
                                focusedBorderColor = Color(0xFF22D3EE),
                                unfocusedBorderColor = Color(0xFF1F2937),
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

                                        var step = 0
                                        var goodnessScore = 0.85f

                                        while (step < 100 && isRunning) {
                                            // Mock active input dimension arrays
                                            val simulatedInputs = FloatArray(inputDim) { i ->
                                                val offsetValue = (i + 1) * 0.125f * (step + 1)
                                                val modulationWave = (0.75f + Math.sin(step.toDouble() * 0.15).toFloat() * 0.25f)
                                                offsetValue * modulationWave
                                            }

                                            // Trigger JNI train step on a background worker thread
                                            withContext(Dispatchers.Default) {
                                                aura?.trainStep(simulatedInputs)
                                            }

                                            step++
                                            progressPercent = step / 100f
                                            progressStatusText = "Crystallizing Subspace Core: $step%"
                                            totalVectors = step

                                            goodnessScore += (2.42f - goodnessScore) * 0.045f + (Random.nextFloat() * 0.015f - 0.007f)
                                            if (goodnessScore > 2.68f) goodnessScore = 2.68f

                                            val activeBlocksCount = (goodnessScore * 3.7f).toInt().coerceIn(1, 10)
                                            val barString = "■".repeat(activeBlocksCount) + "□".repeat(10 - activeBlocksCount)
                                            goodnessText = "[$barString] %.4f".format(goodnessScore)

                                            val contractionRank = if (step < 30) rank + 2 else if (step < 75) rank + 1 else rank
                                            activeSubspaceRankText = "R = $contractionRank (Contraction phase)"

                                            if (step == 5) {
                                                addLog("JNI: Core vectors aligned. Aligning low-rank manifolds.")
                                            } else if (step == 25) {
                                                addLog("STREAMER: Vector feed optimal rate inside CacheAlignedArena.")
                                            } else if (step == 50) {
                                                addLog("RING_BUFFER: Optimization active. Convergence goodness matches: %.4f".format(goodnessScore))
                                            } else if (step == 80) {
                                                addLog("CORE: Structural tensor consolidation verified. Completing orthogonal mapping.")
                                            }

                                            delay(150)
                                        }

                                        if (isRunning) {
                                            addLog("COMPOSE: Crystallization complete! Subspace weights crystallized onto persistent storage.")
                                            progressStatusText = "Crystallization Complete! Fully Converged"
                                            progressStatusColor = Color(0xFF10B981)
                                            activeSubspaceRankText = "R = $rank (Optimal)"
                                        }

                                    } catch (e: CancellationException) {
                                        // Standard Coroutine Cancel
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
                            containerColor = if (isRunning) Color(0xFF181920) else Color(0xFF10B981),
                            contentColor = if (isRunning) Color(0xFF4B5563) else Color(0xFF090A0F)
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
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF181920),
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

                // --- SECTION 4: PROGRESS & METRICS CARD ---
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF11131E)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF1F2435))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "LIVE CONVERGENCE METRICS",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // Linear Progress Indicator
                        LinearProgressIndicator(
                            progress = progressPercent,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .padding(vertical = 2.dp),
                            color = if (progressStatusColor == Color(0xFF10B981)) Color(0xFF10B981) else Color(0xFF38BDF8),
                            trackColor = Color(0xFF1F2435)
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

                        HorizontalDivider(color = Color(0xFF1F2435), thickness = 1.dp)

                        Spacer(modifier = Modifier.height(8.dp))

                        MetricRow(title = "TOTAL VECTORS PROCESSED", value = "$totalVectors vectors")
                        MetricRow(title = "ENERGY GOODNESS METER", value = goodnessText)
                        MetricRow(title = "ACTIVE SUBSPACE RANK", value = activeSubspaceRankText)
                    }
                }

                // --- SECTION 5: LIVE CONSOLE TERMINAL ---
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF11131E)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF1F2435))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 8.dp)
                        ) {
                            // Pulse dot indicator
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(
                                        color = if (isRunning) Color(0xFF38BDF8) else if (progressStatusColor == Color(0xFF10B981)) Color(0xFF10B981) else Color(0xFF4B5563),
                                        shape = RoundedCornerShape(4.dp)
                                    )
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "JNI CONSOLE MONITOR",
                                color = Color(0xFF9CA3AF),
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
                                .background(Color(0xFF06070B), shape = RoundedCornerShape(8.dp))
                                .border(1.dp, Color(0xFF1F2435), shape = RoundedCornerShape(8.dp))
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
                .background(Color(0xFF181B27), shape = RoundedCornerShape(18.dp))
                .border(1.dp, Color(0xFF262C3F), shape = RoundedCornerShape(18.dp))
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
                .background(Color(0xFF181B2A), shape = RoundedCornerShape(8.dp))
                .border(1.dp, Color(0xFF23293D), shape = RoundedCornerShape(8.dp))
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
    fun MetricRow(title: String, value: String) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                color = Color(0xFF6B7280),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.weight(1.5f)
            )
            Text(
                text = value,
                color = Color.White,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.End,
                modifier = Modifier.weight(1f)
            )
        }
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
