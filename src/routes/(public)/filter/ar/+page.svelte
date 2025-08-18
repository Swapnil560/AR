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
  let currentStream: MediaStream | null = null;
  let isPhotoMode = true; // Toggle between photo and video mode
  let currentCamera = 'environment'; // 'user' for front camera, 'environment' for back camera
  let showPreview = false; // Show preview after capture
  let isCameraActive = true; // Track camera state

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
      // Stop existing stream if any
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.srcObject = currentStream;
      await videoRef.play();
      isCameraActive = true;
      
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

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
    if (videoRef) {
      videoRef.srcObject = null;
    }
    isCameraActive = false;
  }

  async function switchCamera() {
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    await startCamera();
  }

  function toggleMode() {
    isPhotoMode = !isPhotoMode;
    if (isRecording) {
      stopVideoRecording();
    }
  }

  function goBackToCamera() {
    capturedImg = null;
    recordedVideo = null;
    showPreview = false;
    startCamera();
  }

  function downloadImage() {
    if (capturedImg) {
      const link = document.createElement('a');
      link.href = capturedImg;
      link.download = `rongcam-photo-${Date.now()}.png`;
      link.click();
    }
  }

  function downloadVideo() {
    if (recordedVideo) {
      const link = document.createElement('a');
      link.href = recordedVideo;
      link.download = `rongcam-video-${Date.now()}.webm`;
      link.click();
    }
  }

  async function capturePhoto() {
    const ctx = canvasRef.getContext('2d');
    
    // Get the actual video dimensions
    const videoWidth = videoRef.videoWidth;
    const videoHeight = videoRef.videoHeight;
    const displayWidth = videoRef.clientWidth;
    const displayHeight = videoRef.clientHeight;
    
    // Calculate the scaling and cropping to match object-fit: cover behavior
    const videoAspect = videoWidth / videoHeight;
    const displayAspect = displayWidth / displayHeight;
    
    let sourceX = 0, sourceY = 0, sourceWidth = videoWidth, sourceHeight = videoHeight;
    
    if (videoAspect > displayAspect) {
      // Video is wider than display, crop horizontally
      sourceWidth = videoHeight * displayAspect;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller than display, crop vertically
      sourceHeight = videoWidth / displayAspect;
      sourceY = (videoHeight - sourceHeight) / 2;
    }
    
    // Set canvas to match the display dimensions for consistent output
    canvasRef.width = displayWidth;
    canvasRef.height = displayHeight;
    
    // Only flip the canvas horizontally for front camera to match the mirrored display
    if (currentCamera === 'user') {
      ctx.scale(-1, 1);
      ctx.translate(-displayWidth, 0);
    }
    
    // Draw the cropped video portion that matches what's visible
    ctx.drawImage(
      videoRef,
      sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle (what's visible)
      0, 0, displayWidth, displayHeight              // Destination rectangle
    );
    
    if (filterUrl) {
      try {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = filterUrl;
        
        // Wait for the image to load before drawing
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        // Reset canvas transform and draw the filter in original orientation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        capturedImg = canvasRef.toDataURL('image/png');
        recordedVideo = null;
      } catch (error) {
        console.error('Error loading filter image:', error);
        // If filter fails to load, just capture without filter
        capturedImg = canvasRef.toDataURL('image/png');
        recordedVideo = null;
      }
    } else {
      capturedImg = canvasRef.toDataURL('image/png');
      recordedVideo = null;
    }

    // Stop camera and show preview
    stopCamera();
    showPreview = true;
  }

  async function startVideoRecording() {
    try {
      recordedChunks = [];
      const stream = videoRef.srcObject as MediaStream;
      
      // Get display dimensions for consistent recording
      const displayWidth = videoRef.clientWidth;
      const displayHeight = videoRef.clientHeight;
      
      // Create a new canvas to composite video with filter
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = displayWidth;
      recordCanvas.height = displayHeight;
      const recordCtx = recordCanvas.getContext('2d');
      
      // Get video dimensions for cropping calculation
      const videoWidth = videoRef.videoWidth;
      const videoHeight = videoRef.videoHeight;
      const videoAspect = videoWidth / videoHeight;
      const displayAspect = displayWidth / displayHeight;
      
      let sourceX = 0, sourceY = 0, sourceWidth = videoWidth, sourceHeight = videoHeight;
      
      if (videoAspect > displayAspect) {
        // Video is wider than display, crop horizontally
        sourceWidth = videoHeight * displayAspect;
        sourceX = (videoWidth - sourceWidth) / 2;
      } else {
        // Video is taller than display, crop vertically
        sourceHeight = videoWidth / displayAspect;
        sourceY = (videoHeight - sourceHeight) / 2;
      }
      
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
          recordCtx.clearRect(0, 0, displayWidth, displayHeight);
          
          // Only flip the canvas horizontally for front camera to match the mirrored display
          recordCtx.save();
          if (currentCamera === 'user') {
            recordCtx.scale(-1, 1);
            recordCtx.translate(-displayWidth, 0);
          }
          
          // Draw the cropped video portion that matches what's visible
          recordCtx.drawImage(
            videoRef,
            sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle (what's visible)
            0, 0, displayWidth, displayHeight              // Destination rectangle
          );
          
          recordCtx.restore();
          
          // Draw filter in original orientation (not flipped)
          if (filterImage && filterImage.complete) {
            recordCtx.drawImage(filterImage, 0, 0, displayWidth, displayHeight);
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
            
            // Stop camera and show preview
            stopCamera();
            showPreview = true;
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
</svelte:head>

<div class="app-container">
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
  {:else if showPreview}
    <!-- Preview Mode -->
    <div class="preview-fullscreen">
      <div class="preview-header">
        <button class="back-btn" on:click={goBackToCamera}>
          <span class="back-icon">←</span>
        </button>
        <h2 class="preview-title">
          {#if capturedImg}📷 Photo{:else}🎥 Video{/if}
        </h2>
        <div></div> <!-- Spacer for centering -->
      </div>
      
      <div class="preview-content">
        {#if capturedImg}
          <img src={capturedImg} class="preview-media" alt="Captured photo" />
        {:else if recordedVideo}
          <video src={recordedVideo} class="preview-media" controls autoplay alt="Recorded video"></video>
        {/if}
      </div>
      
      <div class="preview-actions">
        <button class="action-btn save-btn" on:click={() => capturedImg ? downloadImage() : downloadVideo()}>
          <span class="btn-icon">💾</span>
          <span class="btn-text">Save</span>
        </button>
        <button class="action-btn share-btn" on:click={shareContent}>
          <span class="btn-icon">�</span>
          <span class="btn-text">Share</span>
        </button>
        <button class="action-btn retake-btn" on:click={goBackToCamera}>
          <span class="btn-icon">{#if capturedImg}📷{:else}🎥{/if}</span>
          <span class="btn-text">Retake</span>
        </button>
      </div>
    </div>
  {:else}
    <!-- Camera Mode -->
    <div class="camera-fullscreen">
      <!-- Top Controls -->
      <div class="top-controls">
        <button class="control-btn close-btn" on:click={() => window.history.back()}>
          <span class="control-icon">✕</span>
        </button>
        
        <div class="mode-toggle">
          <button 
            class="mode-btn {isPhotoMode ? 'active' : ''}" 
            on:click={() => toggleMode()}
            disabled={isRecording}
          >
            PHOTO
          </button>
          <button 
            class="mode-btn {!isPhotoMode ? 'active' : ''}" 
            on:click={() => toggleMode()}
            disabled={isRecording}
          >
            VIDEO
          </button>
        </div>
        
        <button class="control-btn switch-camera-btn" on:click={switchCamera} disabled={isRecording}>
          <span class="control-icon">🔄</span>
        </button>
      </div>

      <!-- Camera View -->
      <div class="camera-view">
        <video bind:this={videoRef} autoplay playsinline class="video-stream {currentCamera === 'user' ? 'mirrored' : ''}"></video>
        {#if filterUrl}
          <img src={filterUrl} class="ar-filter-overlay" alt="AR Filter" />
        {/if}
        <canvas bind:this={canvasRef} class="capture-canvas"></canvas>
        
        <!-- Recording Indicator -->
        {#if isRecording}
          <div class="recording-indicator">
            <div class="recording-dot"></div>
            <span class="recording-text">REC</span>
          </div>
        {/if}
      </div>

      <!-- Bottom Controls -->
      <div class="bottom-controls">
        <div class="capture-controls">
          <!-- Gallery Button (placeholder) -->
          <div class="gallery-btn">
            <div class="gallery-icon">�️</div>
          </div>

          <!-- Main Capture Button -->
          {#if isPhotoMode}
            <button class="capture-button photo-capture" on:click={capturePhoto} disabled={isRecording}>
              <div class="capture-ring">
                <div class="capture-inner"></div>
              </div>
            </button>
          {:else}
            {#if !isRecording}
              <button class="capture-button video-capture" on:click={startVideoRecording}>
                <div class="capture-ring video-ring">
                  <div class="capture-inner video-inner"></div>
                </div>
              </button>
            {:else}
              <button class="capture-button stop-capture" on:click={stopVideoRecording}>
                <div class="capture-ring stop-ring">
                  <div class="capture-inner stop-inner"></div>
                </div>
              </button>
            {/if}
          {/if}

          <!-- Flash/Settings Button (placeholder) -->
          <div class="settings-btn">
            <div class="settings-icon">⚡</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    background: #000;
    min-height: 100dvh;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .app-container {
    width: 100vw;
    height: 100dvh;
    position: fixed;
    top: 0;
    left: 0;
    background: #000;
    overflow: hidden;
  }

  /* Error Section */
  .error-section {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .error-container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 2rem;
    margin: 1rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
    max-width: 400px;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-title {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .error-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
    line-height: 1.5;
    margin: 0 0 1.5rem 0;
  }

  .admin-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    text-decoration: none;
    border-radius: 25px;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
    transition: all 0.3s ease;
  }

  .admin-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
  }

  .link-icon {
    font-size: 1.2rem;
  }

  /* Camera Fullscreen */
  .camera-fullscreen {
    width: 100%;
    height: 100%;
    position: relative;
    background: #000;
    display: flex;
    flex-direction: column;
  }

  .top-controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 20;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: env(safe-area-inset-top, 20px) 20px 20px 20px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
  }

  .control-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 22px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:active {
    transform: scale(0.95);
    background: rgba(0, 0, 0, 0.7);
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .control-icon {
    font-size: 18px;
  }

  .mode-toggle {
    display: flex;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 4px;
  }

  .mode-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 16px;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 60px;
  }

  .mode-btn.active {
    background: white;
    color: #000;
  }

  .mode-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Camera View */
  .camera-view {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .video-stream {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
  }

  .video-stream.mirrored {
    transform: scaleX(-1);
  }

  .ar-filter-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    z-index: 10;
  }

  .capture-canvas {
    display: none;
  }

  .recording-indicator {
    position: absolute;
    top: env(safe-area-inset-top, 20px);
    top: calc(env(safe-area-inset-top, 20px) + 80px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    animation: pulse 2s infinite;
  }

  .recording-dot {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  /* Bottom Controls */
  .bottom-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    padding: 20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px;
    background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  }

  .capture-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 400px;
    margin: 0 auto;
  }

  .gallery-btn, .settings-btn {
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .gallery-btn:active, .settings-btn:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
  }

  .gallery-icon, .settings-icon {
    font-size: 20px;
    filter: brightness(0) invert(1);
  }

  /* Capture Button */
  .capture-button {
    width: 80px;
    height: 80px;
    border: none;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .capture-button:active {
    transform: scale(0.95);
  }

  .capture-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .capture-ring {
    width: 70px;
    height: 70px;
    border: 4px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }

  .capture-inner {
    width: 58px;
    height: 58px;
    background: white;
    border-radius: 50%;
  }

  .video-ring {
    border-color: #ff3333;
  }

  .video-inner {
    background: #ff3333;
  }

  .stop-ring {
    border-color: #ff3333;
    background: #ff3333;
  }

  .stop-inner {
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 4px;
  }

  /* Preview Fullscreen */
  .preview-fullscreen {
    width: 100%;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: #000;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: env(safe-area-inset-top, 20px) 20px 20px 20px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
  }

  .back-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .back-btn:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
  }

  .back-icon {
    font-size: 20px;
    font-weight: bold;
  }

  .preview-title {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .preview-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    overflow: hidden;
    min-height: 0;
  }

  .preview-media {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    object-fit: contain;
  }

  .preview-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    padding: 15px 15px calc(env(safe-area-inset-bottom, 15px) + 15px) 15px;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    flex-wrap: nowrap;
    min-height: 80px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: white;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 8px 6px;
    border-radius: 12px;
    min-width: 60px;
    flex: 1;
    max-width: 90px;
  }

  .action-btn:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.1);
  }

  .btn-icon {
    font-size: 20px;
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .btn-text {
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  .download-btn .btn-icon {
    background: rgba(52, 152, 219, 0.8);
  }

  .save-btn .btn-icon {
    background: rgba(52, 152, 219, 0.8);
    border-color: rgba(52, 152, 219, 1);
  }

  .share-btn .btn-icon {
    background: rgba(46, 204, 113, 0.8);
    border-color: rgba(46, 204, 113, 1);
  }

  .retake-btn .btn-icon {
    background: rgba(255, 149, 0, 0.8);
    border-color: rgba(255, 149, 0, 1);
  }

  /* Responsive adjustments for larger screens */
  @media (min-width: 768px) {
    .app-container {
      position: relative;
      width: 100%;
      height: 100dvh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #1a1a1a;
    }

    .camera-fullscreen, .preview-fullscreen {
      max-width: 480px;
      max-height: 100dvh;
      margin: 0 auto;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      position: relative;
    }

    .preview-content {
      padding: 20px;
    }

    .preview-actions {
      padding: 20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px;
      gap: 20px;
    }

    .action-btn {
      min-width: 80px;
      max-width: 120px;
      padding: 12px 10px;
      gap: 8px;
    }

    .btn-icon {
      width: 48px;
      height: 48px;
      font-size: 22px;
    }

    .btn-text {
      font-size: 12px;
    }

    .error-container {
      max-width: 600px;
    }
  }

  /* Desktop and large tablets */
  @media (min-width: 1024px) {
    .camera-fullscreen, .preview-fullscreen {
      max-width: 500px;
    }

    .preview-actions {
      gap: 25px;
      padding: 25px;
    }

    .action-btn {
      min-width: 90px;
      max-width: 140px;
      padding: 15px 12px;
    }

    .btn-icon {
      width: 52px;
      height: 52px;
      font-size: 24px;
    }

    .btn-text {
      font-size: 13px;
    }
  }

  /* Landscape mode adjustments */
  @media (orientation: landscape) and (max-height: 500px) {
    .top-controls {
      padding: 8px 15px;
    }

    .bottom-controls {
      padding: 8px 15px calc(env(safe-area-inset-bottom, 8px) + 8px) 15px;
    }

    .capture-button {
      width: 60px;
      height: 60px;
    }

    .capture-ring {
      width: 50px;
      height: 50px;
    }

    .capture-inner {
      width: 42px;
      height: 42px;
    }

    .stop-inner {
      width: 20px;
      height: 20px;
    }

    .preview-header {
      padding: 8px 15px;
    }

    .preview-content {
      padding: 5px;
    }

    .preview-actions {
      padding: 10px 15px calc(env(safe-area-inset-bottom, 10px) + 10px) 15px;
      gap: 12px;
      min-height: 70px;
    }

    .btn-icon {
      width: 38px;
      height: 38px;
      font-size: 18px;
    }

    .btn-text {
      font-size: 10px;
    }

    .action-btn {
      min-width: 50px;
      max-width: 80px;
      padding: 6px 4px;
      gap: 4px;
    }
  }

  /* Small screen adjustments */
  @media (max-width: 400px) {
    .preview-actions {
      gap: 8px;
      padding: 12px 8px calc(env(safe-area-inset-bottom, 12px) + 12px) 8px;
      min-height: 75px;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }

    .btn-text {
      font-size: 10px;
    }

    .action-btn {
      min-width: 55px;
      max-width: 75px;
      padding: 6px 3px;
      gap: 5px;
    }

    .preview-content {
      padding: 8px;
    }
  }

  /* Very small screens */
  @media (max-width: 320px) {
    .preview-actions {
      gap: 6px;
      padding: 10px 5px calc(env(safe-area-inset-bottom, 10px) + 10px) 5px;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      font-size: 16px;
    }

    .btn-text {
      font-size: 9px;
    }

    .action-btn {
      min-width: 50px;
      max-width: 70px;
      padding: 5px 2px;
    }
  }

  /* Large screens with tall aspect ratios */
  @media (min-height: 800px) and (max-width: 480px) {
    .preview-actions {
      padding: 20px 15px calc(env(safe-area-inset-bottom, 20px) + 20px) 15px;
      gap: 18px;
      min-height: 90px;
    }

    .btn-icon {
      width: 46px;
      height: 46px;
      font-size: 21px;
    }

    .btn-text {
      font-size: 12px;
    }

    .action-btn {
      min-width: 70px;
      max-width: 90px;
      padding: 10px 8px;
      gap: 7px;
    }
  }
</style>
