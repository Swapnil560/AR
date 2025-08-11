<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  let videoRef;
  let canvasRef;
  let recording = false;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let capturedImg: string | null = null;
  let capturedVideo: string | null = null;
  let filterUrl: string | null = null;

  // Load filter from sessionStorage
  onMount(async () => {
    const id = $page.params.id;
    filterUrl = sessionStorage.getItem('filter_' + id);
    await startCamera();
  });

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.srcObject = stream;
    await videoRef.play();
  }

  function capturePhoto() {
    const ctx = canvasRef.getContext('2d');
    ctx.drawImage(videoRef, 0, 0, 640, 480);
    if (filterUrl) {
      const img = new window.Image();
      img.src = filterUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 640, 480);
        capturedImg = canvasRef.toDataURL('image/png');
      };
    } else {
      capturedImg = canvasRef.toDataURL('image/png');
    }
  }

  async function startRecording() {
    recording = true;
    capturedVideo = null;
    chunks = [];
    const stream = videoRef.srcObject;
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      capturedVideo = URL.createObjectURL(blob);
      recording = false;
    };
    recorder.start();
    // Auto-stop after 20s
    setTimeout(() => { if (recorder && recording) stopRecording(); }, 20000);
  }

  function stopRecording() {
    if (recorder && recording) {
      recorder.stop();
      recording = false;
    }
  }
</script>

<main>
  <h1>AR Camera</h1>
  <div style="position:relative; width:640px; height:480px;">
    <video bind:this={videoRef} width="640" height="480" autoplay style="position:absolute;left:0;top:0;"></video>
    {#if filterUrl}
      <img src={filterUrl} width="640" height="480" style="position:absolute;left:0;top:0;pointer-events:none;" />
    {/if}
    <canvas bind:this={canvasRef} width="640" height="480" style="display:none;"></canvas>
  </div>
  <div style="margin-top:1em;">
    <button on:click={capturePhoto}>Capture Photo</button>
    {#if !recording}
      <button on:click={startRecording}>Start Video (20s max)</button>
    {:else}
      <button on:click={stopRecording}>Stop Video</button>
    {/if}
  </div>
  {#if capturedImg}
    <h2>Photo Preview</h2>
    <img src={capturedImg} width="320" />
    <br />
    <a href={capturedImg} download="rongcam-photo.png">Download Photo</a>
    <a href={`https://wa.me/?text=Check%20my%20AR%20photo!&url=${encodeURIComponent(capturedImg)}`} target="_blank">Share on WhatsApp</a>
  {/if}
  {#if capturedVideo}
    <h2>Video Preview</h2>
    <video src={capturedVideo} controls width="320"></video>
    <br />
    <a href={capturedVideo} download="rongcam-video.webm">Download Video</a>
    <!-- WhatsApp video sharing via link only, as direct upload not possible in browser -->
  {/if}
</main>
