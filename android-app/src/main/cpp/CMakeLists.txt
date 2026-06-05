# android-app/src/main/cpp/CMakeLists.txt
cmake_minimum_required(VERSION 3.22)
project(aura_jni_bridge)

# Enable C++17 standard as specified
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Search for the Android logger interface
find_library(log-lib log)

# Import compiled Static Rust core library
add_library(aura_core STATIC IMPORTED)
set_target_properties(aura_core PROPERTIES IMPORTED_LOCATION
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../target/aarch64-linux-android/release/libaura_core.a
)

# Declare SHARED library implementing Java Native Interface methods
add_library(aura_jni SHARED aura-jni.cpp)

# Header files configuration
target_include_directories(aura_jni PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

# Link SHARED library targets with Static Rust binary and Android logging
target_link_libraries(aura_jni
    aura_core
    ${log-lib}
)
