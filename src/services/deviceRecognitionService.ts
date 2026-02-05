export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  isMobile: boolean;
  timestamp: number;
}

class DeviceRecognitionService {
  private readonly DEVICE_KEY = 'farm-device-fingerprint';
  private readonly TRUSTED_DEVICE_KEY = 'farm-trusted-device';
  private readonly REMEMBER_ME_KEY = 'farm-remember-me';

  generateFingerprint(): DeviceFingerprint {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    return {
      id: this.generateDeviceId(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      isMobile,
      timestamp: Date.now()
    };
  }

  private generateDeviceId(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.platform
    ];

    const fingerprint = components.join('|');
    return this.hashCode(fingerprint).toString();
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  saveDeviceFingerprint(fingerprint: DeviceFingerprint): void {
    localStorage.setItem(this.DEVICE_KEY, JSON.stringify(fingerprint));
  }

  getDeviceFingerprint(): DeviceFingerprint | null {
    const stored = localStorage.getItem(this.DEVICE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  markAsTrustedDevice(): void {
    localStorage.setItem(this.TRUSTED_DEVICE_KEY, 'true');
    localStorage.setItem(`${this.TRUSTED_DEVICE_KEY}-timestamp`, Date.now().toString());
  }

  isTrustedDevice(): boolean {
    return localStorage.getItem(this.TRUSTED_DEVICE_KEY) === 'true';
  }

  removeTrustedDevice(): void {
    localStorage.removeItem(this.TRUSTED_DEVICE_KEY);
    localStorage.removeItem(`${this.TRUSTED_DEVICE_KEY}-timestamp`);
  }

  setRememberMe(remember: boolean): void {
    if (remember) {
      localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
  }

  getRememberMe(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  isDeviceRecognized(): boolean {
    const fingerprint = this.getDeviceFingerprint();
    if (!fingerprint) return false;

    const currentFingerprint = this.generateFingerprint();

    return (
      fingerprint.id === currentFingerprint.id &&
      fingerprint.userAgent === currentFingerprint.userAgent &&
      fingerprint.platform === currentFingerprint.platform
    );
  }

  getDeviceInfo(): {
    isMobile: boolean;
    isTrusted: boolean;
    isRecognized: boolean;
    rememberMe: boolean;
  } {
    const fingerprint = this.getDeviceFingerprint();

    return {
      isMobile: fingerprint?.isMobile || false,
      isTrusted: this.isTrustedDevice(),
      isRecognized: this.isDeviceRecognized(),
      rememberMe: this.getRememberMe()
    };
  }

  clearDeviceData(): void {
    localStorage.removeItem(this.DEVICE_KEY);
    localStorage.removeItem(this.TRUSTED_DEVICE_KEY);
    localStorage.removeItem(`${this.TRUSTED_DEVICE_KEY}-timestamp`);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
  }
}

export const deviceRecognitionService = new DeviceRecognitionService();
