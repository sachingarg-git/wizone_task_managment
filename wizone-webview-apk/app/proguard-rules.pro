# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep MainActivity and its JavaScript interface
-keep class com.wizone.taskmanager.MainActivity$AndroidInterface {
    public *;
}

# Keep WebView related classes
-keep class android.webkit.** { *; }
-keep class androidx.webkit.** { *; }

# General Android rules
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

-dontwarn androidx.**
-dontwarn android.webkit.**