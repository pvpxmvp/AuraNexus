plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.auranexus.core"
    compileSdk = 34

    defaultConfig {
        minSdk = 24

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("proguard-rules.pro")

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
}

// Automatic Cargo integration task registering
tasks.register<Exec>("cargoNdkBuild") {
    // Navigate relative to where Cargo.toml resides
    workingDir = file("../rust-core")
    
    // Command line compiling toolchain
    commandLine("cargo", "ndk", "--target", "aarch64-linux-android", "build", "--release")
}

// Make compilation depend on Rust cargo binary output
tasks.configureEach {
    if (name.startsWith("externalNativeBuild") || name.startsWith("compileDebugCMake") || name.startsWith("compileReleaseCMake")) {
        dependsOn("cargoNdkBuild")
    }
}
