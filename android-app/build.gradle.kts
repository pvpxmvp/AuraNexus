plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.auranexus.core"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.auranexus.core"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0-alpha"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        ndk {
            // Apply exclusive arm64-v8a architecture filter
            abiFilters.add("arm64-v8a")
        }

        externalNativeBuild {
            cmake {
                arguments("-DANDROID_STL=c++_shared")
                cppFlags("-std=c++17")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isMinifyEnabled = false
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    sourceSets {
        named("main") {
            jniLibs.srcDirs("src/main/jniLibs")
        }
    }

    afterEvaluate {
        // Для каждой ABI архитектуры создаем зависимость
        tasks.configureEach {
            if (name.startsWith("buildCMake") || name.startsWith("configureCMake") || name.startsWith("externalNativeBuild")) {
                dependsOn("cargoNdkBuild")
            }
            if (name.startsWith("merge") && name.endsWith("JniLibFolders")) {
                dependsOn("cargoNdkBuild")
            }
        }
    }
}

// Automatic Cargo integration task registering
tasks.register<Exec>("cargoNdkBuild") {
    group = "rust"
    description = "Compile Rust core for Android NDK"
    
    workingDir = file("${project.rootDir}/rust-core")
    commandLine(
        "cargo", "ndk",
        "--target", "aarch64-linux-android",
        "-o", "${project.projectDir}/src/main/jniLibs",
        "build", "--release"
    )
    
    // Указываем выходные файлы, чтобы кэширование работало корректно
    outputs.dir("${project.projectDir}/src/main/jniLibs/arm64-v8a")
}

// Make compilation depend on Rust cargo binary output
tasks.configureEach {
    if (name.startsWith("externalNativeBuild") || name.startsWith("compileDebugCMake") || name.startsWith("compileReleaseCMake")) {
        dependsOn("cargoNdkBuild")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    
    val composeBom = platform("androidx.compose:compose-bom:2024.04.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
}
