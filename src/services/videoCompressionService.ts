/**
 * خدمة ضغط وتصغير الفيديوهات الكبيرة قبل رفعها
 * تستخدم Canvas API + MediaRecorder للضغط في المتصفح
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  bitrate?: number;
  targetSizeMB?: number;
}

interface CompressionProgress {
  stage: 'analyzing' | 'compressing' | 'finalizing';
  percentage: number;
  originalSize: number;
  currentSize?: number;
  estimatedFinalSize?: number;
}

export class VideoCompressionService {
  /**
   * تحليل الفيديو وتحديد إذا كان يحتاج للضغط
   */
  async analyzeVideo(file: File): Promise<{
    needsCompression: boolean;
    currentSizeMB: number;
    estimatedCompressedSizeMB?: number;
    reason?: string;
  }> {
    const sizeMB = file.size / (1024 * 1024);

    // الفيديوهات أكبر من 100 MB تحتاج للضغط
    if (sizeMB > 100) {
      return {
        needsCompression: true,
        currentSizeMB: sizeMB,
        estimatedCompressedSizeMB: sizeMB * 0.3, // تقليل بنسبة 70%
        reason: `حجم الفيديو كبير (${sizeMB.toFixed(2)} ميجابايت). يُنصح بالضغط لتسريع الرفع.`
      };
    }

    return {
      needsCompression: false,
      currentSizeMB: sizeMB
    };
  }

  /**
   * ضغط الفيديو باستخدام Canvas + MediaRecorder
   */
  async compressVideo(
    file: File,
    options: CompressionOptions = {},
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<File> {
    console.log('🎬 [Compression] Starting video compression...');
    console.log(`📊 Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const {
      maxWidth = 1280,
      maxHeight = 720,
      quality = 0.7,
      bitrate = 2500000, // 2.5 Mbps
      targetSizeMB
    } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Stage 1: تحليل الفيديو
      onProgress?.({
        stage: 'analyzing',
        percentage: 10,
        originalSize: file.size
      });

      video.onloadedmetadata = () => {
        console.log(`📐 Original dimensions: ${video.videoWidth}x${video.videoHeight}`);
        console.log(`⏱️ Duration: ${video.duration.toFixed(2)}s`);

        // حساب الأبعاد الجديدة مع الحفاظ على النسبة
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        // التأكد من أن الأبعاد زوجية (مطلوب للـ encoding)
        width = Math.round(width / 2) * 2;
        height = Math.round(height / 2) * 2;

        canvas.width = width;
        canvas.height = height;

        console.log(`📐 New dimensions: ${width}x${height}`);

        // Stage 2: الضغط
        onProgress?.({
          stage: 'compressing',
          percentage: 30,
          originalSize: file.size,
          estimatedFinalSize: file.size * 0.3
        });

        const chunks: Blob[] = [];
        const stream = canvas.captureStream(30); // 30 FPS

        // إضافة الصوت من الفيديو الأصلي
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        // دمج الفيديو والصوت
        const audioTracks = destination.stream.getAudioTracks();
        audioTracks.forEach(track => stream.addTrack(track));

        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: bitrate
        });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);

            // تحديث التقدم
            const currentSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
            const progress = Math.min(30 + (video.currentTime / video.duration) * 60, 90);

            onProgress?.({
              stage: 'compressing',
              percentage: progress,
              originalSize: file.size,
              currentSize
            });
          }
        };

        recorder.onstop = () => {
          console.log('✅ [Compression] Recording stopped');

          // Stage 3: إنهاء العملية
          onProgress?.({
            stage: 'finalizing',
            percentage: 95,
            originalSize: file.size
          });

          const blob = new Blob(chunks, { type: 'video/webm' });
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.webm'),
            { type: 'video/webm' }
          );

          const compressionRatio = ((1 - (compressedFile.size / file.size)) * 100).toFixed(1);
          console.log(`✅ [Compression] Complete!`);
          console.log(`📊 Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`📊 Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`📉 Reduction: ${compressionRatio}%`);

          onProgress?.({
            stage: 'finalizing',
            percentage: 100,
            originalSize: file.size,
            currentSize: compressedFile.size
          });

          audioContext.close();
          resolve(compressedFile);
        };

        recorder.onerror = (error) => {
          console.error('❌ [Compression] Recorder error:', error);
          audioContext.close();
          reject(error);
        };

        // بدء التسجيل
        recorder.start(100); // جمع البيانات كل 100ms

        // تشغيل الفيديو ورسمه على الـ Canvas
        video.play();

        const drawFrame = () => {
          if (video.paused || video.ended) {
            recorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      };

      video.onerror = (error) => {
        console.error('❌ [Compression] Video error:', error);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
      video.muted = false;
      video.load();
    });
  }

  /**
   * ضغط تلقائي ذكي بناءً على حجم الملف
   */
  async smartCompress(
    file: File,
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<File> {
    const sizeMB = file.size / (1024 * 1024);
    let options: CompressionOptions;

    if (sizeMB > 1000) {
      // ملفات أكبر من 1 GB - ضغط قوي
      options = {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.6,
        bitrate: 2000000 // 2 Mbps
      };
    } else if (sizeMB > 500) {
      // ملفات 500 MB - 1 GB - ضغط متوسط
      options = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.7,
        bitrate: 3000000 // 3 Mbps
      };
    } else if (sizeMB > 100) {
      // ملفات 100-500 MB - ضغط خفيف
      options = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        bitrate: 4000000 // 4 Mbps
      };
    } else {
      // ملفات صغيرة - لا حاجة للضغط
      return file;
    }

    return this.compressVideo(file, options, onProgress);
  }

  /**
   * التحقق من دعم المتصفح للضغط
   */
  isSupported(): boolean {
    return !!(
      typeof MediaRecorder !== 'undefined' &&
      HTMLCanvasElement.prototype.captureStream &&
      typeof AudioContext !== 'undefined'
    );
  }
}

export const videoCompressionService = new VideoCompressionService();
