# 📱 APK BACKEND URL UPDATE करने के लिए FILES की LOCATION

## 🎯 **मुख्य Files जहाँ Backend URL Hardcoded हैं:**

### **1. mobile/index.html - मुख्य Mobile APK File**
```javascript
// Lines 84-88
const PRODUCTION_SERVER = 'http://194.238.19.19:5000';
const FALLBACK_SERVERS = [
    'http://194.238.19.19:5000',
    'https://194.238.19.19:5000'
];
```

### **2. mobile/src/utils/mobile-network.ts - Network Configuration**
```javascript
// Lines 28-53
this.baseUrls = [
    // Production server (PRIMARY)
    'http://194.238.19.19:5000',
    
    // Backup production servers
    'http://YOUR_ACTUAL_SERVER_IP:5000',
    
    // Common local network IP ranges (fallback)
    'http://192.168.1.100:5000',
    'http://192.168.0.100:5000',
    // ... और भी URLs
];
```

### **3. mobile/src/utils/api.ts - API Configuration**
```javascript
// Line 30
return 'http://localhost:5000';  // Development URL
```

### **4. mobile/connection-test.html - Test Page**
```javascript
// Line 47
const SERVER_URL = 'http://194.238.19.19:5000';
```

---

## 🔧 **आपको ये CHANGES करने होंगे:**

### **Step 1: mobile/index.html में Update करें**
```javascript
// Replace इन lines को (Lines 84-88):
const PRODUCTION_SERVER = 'http://194.238.19.19:5000';
const FALLBACK_SERVERS = [
    'http://194.238.19.19:5000',
    'https://194.238.19.19:5000'
];

// आपके VPS URL से:
const PRODUCTION_SERVER = 'http://YOUR_VPS_IP:5000';
const FALLBACK_SERVERS = [
    'http://YOUR_VPS_IP:5000',
    'https://YOUR_VPS_IP:5000'
];
```

### **Step 2: mobile/src/utils/mobile-network.ts में Update करें**
```javascript
// Replace line 30:
'http://194.238.19.19:5000',

// आपके VPS URL से:
'http://YOUR_VPS_IP:5000',

// और line 36 भी update करें:
'http://YOUR_ACTUAL_SERVER_IP:5000',
// को
'http://YOUR_VPS_IP:5000',
```

### **Step 3: mobile/src/utils/api.ts में Update करें (अगर जरूरत हो)**
```javascript
// Line 30 में अगर production URL chahiye:
return 'http://YOUR_VPS_IP:5000';
```

---

## 📝 **EXACT CHANGES का Example:**

### **अगर आपका VPS IP है: 192.168.1.50**

#### **mobile/index.html में:**
```javascript
const PRODUCTION_SERVER = 'http://192.168.1.50:5000';
const FALLBACK_SERVERS = [
    'http://192.168.1.50:5000',
    'https://192.168.1.50:5000'
];
```

#### **mobile/src/utils/mobile-network.ts में:**
```javascript
this.baseUrls = [
    // Production server (PRIMARY)
    'http://192.168.1.50:5000',
    
    // Backup production servers  
    'http://192.168.1.50:5000',
    
    // ... बाकी URLs same रख सकते हैं
];
```

---

## 🚀 **APK Build करने के बाद Expected Behavior:**

### **Before Change:**
```
Mobile APK → http://194.238.19.19:5000 → Login attempt
```

### **After Change:**
```
Mobile APK → http://YOUR_VPS_IP:5000 → Login attempt
```

---

## 🧪 **Changes Test करने का तरीका:**

### **Step 1: Files Update करें**
```bash  
# ऊपर बताई गई files में URLs change करें
```

### **Step 2: APK Rebuild करें**
```bash
# Android Studio या APK builder से rebuild करें
```

### **Step 3: Test करें**
```bash
# APK install करके देखें कि कौन सा server URL use हो रहा
# Browser DevTools में Console logs check करें
```

---

## 📍 **Files की Priority Order:**

### **Most Important (जरूर update करें):**
1. `mobile/index.html` - Line 84-88
2. `mobile/src/utils/mobile-network.ts` - Line 30

### **Optional (अगर जरूरत हो):**
3. `mobile/src/utils/api.ts` - Line 30
4. `mobile/connection-test.html` - Line 47 (testing के लिए)

---

**सबसे important है `mobile/index.html` file क्योंकि यही main mobile APK file है जो install होती है।**