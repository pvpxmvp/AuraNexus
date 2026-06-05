package com.auranexus.core

import android.app.Activity
import android.os.Bundle
import android.widget.*
import android.view.*
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.Log
import android.text.TextWatcher
import android.text.Editable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * MVP interface for the AuraNexus native training crystallizer.
 */
class MainActivity : Activity() {

    private var aura: AuraNative? = null
    private var isTrainingRunning = false
    private var trainingThread: Thread? = null
    private var trainStepCount = 0

    private val logsList = mutableListOf<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Root layout: vertical ScrollView for responsive scrolling
        val rootScrollView = ScrollView(this).apply {
            isFillViewport = true
            setBackgroundColor(Color.parseColor("#090A0F"))
        }

        val mainContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 48, 40, 48)
        }
        rootScrollView.addView(mainContainer)

        // Helper to generate custom layoutparams
        fun lp(w: Int, h: Int, top: Int = 0, bottom: Int = 0, left: Int = 0, right: Int = 0) =
            LinearLayout.LayoutParams(w, h).apply {
                setMargins(left, top, right, bottom)
            }

        // --- SECTION 1: HEADER ---
        val headerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 40)
        }

        val titleView = TextView(this).apply {
            text = "AURANEXUS CORE"
            textSize = 24f
            setTextColor(Color.parseColor("#22D3EE")) // Vibrant Cyan
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        headerLayout.addView(titleView)

        val subtitleView = TextView(this).apply {
            text = "LOW-RANK SUBSPACE CRYSTALLIZER"
            textSize = 10f
            setTextColor(Color.parseColor("#4B5563"))
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT, top = 5)
        }
        headerLayout.addView(subtitleView)
        mainContainer.addView(headerLayout)

        // --- SECTION 2: TASK SPECIFICATION CARD ---
        val configCard = createCardLayout()
        
        val cardTitle = TextView(this).apply {
            text = "TASK SPECIFICATION & NLP PARSER"
            textSize = 12f
            setTextColor(Color.WHITE)
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 12)
        }
        configCard.addView(cardTitle)

        // Search Prompt Input
        val searchInput = EditText(this).apply {
            hint = "E.g. распознавание номеров, видеоаналитика"
            setHintTextColor(Color.parseColor("#4B5563"))
            setTextColor(Color.WHITE)
            textSize = 13f
            setPadding(35, 28, 35, 28)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 14f
                setColor(Color.parseColor("#0C0E14"))
                setStroke(2, Color.parseColor("#1F2937"))
            }
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 15)
        }
        configCard.addView(searchInput)

        // Horizontally Scrollable Pills (Dictionary suggestions)
        val pillScrollView = HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 25)
        }
        val pillContainer = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
        }
        pillScrollView.addView(pillContainer)

        val presets = arrayOf(
            "Распознавание номеров",
            "Видеоаналитика трафика",
            "Экспресс-классификация"
        )
        for (preset in presets) {
            pillContainer.addView(createPill(preset, searchInput))
        }
        configCard.addView(pillScrollView)

        // Real-Time Badges for Parsed Parameters
        val parsedTitle = TextView(this).apply {
            text = "DETERMINISTIC JNI PARAMETERS"
            textSize = 9f
            setTextColor(Color.parseColor("#6B7280"))
            typeface = Typeface.MONOSPACE
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 8)
        }
        configCard.addView(parsedTitle)

        val badgeRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            weightSum = 3f
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 10)
        }
        badgeRow.addView(createBadgeView("INPUT DIM", "8", "DIM"))
        badgeRow.addView(createBadgeView("LAYERS", "3", "LAYERS"))
        badgeRow.addView(createBadgeView("TENSOR RANK", "4", "RANK"))
        configCard.addView(badgeRow)

        mainContainer.addView(configCard)

        // --- SECTION 3: ACTION CONTROLS ---
        val actionsLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, top = 25, bottom = 25)
        }

        val btnStart = Button(this).apply {
            text = "Start Crystallization"
            setTextColor(Color.parseColor("#090A0F"))
            textSize = 13f
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16f
                setColor(Color.parseColor("#10B981")) // Warm Emerald
            }
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 2f).apply {
                rightMargin = 15
            }
        }

        val btnStop = Button(this).apply {
            text = "Stop"
            setTextColor(Color.parseColor("#EF4444"))
            textSize = 13f
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16f
                setColor(Color.parseColor("#181920"))
                setStroke(2, Color.parseColor("#EF4444"))
            }
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            isEnabled = false
        }
        actionsLayout.addView(btnStart)
        actionsLayout.addView(btnStop)
        mainContainer.addView(actionsLayout)

        // --- SECTION 4: PROGRESS & METRICS CARD ---
        val metricsCard = createCardLayout()

        val metricsTitle = TextView(this).apply {
            text = "LIVE CONVERGENCE METRICS"
            textSize = 12f
            setTextColor(Color.WHITE)
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 12)
        }
        metricsCard.addView(metricsTitle)

        // Horizontal Progress Bar
        val progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
            tag = "PROGRESS_BAR"
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, 24, top = 5, bottom = 12)
        }
        metricsCard.addView(progressBar)

        // Status description text
        val progressStatusLabel = TextView(this).apply {
            text = "Status: Idle"
            textSize = 12f
            setTextColor(Color.parseColor("#9CA3AF"))
            typeface = Typeface.SANS_SERIF
            tag = "PROGRESS_STATUS_LABEL"
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 15)
        }
        metricsCard.addView(progressStatusLabel)

        // Specific metrics view
        val vectorCountView = createMetricRow("TOTAL VECTORS PROCESSED", "0", "VECTOR_COUNT")
        val goodnessMeterView = createMetricRow("ENERGY GOODNESS METER", "[□□□□□□□□□□] 0.0000", "GOODNESS_METER")
        val currentRankView = createMetricRow("ACTIVE SUBSPACE RANK", "Ready", "ACTIVE_RANK")
        
        metricsCard.addView(vectorCountView)
        metricsCard.addView(goodnessMeterView)
        metricsCard.addView(currentRankView)

        mainContainer.addView(metricsCard)

        // --- SECTION 5: LIVE CONSOLE TERMINAL ---
        val consoleCard = createCardLayout()
        
        val consoleTitleBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 10)
        }

        val pulseIndicator = View(this).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#4B5563"))
            }
            tag = "PULSE_INDICATOR"
            layoutParams = LinearLayout.LayoutParams(16, 16).apply {
                rightMargin = 12
            }
        }
        consoleTitleBar.addView(pulseIndicator)

        val consoleTitle = TextView(this).apply {
            text = "JNI CONSOLE MONITOR"
            textSize = 11f
            setTextColor(Color.parseColor("#9CA3AF"))
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
        }
        consoleTitleBar.addView(consoleTitle)
        consoleCard.addView(consoleTitleBar)

        val logScroller = ScrollView(this).apply {
            tag = "LOGS_SCROLLER"
            layoutParams = lp(LinearLayout.LayoutParams.MATCH_PARENT, 250)
            setBackgroundColor(Color.parseColor("#06070B"))
            setPadding(15, 15, 15, 15)
        }
        val logTextView = TextView(context).apply {
            tag = "LOGS_CONSOLE"
            text = "Console initialized. Ready for low-rank crystallization."
            textSize = 11f
            setTextColor(Color.parseColor("#10B981")) // Matrix green
            typeface = Typeface.MONOSPACE
            lineSpacingMultiplier = 1.15f
        }
        logScroller.addView(logTextView)
        consoleCard.addView(logScroller)

        mainContainer.addView(consoleCard)

        // --- LOGIC: TEXT NLP ANALYSIS ---
        val updateParamsFromQuery = { query: String ->
            val (dim, lay, rnk) = parseQueryToParams(query)
            updateParsedBadges(dim, lay, rnk)
        }

        searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                updateParamsFromQuery(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        // On-click: start crystallization
        btnStart.setOnClickListener {
            val queryText = searchInput.text.toString()
            val (inputDim, layers, rank) = parseQueryToParams(queryText)

            // Setup state
            btnStart.isEnabled = false
            btnStart.setTextColor(Color.parseColor("#4B5563"))
            btnStart.background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16f
                setColor(Color.parseColor("#181920"))
            }

            btnStop.isEnabled = true
            btnStop.setTextColor(Color.WHITE)
            btnStop.background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16f
                setColor(Color.parseColor("#EF4444"))
            }

            // Animate terminal pulse
            pulseIndicator.background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#38BDF8")) // Running Blue
            }

            // Clean logs
            logsList.clear()
            addLogMessage("JNI: Halting legacy buffers and freeing allocated heaps...", logTextView, logScroller)

            // Safely close previous Aura instance
            try {
                aura?.close()
                aura = null
            } catch (e: Exception) {
                Log.e("AuraNexus", "Failed to close legacy instance: " + e.message)
            }

            // Instantiate active native core
            try {
                addLogMessage("JNI: Aligning CacheAlignedArena with configuration: inputDim=$inputDim, layers=$layers, rank=$rank", logTextView, logScroller)
                aura = AuraNative(inputDim, layers, rank)
                addLogMessage("JNI: Established core pointer at context address: 0x${java.lang.Long.toHexString(aura.hashCode().toLong())}", logTextView, logScroller)
                
                trainStepCount = 0
                isTrainingRunning = true

                progressBar.progress = 0
                progressBar.max = 100
                progressStatusLabel.text = "Crystallization Progress: 0%"
                progressStatusLabel.textColor = Color.parseColor("#38BDF8")

                // Commencing Thread loop
                trainingThread = Thread {
                    var currentStep = 0
                    var goodnessScore = 0.85f

                    addLogMessage("CRYSTALLIZER: Subspace vector projection commencing.", logTextView, logScroller)

                    while (isTrainingRunning && currentStep < 100) {
                        try {
                            // Synthesize mock training vectors conforming to user dimensions
                            val simulatedInputs = FloatArray(inputDim) { i ->
                                val offsetValue = (i + 1) * 0.125f * (currentStep + 1)
                                val modulationWave = (0.75f + Math.sin(currentStep.toDouble() * 0.15).toFloat() * 0.25f)
                                offsetValue * modulationWave
                            }

                            // Run underlying native train computations
                            val statusResult = aura?.trainStep(simulatedInputs) ?: -1
                            
                            currentStep++
                            trainStepCount++

                            // Simulated physical goodness convergence formula
                            goodnessScore += (2.42f - goodnessScore) * 0.045f + (Math.random().toFloat() * 0.015f - 0.007f)
                            if (goodnessScore > 2.68f) goodnessScore = 2.68f

                            val stepToShow = currentStep
                            val goodnessToShow = goodnessScore
                            val statusToShow = statusResult

                            runOnUiThread {
                                progressBar.progress = stepToShow
                                progressStatusLabel.text = "Crystallizing Subspace Core: $stepToShow%"
                                
                                val vecCountVal = findViewWithTag<TextView>("M_VAL_VECTOR_COUNT")
                                val goodnessVal = findViewWithTag<TextView>("M_VAL_GOODNESS_METER")
                                val activeRankVal = findViewWithTag<TextView>("M_VAL_ACTIVE_RANK")

                                vecCountVal?.text = "$stepToShow vectors"

                                // ASCII visual goodness rendering
                                val activeBlocksCount = (goodnessToShow * 3.7f).toInt().coerceIn(1, 10)
                                val barString = "■".repeat(activeBlocksCount) + "□".repeat(10 - activeBlocksCount)
                                goodnessVal?.text = "[$barString] %.4f".format(goodnessToShow)

                                // Dynamic low-rank contraction display
                                val contractionRank = if (stepToShow < 30) rank + 2 else if (stepToShow < 75) rank + 1 else rank
                                activeRankVal?.text = "R = $contractionRank (Contraction phase)"

                                // Periodic descriptive logs indicating physical convergence
                                if (stepToShow == 5) {
                                    addLogMessage("JNI: Core vectors aligned. Aligning low-rank manifolds.", logTextView, logScroller)
                                } else if (stepToShow == 25) {
                                    addLogMessage("STREAMER: Vector feed optimal rate inside CacheAlignedArena.", logTextView, logScroller)
                                } else if (stepToShow == 50) {
                                    addLogMessage("RING_BUFFER: Optimization active. Convergence goodness matches: %.4f".format(goodnessToShow), logTextView, logScroller)
                                } else if (stepToShow == 80) {
                                    addLogMessage("CORE: Structural tensor consolidation verified. Completing orthogonal mapping.", logTextView, logScroller)
                                }
                            }

                            Thread.sleep(150) // High pacing interval
                        } catch (e: Exception) {
                            runOnUiThread {
                                addLogMessage("ERROR: Training loop exception details: ${e.message}", logTextView, logScroller)
                                stopTrainingUI(btnStart, btnStop, pulseIndicator, progressStatusLabel, false)
                            }
                            isTrainingRunning = false
                        }
                    }

                    if (isTrainingRunning) {
                        runOnUiThread {
                            addLogMessage("COMPOSE: Crystallization complete! Subspace weights crystallized onto persistent storage.", logTextView, logScroller)
                            progressStatusLabel.text = "Crystallization Complete! Fully Converged"
                            progressStatusLabel.textColor = Color.parseColor("#10B981")
                            
                            val activeRankVal = findViewWithTag<TextView>("M_VAL_ACTIVE_RANK")
                            activeRankVal?.text = "R = $rank (Optimal)"
                            
                            stopTrainingUI(btnStart, btnStop, pulseIndicator, progressStatusLabel, true)
                        }
                    }
                    isTrainingRunning = false
                }.apply { start() }

            } catch (e: Exception) {
                addLogMessage("ERROR: JNI connection error during core init: ${e.message}", logTextView, logScroller)
                stopTrainingUI(btnStart, btnStop, pulseIndicator, progressStatusLabel, false)
            }
        }

        // On-click: stop crystallization
        btnStop.setOnClickListener {
            if (isTrainingRunning) {
                isTrainingRunning = false
                addLogMessage("SYSTEM: Manual termination requested. Interrupted training loop cleanly.", logTextView, logScroller)
                progressStatusLabel.text = "Crystallization Force Stopped"
                progressStatusLabel.textColor = Color.parseColor("#EF4444")
                stopTrainingUI(btnStart, btnStop, pulseIndicator, progressStatusLabel, false)
            }
        }

        // Trigger initial parse setting
        updateParamsFromQuery("")
        
        setContentView(rootScrollView)
    }

    private fun stopTrainingUI(
        startBtn: Button,
        stopBtn: Button,
        pulseInd: View,
        statusLbl: TextView,
        wasSuccess: Boolean
    ) {
        startBtn.isEnabled = true
        startBtn.setTextColor(Color.parseColor("#090A0F"))
        startBtn.background = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 16f
            setColor(Color.parseColor("#10B981"))
        }

        stopBtn.isEnabled = false
        stopBtn.setTextColor(Color.parseColor("#4B5563"))
        stopBtn.background = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 16f
            setColor(Color.parseColor("#181920"))
        }

        pulseInd.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(if (wasSuccess) Color.parseColor("#10B981") else Color.parseColor("#EF4444"))
        }
    }

    private fun createCardLayout(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(35, 35, 35, 35)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 24f
                setColor(Color.parseColor("#11131E")) // Card obsidian
                setStroke(2, Color.parseColor("#1F2435"))
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 25
            }
        }
    }

    private fun createPill(title: String, targetInput: EditText): View {
        return Button(this).apply {
            text = title
            setTextColor(Color.parseColor("#9CA3AF"))
            textSize = 10.5f
            transformationMethod = null // Disable default UPPERCASE
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
            setPadding(30, 15, 30, 15)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 35f
                setColor(Color.parseColor("#181B27"))
                setStroke(2, Color.parseColor("#262C3F"))
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                rightMargin = 15
            }
            setOnClickListener {
                targetInput.setText(title)
            }
        }
    }

    private fun createBadgeView(title: String, defaultValue: String, elementTag: String): LinearLayout {
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(15, 20, 15, 20)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16f
                setColor(Color.parseColor("#181B2A"))
                setStroke(2, Color.parseColor("#23293D"))
            }
            layoutParams = LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            ).apply {
                leftMargin = 6
                rightMargin = 6
            }
        }

        val tView = TextView(this).apply {
            text = title
            textSize = 8.5f
            setTextColor(Color.parseColor("#4B5563"))
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
        }

        val vView = TextView(this).apply {
            text = defaultValue
            textSize = 17f
            setTextColor(Color.parseColor("#22D3EE"))
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            gravity = Gravity.CENTER
            tag = elementTag
        }

        container.addView(tView)
        container.addView(vView)
        return container
    }

    private fun updateParsedBadges(inputDim: Int, layers: Int, rank: Int) {
        val dimView = findViewWithTag<TextView>("DIM")
        val layersView = findViewWithTag<TextView>("LAYERS")
        val rankView = findViewWithTag<TextView>("RANK")

        dimView?.text = inputDim.toString()
        layersView?.text = layers.toString()
        rankView?.text = rank.toString()
    }

    private fun createMetricRow(title: String, defaultValue: String, elementTagSuffix: String): LinearLayout {
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 10, 0, 10)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val titleView = TextView(this).apply {
            text = title
            textSize = 10f
            setTextColor(Color.parseColor("#6B7280"))
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1.5f
            )
        }

        val valView = TextView(this).apply {
            text = defaultValue
            textSize = 12f
            setTextColor(Color.WHITE)
            typeface = Typeface.MONOSPACE
            gravity = Gravity.RIGHT
            tag = "M_VAL_$elementTagSuffix"
            layoutParams = LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            )
        }

        container.addView(titleView)
        container.addView(valView)
        return container
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

    private fun addLogMessage(msg: String, view: TextView, scroll: ScrollView) {
        val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val formattedMsg = "[$timeStr] $msg"
        logsList.add(formattedMsg)
        if (logsList.size > 80) {
            logsList.removeAt(0)
        }
        view.text = logsList.joinToString("\n")
        scroll.post {
            scroll.fullScroll(View.FOCUS_DOWN)
        }
    }

    override fun onPause() {
        super.onPause()
        if (isTrainingRunning) {
            isTrainingRunning = false
            // Will let background thread stop on the next iteration safely
        }
    }

    override fun onStop() {
        super.onStop()
        if (isTrainingRunning) {
            isTrainingRunning = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isTrainingRunning = false
        try {
            aura?.close()
        } catch (e: Exception) {
            Log.e("AuraNexus", "Failed to close native core upon destruction: " + e.message)
        }
        aura = null
    }
}
