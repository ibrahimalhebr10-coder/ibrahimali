/**
 * Diagnostic utility for debugging farm loading issues on mobile/iPhone
 */

export interface DiagnosticReport {
  timestamp: string;
  device: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
    isIOS: boolean;
    isIPhone: boolean;
    screenWidth: number;
    screenHeight: number;
  };
  browser: {
    name: string;
    version: string;
    isSafari: boolean;
  };
  connection: {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  storage: {
    localStorageAvailable: boolean;
    localStorageSize: number;
    cacheExists: boolean;
    cacheAge?: number;
  };
  supabase: {
    connected: boolean;
    error?: string;
  };
  rendering: {
    loading: boolean;
    categoriesCount: number;
    farmsCount: number;
    currentCategory: string;
    currentFarmsCount: number;
  };
}

export const diagnostics = {
  /**
   * Detect device information
   */
  getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      platform: navigator.platform,
      isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(ua),
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isIPhone: /iPhone/i.test(ua),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
  },

  /**
   * Detect browser information
   */
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browserName = 'Safari';
      const match = ua.match(/Version\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      const match = ua.match(/Chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    return {
      name: browserName,
      version: browserVersion,
      isSafari: browserName === 'Safari',
    };
  },

  /**
   * Check network connection
   */
  getConnectionInfo() {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  },

  /**
   * Check localStorage and cache
   */
  getStorageInfo() {
    let localStorageAvailable = false;
    let localStorageSize = 0;
    let cacheExists = false;
    let cacheAge: number | undefined;

    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      localStorageAvailable = true;

      // Calculate localStorage size
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      localStorageSize = total;

      // Check cache
      const cached = localStorage.getItem('farms_cache_v2');
      if (cached) {
        cacheExists = true;
        const cache = JSON.parse(cached);
        cacheAge = Date.now() - cache.timestamp;
      }
    } catch (e) {
      console.error('[Diagnostics] localStorage error:', e);
    }

    return {
      localStorageAvailable,
      localStorageSize,
      cacheExists,
      cacheAge,
    };
  },

  /**
   * Test Supabase connection
   */
  async testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('farms')
        .select('id')
        .limit(1);

      if (error) {
        return { connected: false, error: error.message };
      }

      return { connected: true };
    } catch (e: any) {
      return { connected: false, error: e.message };
    }
  },

  /**
   * Generate full diagnostic report
   */
  async generateReport(appState: {
    loading: boolean;
    categoriesCount: number;
    farmsCount: number;
    currentCategory: string;
    currentFarmsCount: number;
  }): Promise<DiagnosticReport> {
    const device = this.getDeviceInfo();
    const browser = this.getBrowserInfo();
    const connection = this.getConnectionInfo();
    const storage = this.getStorageInfo();
    const supabase = await this.testSupabaseConnection();

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      device,
      browser,
      connection,
      storage,
      supabase,
      rendering: appState,
    };

    return report;
  },

  /**
   * Print diagnostic report to console
   */
  printReport(report: DiagnosticReport) {
    console.log('');
    console.log('🔍'.repeat(50));
    console.log('🔍 DIAGNOSTIC REPORT');
    console.log('🔍'.repeat(50));
    console.log('');

    console.group('📱 Device Information');
    console.log('User Agent:', report.device.userAgent);
    console.log('Platform:', report.device.platform);
    console.log('Is Mobile:', report.device.isMobile ? '✅ YES' : '❌ NO');
    console.log('Is iOS:', report.device.isIOS ? '✅ YES' : '❌ NO');
    console.log('Is iPhone:', report.device.isIPhone ? '✅ YES' : '❌ NO');
    console.log('Screen:', `${report.device.screenWidth}x${report.device.screenHeight}`);
    console.groupEnd();

    console.log('');
    console.group('🌐 Browser Information');
    console.log('Browser:', report.browser.name, report.browser.version);
    console.log('Is Safari:', report.browser.isSafari ? '✅ YES' : '❌ NO');
    console.groupEnd();

    console.log('');
    console.group('📡 Network Connection');
    console.log('Online:', report.connection.online ? '✅ YES' : '❌ NO');
    console.log('Type:', report.connection.effectiveType || 'Unknown');
    console.log('Speed:', report.connection.downlink ? `${report.connection.downlink} Mbps` : 'Unknown');
    console.log('Latency:', report.connection.rtt ? `${report.connection.rtt}ms` : 'Unknown');
    console.groupEnd();

    console.log('');
    console.group('💾 Storage');
    console.log('localStorage Available:', report.storage.localStorageAvailable ? '✅ YES' : '❌ NO');
    console.log('localStorage Size:', `${Math.round(report.storage.localStorageSize / 1024)}KB`);
    console.log('Cache Exists:', report.storage.cacheExists ? '✅ YES' : '❌ NO');
    if (report.storage.cacheAge !== undefined) {
      console.log('Cache Age:', `${Math.round(report.storage.cacheAge / 1000)}s`);
    }
    console.groupEnd();

    console.log('');
    console.group('🗄️ Supabase');
    console.log('Connected:', report.supabase.connected ? '✅ YES' : '❌ NO');
    if (report.supabase.error) {
      console.error('Error:', report.supabase.error);
    }
    console.groupEnd();

    console.log('');
    console.group('🎨 Rendering State');
    console.log('Loading:', report.rendering.loading ? '⏳ YES' : '✅ NO');
    console.log('Categories:', report.rendering.categoriesCount);
    console.log('Total Farms:', report.rendering.farmsCount);
    console.log('Current Category:', report.rendering.currentCategory);
    console.log('Current Farms:', report.rendering.currentFarmsCount);
    console.groupEnd();

    console.log('');
    console.log('🔍'.repeat(50));
    console.log('');

    // Analyze problems
    const problems: string[] = [];

    if (!report.connection.online) {
      problems.push('❌ Device is OFFLINE');
    }

    if (!report.storage.localStorageAvailable) {
      problems.push('❌ localStorage is NOT available (Safari private mode?)');
    }

    if (!report.supabase.connected) {
      problems.push(`❌ Supabase connection FAILED: ${report.supabase.error}`);
    }

    if (report.rendering.categoriesCount === 0) {
      problems.push('❌ NO categories loaded');
    }

    if (report.rendering.farmsCount === 0) {
      problems.push('❌ NO farms loaded');
    }

    if (report.rendering.currentFarmsCount === 0 && !report.rendering.loading) {
      problems.push('❌ Current farms is EMPTY (this causes blank screen)');
    }

    if (problems.length > 0) {
      console.log('⚠️'.repeat(50));
      console.log('⚠️ PROBLEMS DETECTED:');
      problems.forEach(problem => console.log(problem));
      console.log('⚠️'.repeat(50));
      console.log('');
    } else {
      console.log('✅'.repeat(50));
      console.log('✅ No obvious problems detected');
      console.log('✅'.repeat(50));
      console.log('');
    }
  },

  /**
   * Save report to localStorage for later analysis
   */
  saveReport(report: DiagnosticReport) {
    try {
      const reports = JSON.parse(localStorage.getItem('diagnostic_reports') || '[]');
      reports.push(report);
      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.shift();
      }
      localStorage.setItem('diagnostic_reports', JSON.stringify(reports));
      console.log('✅ [Diagnostics] Report saved to localStorage');
    } catch (e) {
      console.error('❌ [Diagnostics] Failed to save report:', e);
    }
  },

  /**
   * Get all saved reports
   */
  getSavedReports(): DiagnosticReport[] {
    try {
      return JSON.parse(localStorage.getItem('diagnostic_reports') || '[]');
    } catch (e) {
      console.error('❌ [Diagnostics] Failed to get saved reports:', e);
      return [];
    }
  },

  /**
   * Clear all saved reports
   */
  clearSavedReports() {
    try {
      localStorage.removeItem('diagnostic_reports');
      console.log('✅ [Diagnostics] All reports cleared');
    } catch (e) {
      console.error('❌ [Diagnostics] Failed to clear reports:', e);
    }
  },
};

// Make diagnostics available globally for easy access in console
if (typeof window !== 'undefined') {
  (window as any).diagnostics = diagnostics;
}
