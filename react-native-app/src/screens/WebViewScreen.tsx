import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';

// Local development URL - change this to your local machine's IP address when testing on device
const LOCAL_URL = 'http://localhost:3001';
const REMOTE_URL = 'https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev/';

// For device testing, you'll need to use your computer's local IP address instead of localhost
// Example: const LOCAL_URL = 'http://192.168.1.100:3001';
const WEB_APP_URL = LOCAL_URL;

export default function WebViewScreen() {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webViewRef = React.useRef<WebView>(null);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  };

  const handleError = (error: any) => {
    console.log('WebView Error:', error);
    Alert.alert(
      'Connection Error',
      'Unable to load the portal. Make sure the server is running on localhost:3001 or check your connection.',
      [
        { text: 'Retry', onPress: reload },
        { text: 'OK' }
      ]
    );
  };

  const goBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const reload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Action
          icon="arrow-left"
          onPress={goBack}
          disabled={!canGoBack}
        />
        <Appbar.Action
          icon="arrow-right"
          onPress={goForward}
          disabled={!canGoForward}
        />
        <Appbar.Content title="Web Portal" />
        <Appbar.Action icon="refresh" onPress={reload} />
      </Appbar.Header>

      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#0891b2',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
});