<script lang="ts">
  import {
    Folder,
    CloudUpload,
    Hourglass,
    CheckCircle,
    HardDrive,
    FileImage,
    Blend,
    Cloud,
    TriangleAlert,
    ChevronDown
  } from "@lucide/svelte";

  export let isUploading = false;
  export let uploadSuccess = false;
  export let errorMsg: string | null = null;
  export let transparencyInfo: {
    isValid: boolean;
    transparencyPercentage: number;
    error?: string;
  } | null = null;

  // Event dispatchers
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  // Client selection state
  let selectedClient = '';
  let clients = [
    { id: '', name: 'Select a client' },
    { id: 'client1', name: 'Client 1' },
    { id: 'client2', name: 'Client 2' },
    { id: 'client3', name: 'Client 3' },
    { id: 'client4', name: 'Client 4' },
    { id: 'client5', name: 'Client 5' }
  ];

  // File preview state
  let filePreview: string | null = null;
  let selectedFile: File | null = null;

  function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
  }

  function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }

  function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  }

  function handleClientChange(event) {
    selectedClient = event.target.value;
    dispatch('clientSelected', { clientId: selectedClient });
  }

  async function handleFileSelection(file: File) {
    // Reset previous state
    errorMsg = null;
    transparencyInfo = null;
    filePreview = null;
    selectedFile = file;

    // Validate file type
    if (!file.type.startsWith("image/png") && !file.type.startsWith("image/gif")) {
      errorMsg = "Only PNG and GIF images are allowed!";
      return;
    }

    // Validate file size (30MB)
    if (file.size > 30 * 1024 * 1024) {
      errorMsg = "File too large (max 30MB)";
      return;
    }

    // Show file preview
    filePreview = URL.createObjectURL(file);

    // Start upload simulation
    isUploading = true;
    
    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After upload, check transparency
      await checkTransparency(file);
      
      uploadSuccess = true;
      dispatch('fileSelected', { file });
      
    } catch (error) {
      errorMsg = "Failed to upload file. Please try again.";
      console.error("Upload error:", error);
    } finally {
      isUploading = false;
    }
  }

  async function checkTransparency(file: File) {
    // Simulate transparency analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, generate random transparency percentage
    // In real implementation, you would use image processing to calculate actual transparency
    const transparencyPercentage = Math.floor(Math.random() * 100);
    const isValid = transparencyPercentage >= 10; // Minimum 10% transparency required
    
    transparencyInfo = {
      isValid,
      transparencyPercentage,
      error: isValid ? undefined : "Image must have at least 10% transparency for AR filters"
    };

    // Dispatch transparency info event
    dispatch('transparencyChecked', { transparencyInfo });
  }

  function resetUpload() {
    filePreview = null;
    selectedFile = null;
    uploadSuccess = false;
    transparencyInfo = null;
    errorMsg = null;
    
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
</script>

<div class="upload-section">
  <div class="upload-container">
    <h2 class="section-title">Upload AR Filter</h2>

    <!-- Client Selection Field -->
    <div class="form-group">
      <label for="client-select" class="form-label">Select Client</label>
      <div class="select-wrapper">
        <select
          id="client-select"
          bind:value={selectedClient}
          on:change={handleClientChange}
          class="client-select"
          disabled={isUploading || uploadSuccess}
        >
          {#each clients as client}
            <option value={client.id}>{client.name}</option>
          {/each}
        </select>
        <div class="select-arrow">
          <ChevronDown />
        </div>
      </div>
    </div>

    <div
      class="upload-area"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      class:uploading={isUploading}
      class:upload-success={uploadSuccess}
    >
      {#if isUploading}
        <div class="upload-icon"><Hourglass /></div>
        <div class="upload-text">
          <p class="upload-primary">Uploading your filter...</p>
          <p class="upload-secondary">
            Please wait while we process your image
          </p>
        </div>
      {:else if uploadSuccess}
        <div class="upload-icon"><CheckCircle /></div>
        <div class="upload-text">
          <p class="upload-primary">Upload successful!</p>
          <p class="upload-secondary">Your AR filter is ready to share</p>
        </div>
      {:else if filePreview}
        <div class="file-preview">
          <img src={filePreview} alt="Preview" class="preview-image" />
          <div class="preview-overlay">
            <button class="change-file-btn" on:click={resetUpload}>
              Change File
            </button>
          </div>
        </div>
      {:else}
        <div class="upload-icon"><Folder /></div>
        <div class="upload-text">
          <p class="upload-primary">
            Drag & drop your transparent PNG/GIF filter here
          </p>
          <p class="upload-secondary">
            or click to browse files • Must have transparent background
          </p>
        </div>
        <input
          type="file"
          accept="image/png,image/gif"
          on:change={handleFileInput}
          class="file-input"
          id="file-upload"
          disabled={isUploading}
        />
        <label for="file-upload" class="upload-btn">
          <span class="btn-icon"><CloudUpload /></span>
          Choose File
        </label>
      {/if}
    </div>

    <!-- File Preview Section -->
    {#if filePreview && !isUploading && !uploadSuccess}
      <div class="file-preview-section">
        <div class="preview-info">
          <div class="file-details">
            <div class="file-name">{selectedFile?.name}</div>
            <div class="file-size">{(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
          <button class="upload-action-btn" on:click={() => handleFileSelection(selectedFile!)}>
            <span class="btn-icon"><CloudUpload /></span>
            Upload Now
          </button>
        </div>
      </div>
    {/if}

    <div class="upload-info">
      <div class="info-item">
        <span class="info-icon"><HardDrive /></span>
        <span class="info-text">Maximum file size: 30MB</span>
      </div>
      <div class="info-item">
        <span class="info-icon"><FileImage /></span>
        <span class="info-text">Supported formats: PNG and GIF</span>
      </div>
      <div class="info-item">
        <span class="info-icon"><Blend /></span>
        <span class="info-text"
          >Must have transparent background (min 10%)</span
        >
      </div>
      <div class="info-item">
        <span class="info-icon"><Cloud /></span>
        <span class="info-text">Uploaded to cloud storage</span>
      </div>
    </div>

    {#if errorMsg}
      <div class="error-message">
        <span class="error-icon"><TriangleAlert /></span>
        {errorMsg}
      </div>
    {/if}

    {#if transparencyInfo}
      <div
        class="transparency-info {transparencyInfo.isValid
          ? 'valid'
          : 'invalid'}"
      >
        <div class="transparency-header">
          <span class="transparency-icon"
            >{transparencyInfo.isValid ? "✅" : "❌"}</span
          >
          <span class="transparency-title">Transparency Check</span>
        </div>
        <div class="transparency-details">
          <div class="transparency-percentage">
            {transparencyInfo.transparencyPercentage}% transparent
          </div>
          <div class="transparency-status">
            {transparencyInfo.isValid
              ? "Valid for AR filters"
              : "Insufficient transparency"}
          </div>
          {#if transparencyInfo.error}
            <div class="transparency-error">
              {transparencyInfo.error}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Success Actions -->
    <!-- {#if uploadSuccess}
      <div class="success-actions">
        <button class="action-btn primary" on:click={resetUpload}>
          <span class="btn-icon"><CloudUpload /></span>
          Upload Another Filter
        </button>
      </div>
    {/if} -->
  </div>
</div>
<style>
  .upload-section {
    margin-bottom: 2rem;
  }

  .upload-container {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }

  .section-title {
    color: #2d3748;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }

  /* Form Group Styles */
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    color: #2d3748;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .select-wrapper {
    position: relative;
    width: 100%;
  }

  .client-select {
    width: 100%;
    padding: 1rem 3rem 1rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f7fafc;
    color: #2d3748;
    font-size: 1rem;
    transition: all 0.3s ease;
    appearance: none;
    cursor: pointer;
  }

  .client-select:focus {
    outline: none;
    border-color: #6366f1;
    background: white;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .client-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f3f4f6;
  }

  .select-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    pointer-events: none;
    transition: transform 0.3s ease;
  }

  .client-select:focus + .select-arrow {
    transform: translateY(-50%) rotate(180deg);
  }

  .upload-area {
    position: relative;
    border: 3px dashed #cbd5e0;
    border-radius: 15px;
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    background: #f7fafc;
  }

  .upload-area:hover,
  .upload-area.drag-over {
    border-color: #6366f1;
    background: #eef2ff;
    transform: scale(1.02);
  }

  .upload-area.uploading {
    border-color: #f59e0b;
    background: #fffbeb;
    pointer-events: none;
  }

  .upload-area.upload-success {
    border-color: #10b981;
    background: #ecfdf5;
  }

  .upload-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .upload-text {
    margin-bottom: 1.5rem;
  }

  .upload-primary {
    color: #2d3748;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .upload-secondary {
    color: #718096;
    margin: 0;
    font-size: 1rem;
  }

  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .upload-btn {
    background: #1a8ef1;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .upload-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
  }

  .btn-icon {
    font-size: 1.3rem;
  }

  .upload-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #718096;
    font-size: 0.9rem;
  }

  .info-icon {
    font-size: 1.2rem;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    padding: 1rem;
    margin-top: 1rem;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .error-icon {
    font-size: 1.2rem;
  }

  .transparency-info {
    border-radius: 10px;
    padding: 1rem;
    margin-top: 1rem;
    transition: all 0.3s ease;
  }

  .transparency-info.valid {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .transparency-info.invalid {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .transparency-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
  }

  .transparency-icon {
    font-size: 1.2rem;
  }

  .transparency-title {
    color: #2d3748;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .transparency-details {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .transparency-percentage {
    color: #2d3748;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .transparency-status {
    color: #4a5568;
    font-size: 0.9rem;
  }

  .transparency-error {
    color: #718096;
    font-size: 0.9rem;
    font-style: italic;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .upload-container {
      padding: 1.5rem;
    }

    .upload-area {
      padding: 2rem 1rem;
    }

    .upload-icon {
      font-size: 3rem;
    }

    .upload-primary {
      font-size: 1.1rem;
    }

    .section-title {
      font-size: 1.5rem;
    }

    .upload-info {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .client-select {
      padding: 0.875rem 2.5rem 0.875rem 0.875rem;
      font-size: 0.9rem;
    }

    .select-arrow {
      right: 0.875rem;
    }
  }

  @media (max-width: 480px) {
    .upload-container {
      padding: 1rem;
    }

    .upload-area {
      padding: 1.5rem 0.5rem;
    }

    .upload-btn {
      padding: 0.8rem 1.5rem;
      font-size: 1rem;
    }

    .upload-info {
      grid-template-columns: 1fr;
    }

    .section-title {
      font-size: 1.3rem;
    }

    .form-label {
      font-size: 1rem;
    }

    .client-select {
      padding: 0.75rem 2.25rem 0.75rem 0.75rem;
      font-size: 0.85rem;
    }
  }
</style>