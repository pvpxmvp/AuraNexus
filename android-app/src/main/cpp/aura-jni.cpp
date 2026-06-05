// android-app/src/main/cpp/aura-jni.cpp
#include <jni.h>
#include <android/log.h>
#include <stdexcept>
#include <string>
#include <cstring>

#define LOG_TAG "AURA_JNI_NATIVE"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// External linkage declarations pointing to the static Rust core
extern "C" {
    typedef void* CorePtr;
    CorePtr init_core(int input_dim, int layers, int rank);
    int train_step_core(CorePtr ptr, const float* data, int length);
    void export_weights_core(CorePtr ptr, const char* path);
    int get_weights_size(CorePtr ptr);
    int get_weights_data(CorePtr ptr, float* out_buf, int max_len);
    void get_meta_data(CorePtr ptr, int* out_buf);
    void destroy_core(CorePtr ptr);
}

// C++ SafeTensorView wrap over raw pointers with dynamic boundaries protection
template <typename T>
class SafeTensorView {
private:
    T* data;
    size_t length;
    bool is_const;

public:
    SafeTensorView(T* raw_data, size_t len, bool is_read_only = false) 
        : data(raw_data), length(len), is_const(is_read_only) {
        if (raw_data == nullptr && len > 0) {
            throw std::runtime_error("NullPointer exception inside SafeTensorView initialization.");
        }
    }

    T get(size_t index) const {
        if (index >= length) {
            throw std::out_of_range("Memory Access Overflow Blocked! Index out of SafeTensorView bounds.");
        }
        return data[index];
    }

    void set(size_t index, T value) {
        if (is_const) {
            throw std::runtime_error("Attempted mutate write operations on constant SafeTensorView elements.");
        }
        if (index >= length) {
            throw std::out_of_range("Memory Access Overflow Blocked! Index out of SafeTensorView bounds.");
        }
        data[index] = value;
    }

    const T* get_raw_ptr() const { return data; }
    size_t size() const { return length; }
};

extern "C" JNIEXPORT jlong JNICALL
Java_com_auranexus_core_AuraNative_init(JNIEnv *env, jobject thiz, jint input_dim, jint layers, jint rank) {
    LOGD("Java_com_auranexus_core_AuraNative_init init trigger: dim=%d, layers=%d, rank=%d", input_dim, layers, rank);
    try {
        CorePtr core = init_core(input_dim, layers, rank);
        if (core == nullptr) {
            LOGE("Critical Error: init_core returned nil pointer.");
            return 0;
        }
        return reinterpret_cast<jlong>(core);
    } catch (const std::exception& e) {
        LOGE("C++ Exception in AuraNative_init: %s", e.what());
        jclass exClass = env->FindClass("java/lang/RuntimeException");
        if (exClass != nullptr) {
            env->ThrowNew(exClass, e.what());
        }
        return 0;
    }
}

extern "C" JNIEXPORT jint JNICALL
Java_com_auranexus_core_AuraNative_trainStep(JNIEnv *env, jobject thiz, jlong ptr, jfloatArray data) {
    if (ptr == 0) {
        LOGE("Critical error: nullptr dereference passed as core ptr in trainStep.");
        jclass exClass = env->FindClass("java/lang/NullPointerException");
        if (exClass != nullptr) {
            env->ThrowNew(exClass, "AuraCore context pointer is null.");
        }
        return -1;
    }

    if (data == nullptr) {
        LOGE("Critical error: train data is null.");
        return -1;
    }

    CorePtr core = reinterpret_cast<CorePtr>(ptr);
    jsize len = env->GetArrayLength(data);
    jfloat* body = env->GetFloatArrayElements(data, nullptr);

    if (body == nullptr) {
        LOGE("Could not lock JNI float array elements.");
        return -1;
    }

    jint status = -1;
    try {
        // Enforce safe memory encapsulation bounds checks using SafeTensorView
        SafeTensorView<float> view(body, static_cast<size_t>(len), true);
        
        // Pass checked SafeTensorView encapsulated data pointer to Rust stack context runs
        status = train_step_core(core, view.get_raw_ptr(), static_cast<int>(view.size()));
        
        LOGD("Java_com_auranexus_core_AuraNative_trainStep: completed. Status=%d", status);
    } catch (const std::exception& e) {
        LOGE("SafeTensorView access failure caught in JNI: %s", e.what());
        jclass exClass = env->FindClass("java/lang/IndexOutOfBoundsException");
        if (exClass != nullptr) {
            env->ThrowNew(exClass, e.what());
        }
    }

    env->ReleaseFloatArrayElements(data, body, JNI_ABORT);
    return status;
}

extern "C" JNIEXPORT void JNICALL
Java_com_auranexus_core_AuraNative_exportModel(JNIEnv *env, jobject thiz, jlong ptr, jstring path) {
    if (ptr == 0) {
        LOGE("exportModel Error: Core context pointer is null.");
        return;
    }
    if (path == nullptr) {
        LOGE("exportModel Error: Specified destination save path is null.");
        return;
    }

    CorePtr core = reinterpret_cast<CorePtr>(ptr);
    const char* utf_path = env->GetStringUTFChars(path, nullptr);
    if (utf_path == nullptr) {
        LOGE("Failed to extract UTF characters from Java path string.");
        return;
    }

    try {
        // Wrap path using SafeTensorView with bounds check (including null terminator)
        size_t path_len = std::strlen(utf_path);
        SafeTensorView<const char> path_view(utf_path, path_len + 1, true);

        // Call core static weight serialization
        export_weights_core(core, path_view.get_raw_ptr());
        LOGD("Java_com_auranexus_core_AuraNative_exportModel: weight tensors exported to %s", utf_path);
    } catch (const std::exception& e) {
        LOGE("Safe path view access failure caught in JNI exportModel: %s", e.what());
    }

    env->ReleaseStringUTFChars(path, utf_path);
}

extern "C" JNIEXPORT jfloatArray JNICALL
Java_com_auranexus_core_AuraNative_getWeights(JNIEnv *env, jobject thiz, jlong ptr) {
    if (ptr == 0) {
        LOGE("getWeights Error: Core context pointer is null.");
        return nullptr;
    }
    CorePtr core = reinterpret_cast<CorePtr>(ptr);
    int size = get_weights_size(core);
    if (size <= 0) {
        LOGE("getWeights Error: Weights size is zero or invalid.");
        return nullptr;
    }
    
    jfloatArray result = env->NewFloatArray(size);
    if (result == nullptr) {
        LOGE("getWeights Error: Failed to allocate float array.");
        return nullptr;
    }
    
    jfloat* body = env->GetFloatArrayElements(result, nullptr);
    if (body == nullptr) {
        LOGE("getWeights Error: Failed to get float array elements.");
        return nullptr;
    }
    
    int written = get_weights_data(core, body, size);
    env->ReleaseFloatArrayElements(result, body, 0);
    
    if (written != size) {
        LOGE("getWeights Warning: Weights written count (%d) mismatches size (%d).", written, size);
    }
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_auranexus_core_AuraNative_getMeta(JNIEnv *env, jobject thiz, jlong ptr) {
    if (ptr == 0) {
        LOGE("getMeta Error: Core context pointer is null.");
        return nullptr;
    }
    CorePtr core = reinterpret_cast<CorePtr>(ptr);
    
    jintArray result = env->NewIntArray(5);
    if (result == nullptr) {
        LOGE("getMeta Error: Failed to allocate int array.");
        return nullptr;
    }
    
    jint* body = env->GetIntArrayElements(result, nullptr);
    if (body == nullptr) {
        LOGE("getMeta Error: Failed to get int array elements.");
        return nullptr;
    }
    
    get_meta_data(core, body);
    env->ReleaseIntArrayElements(result, body, 0);
    return result;
}

extern "C" JNIEXPORT void JNICALL
Java_com_auranexus_core_AuraNative_destroy(JNIEnv *env, jobject thiz, jlong ptr) {
    if (ptr != 0) {
        CorePtr core = reinterpret_cast<CorePtr>(ptr);
        destroy_core(core);
        LOGD("Java_com_auranexus_core_AuraNative_destroy: Core clean deallocation completes successfully.");
    } else {
        LOGD("Java_com_auranexus_core_AuraNative_destroy: Warning, native pointer already zero.");
    }
}
