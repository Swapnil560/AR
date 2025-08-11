<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  
  let videoRef;
  let canvasRef;
  let filterUrl: string | null = null;
  let capturedImg: string | null = null;
  let recordedVideo: string | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let isRecording = false;
  let recordedChunks: Blob[] = [];
  let filterLoadError = false;

  onMount(async () => {
    await loadFilter();
    await startCamera();
  });

  async function loadFilter() {
    try {
      // First, check if filter URL is provided in query parameters
      const filterParam = $page.url.searchParams.get('filter');
      if (filterParam) {
        filterUrl = decodeURIComponent(filterParam);
        console.log(filterUrl)
        return;
      }

      
    } catch (error) {
      console.error('Failed to load filter from server, trying localStorage:', error);
      // Fallback to localStorage
      filterUrl = localStorage.getItem('rongcam_demo_filter');
      if (!filterUrl) {
        filterLoadError = true;
      }
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.srcObject = stream;
      await videoRef.play();
      
      // Wait for video metadata to be loaded
      await new Promise((resolve) => {
        if (videoRef.readyState >= 1) {
          resolve(null);
        } else {
          videoRef.addEventListener('loadedmetadata', resolve, { once: true });
        }
      });
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  }

  async function capturePhoto() {
    const ctx = canvasRef.getContext('2d');
    
    // Set canvas size to match the display dimensions exactly
    const displayWidth = videoRef.clientWidth;
    const displayHeight = videoRef.clientHeight;
    
    // Update canvas dimensions to match display
    canvasRef.width = displayWidth;
    canvasRef.height = displayHeight;
    
    // Simply draw the video element as it appears (this handles object-fit: cover automatically)
    ctx.drawImage(videoRef, 0, 0, displayWidth, displayHeight);
    
    if (filterUrl) {
      try {
        const img = new window.Image();
        img.crossOrigin = 'anonymous'; // Handle CORS issues
        img.src = filterUrl;
        
        // Wait for the image to load before drawing
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        // Draw the filter to match exactly how it appears as overlay
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        capturedImg = canvasRef.toDataURL('image/png');
        recordedVideo = null; // Clear video when photo is captured
      } catch (error) {
        console.error('Error loading filter image:', error);
        // If filter fails to load, just capture without filter
        capturedImg = canvasRef.toDataURL('image/png');
        recordedVideo = null;
      }
    } else {
      capturedImg = canvasRef.toDataURL('image/png');
      recordedVideo = null; // Clear video when photo is captured
    }
  }

  async function startVideoRecording() {
    try {
      recordedChunks = [];
      const stream = videoRef.srcObject as MediaStream;
      
      // Create a new canvas to composite video with filter
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = 640;
      recordCanvas.height = 480;
      const recordCtx = recordCanvas.getContext('2d');
      
      // Pre-load the filter image if it exists
      let filterImage = null;
      if (filterUrl) {
        filterImage = new Image();
        filterImage.crossOrigin = 'anonymous';
        filterImage.src = filterUrl;
        await new Promise((resolve) => {
          filterImage.onload = resolve;
          filterImage.onerror = resolve; // Continue even if image fails to load
        });
      }
      
      // Create a stream from the canvas
      const canvasStream = recordCanvas.captureStream(30); // 30 FPS
      
      // Start drawing video + filter to canvas continuously
      const drawFrame = () => {
        if (!isRecording) return;
        
        try {
          // Clear the canvas first
          recordCtx.clearRect(0, 0, 640, 480);
          
          // Draw the video element
          recordCtx.drawImage(videoRef, 0, 0, 640, 480);
          
          if (filterImage && filterImage.complete) {
            recordCtx.drawImage(filterImage, 0, 0, 640, 480);
          }
          requestAnimationFrame(drawFrame);
        } catch (error) {
          console.error('Error drawing frame:', error);
        }
      };
      
      // Configure MediaRecorder with better settings
      const options = {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 2500000
      };
      
      // Fallback to basic webm if vp8 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }
      
      mediaRecorder = new MediaRecorder(canvasStream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        try {
          if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { 
              type: mediaRecorder.mimeType || 'video/webm' 
            });
            
            // Clean up any existing video URL
            if (recordedVideo) {
              URL.revokeObjectURL(recordedVideo);
            }
            
            recordedVideo = URL.createObjectURL(blob);
            capturedImg = null; // Clear photo when video is recorded
            console.log('Video recording stopped, blob created:', recordedVideo);
            console.log('Blob size:', blob.size, 'bytes');
          } else {
            console.error('No video data recorded');
          }
        } catch (error) {
          console.error('Error creating video blob:', error);
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };
      
      isRecording = true;
      drawFrame();
      mediaRecorder.start(1000); // Record in 1-second chunks
    } catch (error) {
      console.error('Error starting video recording:', error);
    }
  }

  function stopVideoRecording() {
    if (mediaRecorder && isRecording) {
      isRecording = false;
      
      // Stop the media recorder
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      // Stop all tracks in the canvas stream to free up resources
      const canvasStream = mediaRecorder.stream;
      if (canvasStream) {
        canvasStream.getTracks().forEach(track => track.stop());
      }
    }
  }

  async function shareContent() {
    try {
      if (capturedImg) {
        // Convert data URL to blob
        const response = await fetch(capturedImg);
        const blob = await response.blob();
        const file = new File([blob], 'rongcam-photo.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'RongCam AR Photo',
            text: 'Check out my AR photo from RongCam!',
            files: [file]
          });
        } else {
          // Fallback: download the image
          const link = document.createElement('a');
          link.href = capturedImg;
          link.download = 'rongcam-photo.png';
          link.click();
          alert('Photo downloaded! You can now share it from your device.');
        }
      } else if (recordedVideo) {
        // Convert video blob to file for sharing
        const response = await fetch(recordedVideo);
        const blob = await response.blob();
        const file = new File([blob], 'rongcam-video.webm', { type: 'video/webm' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'RongCam AR Video',
            text: 'Check out my AR video from RongCam!',
            files: [file]
          });
        } else {
          // Fallback: download the video
          const link = document.createElement('a');
          link.href = recordedVideo;
          link.download = 'rongcam-video.webm';
          link.click();
          alert('Video downloaded! You can now share it from your device.');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Ultimate fallback: download the file
      try {
        if (capturedImg) {
          const link = document.createElement('a');
          link.href = capturedImg;
          link.download = 'rongcam-photo.png';
          link.click();
          alert('Photo downloaded! You can now share it from your device.');
        } else if (recordedVideo) {
          const link = document.createElement('a');
          link.href = recordedVideo;
          link.download = 'rongcam-video.webm';
          link.click();
          alert('Video downloaded! You can now share it from your device.');
        }
      } catch (downloadError) {
        alert('Sharing and download not supported on this device');
      }
    }
  }
</script>

<svelte:head>
  <title>RongCam AR - Professional AR Camera Experience</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>

<div class="app-container">
  <header class="header">
    <div class="header-content">
      <h1 class="logo">
        <span class="logo-icon">📷</span>
        RongCam AR
      </h1>
      <p class="tagline">Professional AR Photography</p>
    </div>
  </header>

  <main class="main-content">
    {#if filterLoadError}
      <div class="error-section">
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <h3 class="error-title">No AR Filter Found</h3>
            <p class="error-text">
              No AR filter has been uploaded yet. Please go to the admin panel to upload a filter first.
            </p>
            <a href="/admin" class="admin-link">
              <span class="link-icon">⚙️</span>
              Go to Admin Panel
            </a>
          </div>
        </div>
      </div>
    {:else}
      <div class="camera-section">
      <div class="camera-container">
        <div class="camera-frame">
          <video bind:this={videoRef} width="640" height="480" autoplay class="video-feed"></video>
          {#if filterUrl}
            <img src={filterUrl} width="640" height="480" class="ar-filter" alt="AR Filter" />
          {/if}
          <canvas bind:this={canvasRef} class="capture-canvas"></canvas>
          
          <!-- Camera overlay UI -->
          <div class="camera-overlay">
            <div class="corner-frame top-left"></div>
            <div class="corner-frame top-right"></div>
            <div class="corner-frame bottom-left"></div>
            <div class="corner-frame bottom-right"></div>
          </div>
        </div>
        
        <div class="controls">
          <div class="control-buttons">
            <button class="capture-btn photo-btn" on:click={capturePhoto} disabled={isRecording}>
              <span class="capture-icon">📸</span>
              <span class="capture-text">Photo</span>
            </button>
            
            {#if !isRecording}
              <button class="capture-btn video-btn" on:click={startVideoRecording}>
                <span class="capture-icon">🎥</span>
                <span class="capture-text">Record</span>
              </button>
            {:else}
              <button class="capture-btn stop-btn" on:click={stopVideoRecording}>
                <span class="capture-icon">⏹️</span>
                <span class="capture-text">Stop</span>
              </button>
            {/if}
          </div>
          
          {#if isRecording}
            <div class="recording-indicator">
              <span class="recording-dot"></span>
              <span class="recording-text">Recording...</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
    {/if}

    {#if capturedImg || recordedVideo}
      <div class="preview-section">
        <div class="preview-container">
          {#if capturedImg}
            <h2 class="preview-title">📷 Your AR Photo</h2>
            <div class="preview-image-container">
              <img src={capturedImg} class="preview-image" alt="Captured photo" />
            </div>
            <div class="preview-actions">
              <a href={capturedImg} download="rongcam-photo.png" class="download-btn">
                <span class="download-icon">💾</span>
                Download
              </a>
              <button class="share-btn" on:click={shareContent}>
                <span class="share-icon">📤</span>
                Share
              </button>
            </div>
          {:else if recordedVideo}
            <h2 class="preview-title">🎥 Your AR Video</h2>
            <div class="preview-video-container">
              <video src={recordedVideo} class="preview-video" controls alt="Recorded video"></video>
            </div>
            <div class="preview-actions">
              <a href={recordedVideo} download="rongcam-video.webm" class="download-btn">
                <span class="download-icon">💾</span>
                Download
              </a>
              <button class="share-btn" on:click={shareContent}>
                <span class="share-icon">📤</span>
                Share
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem 0;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    text-align: center;
  }

  .logo {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .logo-icon {
    font-size: 3rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .tagline {
    color: rgba(255, 255, 255, 0.9);
    margin: 0.5rem 0 0 0;
    font-size: 1.1rem;
    font-weight: 300;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
    gap: 2rem;
  }

  .error-section {
    width: 100%;
    max-width: 600px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
  }

  .error-container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 3rem 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
  }

  .error-title {
    color: white;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .error-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 0 0 2rem 0;
  }

  .admin-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    text-decoration: none;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
    transition: all 0.3s ease;
  }

  .admin-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
  }

  .link-icon {
    font-size: 1.3rem;
  }

  .camera-section {
    width: 100%;
    max-width: 800px;
  }

  .camera-container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .camera-frame {
    position: relative;
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  }

  .video-feed {
    width: 100%;
    height: auto;
    display: block;
    background: #000;
    object-fit: cover;
  }

  .ar-filter {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    object-fit: cover;
    object-position: center;
  }

  .capture-canvas {
    display: none;
  }

  .camera-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .corner-frame {
    position: absolute;
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255, 255, 255, 0.8);
  }

  .top-left {
    top: 15px;
    left: 15px;
    border-right: none;
    border-bottom: none;
  }

  .top-right {
    top: 15px;
    right: 15px;
    border-left: none;
    border-bottom: none;
  }

  .bottom-left {
    bottom: 15px;
    left: 15px;
    border-right: none;
    border-top: none;
  }

  .bottom-right {
    bottom: 15px;
    right: 15px;
    border-left: none;
    border-top: none;
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 2rem;
    gap: 1rem;
  }

  .control-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .capture-btn {
    color: white;
    border: none;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    transform: translateY(0);
    min-width: 120px;
    justify-content: center;
  }

  .photo-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    box-shadow: 0 10px 20px rgba(238, 90, 36, 0.3);
  }

  .photo-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(238, 90, 36, 0.4);
  }

  .video-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
  }

  .video-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
  }

  .stop-btn {
    background: linear-gradient(135deg, #ff4757, #c44569);
    box-shadow: 0 10px 20px rgba(255, 71, 87, 0.3);
  }

  .stop-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(255, 71, 87, 0.4);
  }

  .capture-btn:active {
    transform: translateY(1px);
  }

  .capture-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .capture-icon {
    font-size: 1.3rem;
  }

  .recording-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #ff4757;
    font-weight: 600;
    animation: pulse 1.5s infinite;
  }

  .recording-dot {
    width: 12px;
    height: 12px;
    background: #ff4757;
    border-radius: 50%;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .preview-section {
    width: 100%;
    max-width: 600px;
  }

  .preview-container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
  }

  .preview-title {
    color: white;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }

  .preview-image-container {
    margin-bottom: 1.5rem;
  }

  .preview-image {
    width: 100%;
    max-width: 400px;
    height: auto;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  .preview-video-container {
    margin-bottom: 1.5rem;
  }

  .preview-video {
    width: 100%;
    max-width: 400px;
    height: auto;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  .preview-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .download-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    text-decoration: none;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
    transition: all 0.3s ease;
    transform: translateY(0);
    min-width: 120px;
    justify-content: center;
  }

  .download-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
  }

  .share-btn {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 10px 20px rgba(108, 92, 231, 0.3);
    transition: all 0.3s ease;
    transform: translateY(0);
    min-width: 120px;
    justify-content: center;
  }

  .share-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(108, 92, 231, 0.4);
  }

  .download-icon, .share-icon {
    font-size: 1.3rem;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .header-content {
      padding: 0 1rem;
    }

    .logo {
      font-size: 2rem;
    }

    .logo-icon {
      font-size: 2.5rem;
    }

    .tagline {
      font-size: 1rem;
    }

    .main-content {
      padding: 1rem;
    }

    .camera-container {
      padding: 1.5rem;
    }

    .corner-frame {
      width: 20px;
      height: 20px;
    }

    .top-left, .top-right {
      top: 10px;
    }

    .bottom-left, .bottom-right {
      bottom: 10px;
    }

    .top-left, .bottom-left {
      left: 10px;
    }

    .top-right, .bottom-right {
      right: 10px;
    }

    .control-buttons {
      flex-direction: column;
      gap: 0.8rem;
    }

    .capture-btn {
      padding: 0.8rem 1.5rem;
      font-size: 1rem;
      min-width: 140px;
    }

    .preview-container {
      padding: 1.5rem;
    }

    .preview-title {
      font-size: 1.5rem;
    }

    .preview-actions {
      flex-direction: column;
      gap: 0.8rem;
    }

    .download-btn, .share-btn {
      padding: 0.8rem 1.5rem;
      font-size: 1rem;
      min-width: 140px;
    }
  }

  @media (max-width: 480px) {
    .logo {
      font-size: 1.8rem;
    }

    .camera-container {
      padding: 1rem;
    }

    .controls {
      margin-top: 1.5rem;
    }

    .capture-btn {
      padding: 0.7rem 1.2rem;
      font-size: 0.9rem;
      min-width: 120px;
    }

    .preview-container {
      padding: 1rem;
    }

    .download-btn, .share-btn {
      padding: 0.7rem 1.2rem;
      font-size: 0.9rem;
      min-width: 120px;
    }

    .recording-indicator {
      font-size: 0.9rem;
    }
  }
</style>
