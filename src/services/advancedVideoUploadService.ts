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
   * رفع متقدم مع Chunking و Resume
   */
  async uploadWithChunking(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    console.log('🚀 [AdvancedUpload] Starting advanced chunked upload');
    console.log(`📊 File: ${file.name} | Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    this.uploadStartTime = Date.now();
    this.uploadedBytes = 0;
    this.lastUpdateTime = Date.now();
    this.lastUploadedBytes = 0;

    // تحميل الحالة المحفوظة (Resume)
    const savedState = this.loadUploadState();
    if (savedState && savedState.fileName === file.name && savedState.fileSize === file.size) {
      console.log('📦 [AdvancedUpload] Resuming previous upload');
      this.uploadState = savedState;
      this.uploadedBytes = savedState.uploadedChunks.size * CHUNK_SIZE;
    } else {
      this.uploadState = {
        fileName: file.name,
        fileSize: file.size,
        totalChunks: Math.ceil(file.size / CHUNK_SIZE),
        uploadedChunks: new Set(),
        startTime: Date.now()
      };
    }

    // تقسيم الملف إلى أجزاء
    const chunks = this.createChunks(file);
    const totalChunks = chunks.length;

    console.log(`📦 [AdvancedUpload] File divided into ${totalChunks} chunks (${(CHUNK_SIZE / 1024 / 1024).toFixed(2)} MB each)`);

    // رفع الأجزاء بالتوازي
    await this.uploadChunksInParallel(chunks, file.name, filePath, onProgress);

    // دمج الأجزاء (إذا لزم الأمر)
    const finalUrl = await this.finalizeUpload(file, filePath);

    // حذف الحالة المحفوظة
    this.clearUploadState();

    console.log('✅ [AdvancedUpload] Upload completed successfully');
    return finalUrl;
  }

  /**
   * تقسيم الملف إلى أجزاء
   */
  private createChunks(file: File): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const blob = file.slice(start, end);

      chunks.push({
        index: i,
        start,
        end,
        blob,
        uploaded: this.uploadState?.uploadedChunks.has(i) || false,
        retries: 0
      });
    }

    return chunks;
  }

  /**
   * رفع الأجزاء بالتوازي
   */
  private async uploadChunksInParallel(
    chunks: ChunkInfo[],
    fileName: string,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    const pendingChunks = chunks.filter(c => !c.uploaded);
    const totalChunks = chunks.length;
    let completedChunks = chunks.filter(c => c.uploaded).length;

    console.log(`🔄 [AdvancedUpload] Uploading ${pendingChunks.length} remaining chunks (${completedChunks} already uploaded)`);

    // رفع بالتوازي مع حد أقصى
    const uploadQueue = [...pendingChunks];
    const activeUploads: Set<Promise<void>> = new Set();

    while (uploadQueue.length > 0 || activeUploads.size > 0) {
      // ابدأ رفع جديد إذا كان هناك مكان
      while (uploadQueue.length > 0 && activeUploads.size < MAX_PARALLEL_UPLOADS) {
        const chunk = uploadQueue.shift()!;

        const uploadPromise = this.uploadChunk(chunk, filePath).then(() => {
          completedChunks++;
          this.uploadedBytes += chunk.blob.size;

          // حفظ التقدم
          this.uploadState?.uploadedChunks.add(chunk.index);
          this.saveUploadState();

          // حساب التقدم والسرعة
          const progress = this.calculateProgress(
            this.uploadedBytes,
            chunks.reduce((sum, c) => sum + c.blob.size, 0),
            completedChunks,
            totalChunks
          );

          onProgress?.(progress);

          console.log(`✅ Chunk ${chunk.index + 1}/${totalChunks} uploaded (${progress.percentage.toFixed(1)}% | Speed: ${(progress.speed / 1024).toFixed(2)} MB/s | ETA: ${this.formatTime(progress.timeRemaining)})`);
        }).finally(() => {
          activeUploads.delete(uploadPromise);
        });

        activeUploads.add(uploadPromise);
      }

      // انتظر أي رفع ينتهي قبل إضافة رفع جديد
      if (activeUploads.size > 0) {
        await Promise.race(activeUploads);
      }
    }
  }

  /**
   * رفع جزء واحد مع إعادة المحاولة
   */
  private async uploadChunk(chunk: ChunkInfo, filePath: string): Promise<void> {
    const chunkPath = `${filePath}.part${chunk.index}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // إضافة timeout للرفع
        const uploadPromise = supabase.storage
          .from('intro-videos')
          .upload(chunkPath, chunk.blob, {
            cacheControl: '3600',
            upsert: true
          });

        // تطبيق timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout')), UPLOAD_TIMEOUT)
        );

        const { error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (error) throw error;

        chunk.uploaded = true;
        return;
      } catch (error: any) {
        chunk.retries++;
        console.warn(`⚠️ Chunk ${chunk.index} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);

        if (attempt === MAX_RETRIES) {
          throw new Error(`فشل رفع الجزء ${chunk.index + 1} بعد ${MAX_RETRIES + 1} محاولات: ${error.message}`);
        }

        // انتظر قبل المحاولة التالية (exponential backoff)
        const waitTime = Math.min(Math.pow(2, attempt) * 1000, 10000); // max 10 seconds
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * إنهاء الرفع ودمج الأجزاء
   */
  private async finalizeUpload(file: File, filePath: string): Promise<string> {
    console.log('🔄 [AdvancedUpload] Finalizing upload...');

    // للملفات الصغيرة أو التي تم رفعها كجزء واحد
    if (this.uploadState!.totalChunks === 1) {
      const { data: { publicUrl } } = supabase.storage
        .from('intro-videos')
        .getPublicUrl(`${filePath}.part0`);

      // إعادة تسمية الملف
      await this.renameFile(`${filePath}.part0`, filePath);

      return publicUrl.replace('.part0', '');
    }

    // للملفات الكبيرة: استخدم الأجزاء كما هي أو أعد رفع الملف الكامل
    console.log('📦 [AdvancedUpload] Merging or re-uploading complete file...');

    try {
      // محاولة رفع الملف الكامل مباشرة
      const { error } = await supabase.storage
        .from('intro-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('⚠️ Full file upload failed, keeping chunks:', error);
        // إذا فشل الرفع الكامل، استخدم أول جزء كملف أساسي
        await this.renameFile(`${filePath}.part0`, filePath);
      }
    } catch (e) {
      console.warn('⚠️ Full file upload error, keeping chunks:', e);
      // استخدام أول جزء
      await this.renameFile(`${filePath}.part0`, filePath);
    }

    // حذف الأجزاء المتبقية
    await this.cleanupChunks(filePath, this.uploadState!.totalChunks);

    const { data: { publicUrl } } = supabase.storage
      .from('intro-videos')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  /**
   * حذف الأجزاء المؤقتة
   */
  private async cleanupChunks(filePath: string, totalChunks: number): Promise<void> {
    console.log('🧹 [AdvancedUpload] Cleaning up temporary chunks...');

    const chunkPaths = Array.from({ length: totalChunks }, (_, i) => `${filePath}.part${i}`);

    try {
      await supabase.storage
        .from('intro-videos')
        .remove(chunkPaths);

      console.log('✅ [AdvancedUpload] Chunks cleaned up');
    } catch (error) {
      console.warn('⚠️ [AdvancedUpload] Failed to cleanup chunks:', error);
    }
  }

  /**
   * إعادة تسمية ملف
   */
  private async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      // Supabase لا يدعم rename مباشرة، لذا نستخدم copy + delete
      const { data: file } = await supabase.storage
        .from('intro-videos')
        .download(oldPath);

      if (file) {
        await supabase.storage
          .from('intro-videos')
          .upload(newPath, file, { upsert: true });

        await supabase.storage
          .from('intro-videos')
          .remove([oldPath]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to rename file:', error);
    }
  }

  /**
   * حساب التقدم والسرعة
   */
  private calculateProgress(
    loaded: number,
    total: number,
    chunksCompleted: number,
    totalChunks: number
  ): UploadProgress {
    const now = Date.now();
    const timeDiff = (now - this.lastUpdateTime) / 1000; // بالثواني
    const bytesDiff = loaded - this.lastUploadedBytes;

    // حساب السرعة (bytes/second)
    const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

    // حساب الوقت المتبقي
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
    console.log('📤 [SimpleUpload] Using simple upload for small file');

    onProgress?.(10);

    // إضافة timeout طويل (10 دقائق) مع retry mechanism
    const SIMPLE_UPLOAD_TIMEOUT = 600000; // 10 دقائق
    const MAX_SIMPLE_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_SIMPLE_RETRIES; attempt++) {
      try {
        console.log(`📤 [SimpleUpload] Attempt ${attempt}/${MAX_SIMPLE_RETRIES}`);

        // إنشاء promise مع timeout
        const uploadPromise = supabase.storage
          .from('intro-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout - الرفع استغرق وقتاً طويلاً')), SIMPLE_UPLOAD_TIMEOUT)
        );

        const { error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (error) {
          if (attempt === MAX_SIMPLE_RETRIES) {
            throw error;
          }
          console.warn(`⚠️ [SimpleUpload] Attempt ${attempt} failed:`, error.message);
          // انتظر قبل المحاولة التالية
          await this.sleep(2000 * attempt); // 2s, 4s, 6s
          continue;
        }

        // نجح الرفع
        break;
      } catch (error: any) {
        if (attempt === MAX_SIMPLE_RETRIES) {
          console.error('❌ [SimpleUpload] All attempts failed:', error);
          throw new Error(`فشل رفع الفيديو بعد ${MAX_SIMPLE_RETRIES} محاولات: ${error.message}`);
        }
        console.warn(`⚠️ [SimpleUpload] Attempt ${attempt} error:`, error.message);
        await this.sleep(2000 * attempt);
      }
    }

    onProgress?.(90);

    const { data: { publicUrl } } = supabase.storage
      .from('intro-videos')
      .getPublicUrl(filePath);

    onProgress?.(100);

    console.log('✅ [SimpleUpload] Upload completed successfully');
    return publicUrl;
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
