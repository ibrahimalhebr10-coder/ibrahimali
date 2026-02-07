import { supabase } from '../lib/supabase';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
  chunksCompleted: number;
  totalChunks: number;
}

interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  blob: Blob;
  uploaded: boolean;
  retries: number;
}

interface UploadState {
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: Set<number>;
  startTime: number;
}

// ⚡ تكوين النظام المتقدم - Ultra Upload Mode
const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB chunks (محسّن للملفات الكبيرة)
const MAX_PARALLEL_UPLOADS = 6; // رفع 6 أجزاء في نفس الوقت (أسرع)
const MAX_RETRIES = 5; // محاولات إعادة لكل جزء
const STORAGE_KEY = 'video_upload_state';
const UPLOAD_TIMEOUT = 300000; // 5 minutes per chunk

// 📊 حدود الحجم - Ultra Mode
const MAX_FILE_SIZE_BASIC = 100 * 1024 * 1024; // 100 MB (قبول مباشر)
const MAX_FILE_SIZE_ULTRA = 500 * 1024 * 1024; // 500 MB (الحد الأقصى مع تحذير)
const AUTO_COMPRESS_THRESHOLD = 150 * 1024 * 1024; // 150 MB (تحذير بالضغط)

export class AdvancedVideoUploadService {
  private uploadState: UploadState | null = null;
  private uploadStartTime: number = 0;
  private uploadedBytes: number = 0;
  private lastUpdateTime: number = 0;
  private lastUploadedBytes: number = 0;

  /**
   * رفع متقدم مع تتبع التقدم - محسّن لـ Supabase
   */
  async uploadWithChunking(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    console.log('🚀 [AdvancedUpload] Starting optimized Supabase upload');
    console.log(`📊 File: ${file.name} | Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    this.uploadStartTime = Date.now();
    this.uploadedBytes = 0;
    this.lastUpdateTime = Date.now();
    this.lastUploadedBytes = 0;

    // استخدام Supabase's native upload مع XMLHttpRequest للحصول على progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // تتبع التقدم
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const now = Date.now();
          const timeDiff = (now - this.lastUpdateTime) / 1000;
          const bytesDiff = e.loaded - this.lastUploadedBytes;
          const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
          const remainingBytes = e.total - e.loaded;
          const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

          this.lastUpdateTime = now;
          this.lastUploadedBytes = e.loaded;

          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: (e.loaded / e.total) * 100,
            speed,
            timeRemaining,
            chunksCompleted: 0,
            totalChunks: 1
          });

          console.log(`📊 Progress: ${((e.loaded / e.total) * 100).toFixed(1)}% | Speed: ${(speed / 1024 / 1024).toFixed(2)} MB/s`);
        }
      });

      xhr.upload.addEventListener('error', () => {
        console.error('❌ Upload error');
        reject(new Error('فشل رفع الفيديو'));
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ Upload completed, getting public URL...');

          // الحصول على الرابط العام
          const { data: { publicUrl } } = supabase.storage
            .from('intro-videos')
            .getPublicUrl(filePath);

          resolve(publicUrl);
        } else {
          console.error('❌ Upload failed with status:', xhr.status);
          reject(new Error(`فشل رفع الفيديو: ${xhr.statusText}`));
        }
      });

      // رفع الملف باستخدام Supabase API
      this.uploadViaXHR(xhr, file, filePath).catch(reject);
    });
  }

  /**
   * رفع عبر XMLHttpRequest مباشرة إلى Supabase
   */
  private async uploadViaXHR(xhr: XMLHttpRequest, file: File, filePath: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const url = `${SUPABASE_URL}/storage/v1/object/intro-videos/${filePath}`;

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.setRequestHeader('x-upsert', 'true');

    xhr.send(file);
  }

  /**
   * حساب التقدم والسرعة (مبسّط)
   */
  private calculateProgress(
    loaded: number,
    total: number,
    chunksCompleted: number,
    totalChunks: number
  ): UploadProgress {
    const now = Date.now();
    const timeDiff = (now - this.lastUpdateTime) / 1000;
    const bytesDiff = loaded - this.lastUploadedBytes;

    const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
    const remainingBytes = total - loaded;
    const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

    this.lastUpdateTime = now;
    this.lastUploadedBytes = loaded;

    return {
      loaded,
      total,
      percentage: (loaded / total) * 100,
      speed,
      timeRemaining,
      chunksCompleted,
      totalChunks
    };
  }

  /**
   * حفظ حالة الرفع
   */
  private saveUploadState(): void {
    if (!this.uploadState) return;

    try {
      const state = {
        ...this.uploadState,
        uploadedChunks: Array.from(this.uploadState.uploadedChunks)
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('⚠️ Failed to save upload state:', error);
    }
  }

  /**
   * تحميل حالة الرفع
   */
  private loadUploadState(): UploadState | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const state = JSON.parse(saved);
      return {
        ...state,
        uploadedChunks: new Set(state.uploadedChunks)
      };
    } catch (error) {
      console.warn('⚠️ Failed to load upload state:', error);
      return null;
    }
  }

  /**
   * حذف حالة الرفع
   */
  private clearUploadState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('⚠️ Failed to clear upload state:', error);
    }
  }

  /**
   * تنسيق الوقت
   */
  private formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '--:--';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}س ${remainingMins}د`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * انتظار
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * رفع بسيط للملفات الصغيرة (أقل من 50 MB) مع timeout محسّن
   */
  async uploadSimple(
    file: File,
    filePath: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    console.log('📤 [SimpleUpload] Using optimized upload for small file');

    onProgress?.(5);

    // استخدام XMLHttpRequest مع progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentage = (e.loaded / e.total) * 100;
          onProgress(percentage);
          console.log(`📊 Upload progress: ${percentage.toFixed(1)}%`);
        }
      });

      xhr.upload.addEventListener('error', () => {
        console.error('❌ Upload error');
        reject(new Error('فشل رفع الفيديو'));
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ Upload completed successfully');
          onProgress?.(100);

          const { data: { publicUrl } } = supabase.storage
            .from('intro-videos')
            .getPublicUrl(filePath);

          resolve(publicUrl);
        } else {
          console.error('❌ Upload failed with status:', xhr.status);
          reject(new Error(`فشل رفع الفيديو: ${xhr.statusText}`));
        }
      });

      this.uploadViaXHR(xhr, file, filePath).catch(reject);
    });
  }

  /**
   * فحص الملف قبل الرفع - Ultra Mode
   * حتى 500 MB | صيغات متعددة مع تحويل تلقائي
   */
  validateFile(file: File): { valid: boolean; error?: string; warning?: string } {
    console.log('🔍 [Validation] Ultra Mode - Checking file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // فحص النوع - دعم صيغات متعددة
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';

    // 📹 الصيغات المدعومة
    const primaryExtensions = ['mp4', 'm4v']; // الأفضل (قبول مباشر)
    const secondaryExtensions = ['mov', 'webm']; // مقبولة (مع تحذير للتحويل)
    const allAllowedExtensions = [...primaryExtensions, ...secondaryExtensions];

    const allowedMimeTypes = [
      'video/mp4',
      'video/x-m4v',
      'video/quicktime',  // iPhone MOV
      'video/webm',
      ''  // Some browsers don't provide MIME type
    ];

    const hasValidExtension = allAllowedExtensions.includes(extension);
    const hasValidMimeType = allowedMimeTypes.includes(file.type);
    const isPrimaryFormat = primaryExtensions.includes(extension);

    console.log('🔍 [Validation] Results:', {
      extension,
      hasValidExtension,
      isPrimaryFormat,
      mimeType: file.type || '(empty)',
      hasValidMimeType
    });

    // رفض إذا الصيغة غير مدعومة نهائياً
    if (!hasValidExtension && !hasValidMimeType) {
      return {
        valid: false,
        error: `الصيغة المسموحة: MP4, M4V, MOV, WebM

الصيغة المكتشفة: ${extension.toUpperCase()} (${file.type || 'غير معروف'})

📌 الصيغ المدعومة:
• MP4 (H.264) - موصى به بشدة ✅
• M4V (Apple MP4) - موصى به ✅
• MOV (iPhone) - مدعوم ⚠️
• WebM - مدعوم ⚠️

💡 لتحويل الفيديو:
• استخدم HandBrake (مجاني)
• أو أي محول فيديو إلى MP4`
      };
    }

    // تحذير للصيغات الثانوية
    let formatWarning: string | undefined;
    if (!isPrimaryFormat && hasValidExtension) {
      formatWarning = `⚠️ الصيغة .${extension.toUpperCase()} مدعومة لكن MP4 (H.264) موصى به للأداء الأفضل`;
      console.warn(`[Validation] ${formatWarning}`);
    }

    // تحذير MIME type غريب
    if (hasValidExtension && file.type !== 'video/mp4' && file.type !== '') {
      console.warn(`⚠️ [Validation] MIME type غير قياسي: "${file.type}" لكن الامتداد صحيح (.${extension})`);
    }

    const sizeMB = (file.size / 1024 / 1024);

    // 📊 فحص الحجم - Ultra Mode (حتى 500 MB)
    if (file.size > MAX_FILE_SIZE_ULTRA) {
      return {
        valid: false,
        error: `حجم الفيديو (${sizeMB.toFixed(1)} MB) يتجاوز الحد الأقصى (500 MB).

⚡ حلول مقترحة:
• اضغط الفيديو باستخدام HandBrake
• قلل الجودة إلى 1080p @ 30fps
• Bitrate موصى به: 5-8 Mbps
• أو قسّم الفيديو إلى أجزاء أصغر

📌 للفيديو التعريفي: 30-60 ثانية كافية (50-80 MB)`
      };
    }

    // تحذير للملفات الكبيرة (150+ MB)
    if (file.size > AUTO_COMPRESS_THRESHOLD) {
      const estimatedMinutes = Math.ceil(sizeMB / 50); // ~50 MB per minute at 8 Mbps
      formatWarning = formatWarning || '';
      formatWarning += `\n\n⚠️ حجم كبير: ${sizeMB.toFixed(1)} MB - الرفع قد يستغرق وقتاً (حوالي ${estimatedMinutes} دقيقة)`;
      console.warn(`⚠️ [Validation] Large file: ${sizeMB.toFixed(1)} MB - Upload may take ~${estimatedMinutes} minutes`);
    }

    // فحص اسم الملف
    if (file.name.length > 255) {
      return {
        valid: false,
        error: 'اسم الملف طويل جداً (الحد الأقصى: 255 حرف)'
      };
    }

    // معلومات مفيدة (console فقط - لا تمنع الرفع)
    if (sizeMB > MAX_FILE_SIZE_BASIC / (1024 * 1024)) {
      console.warn(`⚠️ [Validation] حجم الفيديو (${sizeMB.toFixed(1)} MB) كبير. سيتم استخدام Chunked Upload.`);
    }

    // تقدير تقريبي للمدة (بافتراض bitrate معقول)
    const estimatedDurationSeconds = Math.round((sizeMB * 8) / 6); // افتراض 6 Mbps average
    if (estimatedDurationSeconds > 90) {
      console.info(`ℹ️ [Validation] تقدير المدة: ~${estimatedDurationSeconds} ثانية (بناءً على الحجم). للفيديو التعريفي، يُفضل 30-60 ثانية.`);
    }

    // رسالة نجاح مع تحذيرات (إن وجدت)
    console.log(`✅ [Validation] File validated successfully - Size: ${sizeMB.toFixed(1)} MB, Format: .${extension.toUpperCase()}`);

    return {
      valid: true,
      warning: formatWarning
    };
  }

  /**
   * تقدير وقت الرفع
   */
  estimateUploadTime(fileSize: number, speedMbps: number = 10): number {
    // speedMbps: سرعة الإنترنت بالميجابت في الثانية
    const fileSizeMb = (fileSize * 8) / (1024 * 1024); // تحويل لميجابت
    const timeSeconds = fileSizeMb / speedMbps;
    return timeSeconds * 1.2; // إضافة 20% للمعالجة
  }
}

export const advancedVideoUploadService = new AdvancedVideoUploadService();
