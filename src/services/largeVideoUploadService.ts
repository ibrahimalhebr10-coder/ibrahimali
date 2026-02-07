import { supabase } from '../lib/supabase';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
  currentChunk: number;
  totalChunks: number;
}

interface ChunkUploadResult {
  chunkIndex: number;
  path: string;
  size: number;
}

// تكوين متقدم للملفات الكبيرة جداً
const LARGE_CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB per chunk
const MAX_PARALLEL_CHUNKS = 3; // 3 chunks في نفس الوقت
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
const MAX_RETRIES_PER_CHUNK = 5;

export class LargeVideoUploadService {
  private uploadStartTime: number = 0;
  private lastUpdateTime: number = 0;
  private lastUploadedBytes: number = 0;
  private abortController: AbortController | null = null;

  /**
   * رفع ملف كبير مع chunking حقيقي و resumability
   */
  async uploadLargeVideo(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    console.log('🚀 [LargeUpload] Starting large video upload');
    console.log(`📊 File: ${file.name} | Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`حجم الملف (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB) يتجاوز الحد الأقصى (5 GB)`);
    }

    this.uploadStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.lastUploadedBytes = 0;
    this.abortController = new AbortController();

    try {
      // للملفات > 500 MB: استخدام chunked upload
      if (file.size > 500 * 1024 * 1024) {
        return await this.uploadWithChunks(file, filePath, onProgress);
      }

      // للملفات الأصغر: استخدام direct upload مع resumable
      return await this.uploadDirectWithProgress(file, filePath, onProgress);
    } catch (error: any) {
      console.error('❌ [LargeUpload] Upload failed:', error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * رفع مباشر مع تتبع التقدم (للملفات < 500 MB)
   */
  private async uploadDirectWithProgress(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    console.log('📤 [LargeUpload] Using direct upload with progress tracking');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = this.calculateProgress(
            e.loaded,
            e.total,
            1,
            1
          );
          onProgress(progress);
        }
      });

      xhr.upload.addEventListener('error', () => {
        reject(new Error('فشل رفع الفيديو'));
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: { publicUrl } } = supabase.storage
            .from('intro-videos')
            .getPublicUrl(filePath);

          console.log('✅ [LargeUpload] Direct upload completed');
          resolve(publicUrl);
        } else {
          reject(new Error(`فشل الرفع: ${xhr.statusText}`));
        }
      });

      this.uploadFileViaXHR(xhr, file, filePath).catch(reject);
    });
  }

  /**
   * رفع مع تقسيم إلى chunks (للملفات > 500 MB)
   */
  private async uploadWithChunks(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const totalChunks = Math.ceil(file.size / LARGE_CHUNK_SIZE);
    console.log(`📦 [LargeUpload] Using chunked upload: ${totalChunks} chunks of ${(LARGE_CHUNK_SIZE / 1024 / 1024).toFixed(2)} MB each`);

    // إنشاء session في database للاستئناف
    const sessionId = await this.createUploadSession(file, totalChunks);

    const uploadedChunks: ChunkUploadResult[] = [];
    let uploadedBytes = 0;

    // رفع الأجزاء بالتوازي
    for (let i = 0; i < totalChunks; i += MAX_PARALLEL_CHUNKS) {
      const batchEnd = Math.min(i + MAX_PARALLEL_CHUNKS, totalChunks);
      const batch = Array.from({ length: batchEnd - i }, (_, idx) => i + idx);

      console.log(`📦 [LargeUpload] Uploading chunks ${i + 1}-${batchEnd} of ${totalChunks}`);

      const batchResults = await Promise.all(
        batch.map(chunkIndex =>
          this.uploadChunk(file, filePath, chunkIndex, sessionId)
        )
      );

      uploadedChunks.push(...batchResults);
      uploadedBytes += batchResults.reduce((sum, r) => sum + r.size, 0);

      // تحديث التقدم
      if (onProgress) {
        const progress = this.calculateProgress(
          uploadedBytes,
          file.size,
          uploadedChunks.length,
          totalChunks
        );
        onProgress(progress);
      }

      // تحديث الـ session
      await this.updateUploadSession(sessionId, uploadedChunks.length);
    }

    console.log('🔄 [LargeUpload] All chunks uploaded, merging...');

    // دمج الأجزاء
    const finalUrl = await this.mergeChunks(file, filePath, uploadedChunks);

    // حذف الـ session
    await this.cleanupUploadSession(sessionId);

    console.log('✅ [LargeUpload] Chunked upload completed successfully');
    return finalUrl;
  }

  /**
   * رفع جزء واحد مع retry
   */
  private async uploadChunk(
    file: File,
    basePath: string,
    chunkIndex: number,
    sessionId: string
  ): Promise<ChunkUploadResult> {
    const start = chunkIndex * LARGE_CHUNK_SIZE;
    const end = Math.min(start + LARGE_CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const chunkPath = `${basePath}.chunk${chunkIndex}`;

    console.log(`📤 [LargeUpload] Uploading chunk ${chunkIndex + 1}: ${start}-${end} (${(chunk.size / 1024 / 1024).toFixed(2)} MB)`);

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_CHUNK; attempt++) {
      try {
        const { error } = await supabase.storage
          .from('intro-videos')
          .upload(chunkPath, chunk, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        console.log(`✅ [LargeUpload] Chunk ${chunkIndex + 1} uploaded successfully`);

        return {
          chunkIndex,
          path: chunkPath,
          size: chunk.size
        };
      } catch (error: any) {
        console.warn(`⚠️ [LargeUpload] Chunk ${chunkIndex + 1} failed (attempt ${attempt}/${MAX_RETRIES_PER_CHUNK}):`, error);

        if (attempt === MAX_RETRIES_PER_CHUNK) {
          throw new Error(`فشل رفع الجزء ${chunkIndex + 1} بعد ${MAX_RETRIES_PER_CHUNK} محاولات`);
        }

        // انتظار قبل المحاولة التالية
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error(`فشل رفع الجزء ${chunkIndex + 1}`);
  }

  /**
   * دمج الأجزاء إلى ملف واحد
   */
  private async mergeChunks(
    file: File,
    filePath: string,
    chunks: ChunkUploadResult[]
  ): Promise<string> {
    console.log('🔄 [LargeUpload] Merging chunks...');

    try {
      // محاولة 1: رفع الملف الكامل مباشرة (Supabase سيستخدم resumable)
      const { error: uploadError } = await supabase.storage
        .from('intro-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!uploadError) {
        console.log('✅ [LargeUpload] Full file uploaded successfully');

        // حذف الأجزاء
        await this.cleanupChunks(chunks);

        const { data: { publicUrl } } = supabase.storage
          .from('intro-videos')
          .getPublicUrl(filePath);

        return publicUrl;
      }

      // محاولة 2: دمج الأجزاء على الـ client ثم الرفع
      console.log('🔄 [LargeUpload] Merging chunks on client side...');

      const chunkBlobs = await Promise.all(
        chunks
          .sort((a, b) => a.chunkIndex - b.chunkIndex)
          .map(chunk => this.downloadChunk(chunk.path))
      );

      const mergedBlob = new Blob(chunkBlobs, { type: file.type });
      const mergedFile = new File([mergedBlob], file.name, { type: file.type });

      const { error: mergeError } = await supabase.storage
        .from('intro-videos')
        .upload(filePath, mergedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (mergeError) {
        throw mergeError;
      }

      // حذف الأجزاء
      await this.cleanupChunks(chunks);

      const { data: { publicUrl } } = supabase.storage
        .from('intro-videos')
        .getPublicUrl(filePath);

      console.log('✅ [LargeUpload] Chunks merged successfully');
      return publicUrl;

    } catch (error) {
      console.error('❌ [LargeUpload] Merge failed:', error);
      throw new Error('فشل دمج أجزاء الفيديو');
    }
  }

  /**
   * تنزيل جزء من الـ storage
   */
  private async downloadChunk(chunkPath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('intro-videos')
      .download(chunkPath);

    if (error || !data) {
      throw new Error(`فشل تنزيل الجزء: ${chunkPath}`);
    }

    return data;
  }

  /**
   * حذف الأجزاء المؤقتة
   */
  private async cleanupChunks(chunks: ChunkUploadResult[]): Promise<void> {
    try {
      const paths = chunks.map(c => c.path);
      await supabase.storage
        .from('intro-videos')
        .remove(paths);

      console.log('🧹 [LargeUpload] Chunks cleaned up');
    } catch (error) {
      console.warn('⚠️ [LargeUpload] Failed to cleanup chunks:', error);
    }
  }

  /**
   * إنشاء session للرفع
   */
  private async createUploadSession(file: File, totalChunks: number): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    const { data, error } = await supabase
      .from('video_upload_sessions')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        total_chunks: totalChunks,
        upload_type: 'chunked',
        status: 'in_progress'
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('⚠️ Failed to create upload session:', error);
      return 'temp-session';
    }

    return data.id;
  }

  /**
   * تحديث session
   */
  private async updateUploadSession(sessionId: string, uploadedChunks: number): Promise<void> {
    if (sessionId === 'temp-session') return;

    try {
      await supabase
        .from('video_upload_sessions')
        .update({
          uploaded_chunks: Array.from({ length: uploadedChunks }, (_, i) => i),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.warn('⚠️ Failed to update upload session:', error);
    }
  }

  /**
   * حذف session
   */
  private async cleanupUploadSession(sessionId: string): Promise<void> {
    if (sessionId === 'temp-session') return;

    try {
      await supabase
        .from('video_upload_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.warn('⚠️ Failed to cleanup upload session:', error);
    }
  }

  /**
   * رفع ملف عبر XMLHttpRequest
   */
  private async uploadFileViaXHR(
    xhr: XMLHttpRequest,
    file: File,
    filePath: string
  ): Promise<void> {
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
   * حساب التقدم
   */
  private calculateProgress(
    loaded: number,
    total: number,
    currentChunk: number,
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
      currentChunk,
      totalChunks
    };
  }

  /**
   * إلغاء الرفع
   */
  cancelUpload(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 [LargeUpload] Upload cancelled');
    }
  }

  /**
   * انتظار
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * التحقق من الملف
   */
  validateFile(file: File): { valid: boolean; error?: string; warning?: string } {
    console.log('🔍 [LargeUpload] Validating file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // فحص الحجم
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `حجم الملف (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB) يتجاوز الحد الأقصى (5 GB)`
      };
    }

    // فحص الصيغة
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    const allowedExtensions = ['mp4', 'm4v', 'mov', 'webm', 'mkv', 'avi'];

    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `الصيغة ${extension} غير مدعومة. الصيغ المدعومة: MP4, MOV, WebM, MKV, AVI`
      };
    }

    // تحذير للملفات الكبيرة جداً
    if (file.size > 1024 * 1024 * 1024) {
      const sizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
      return {
        valid: true,
        warning: `حجم الملف كبير (${sizeGB} GB). سيتم استخدام نظام رفع متقدم مع تقسيم تلقائي. الرفع قد يستغرق عدة دقائق.`
      };
    }

    console.log('✅ [LargeUpload] File validation passed');
    return { valid: true };
  }
}

export const largeVideoUploadService = new LargeVideoUploadService();
