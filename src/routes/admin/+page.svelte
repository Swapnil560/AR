<script lang="ts">
  import QRCode from 'qrcode';
  import { uploadImage, compressImage, validateTransparency } from '$lib/imageUpload';
  import { saveFilter } from '../../services/actions/filter.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let file: File | null = null;
  let filterPreview: string | null = null;
  let errorMsg: string | null = null;
  let filterLink: string | null = null;
  let qrCodeUrl: string | null = null;
  let isUploading: boolean = false;
  let uploadSuccess: boolean = false;
  let user = null;
  let transparencyInfo: { isValid: boolean; transparencyPercentage: number; error?: string } | null = null;

  // Filter details form
  let filterForm = {
    name: '',
    description: '',
    ai_need: false
  };

  onMount(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      goto('/login');
      return;
    }
    user = JSON.parse(userData);
    
    // Redirect super admin to super admin page
    if (user.role === 'super_admin') {
      goto('/superadmin');
      return;
    }
    
    // Only allow admin access
    if (user.role !== 'admin') {
      goto('/login');
      return;
    }
  });

  function logout() {
    localStorage.removeItem('user');
    goto('/login');
  }

  function resetState() {
    filterPreview = null;
    errorMsg = null;
    filterLink = null;
    qrCodeUrl = null;
    isUploading = false;
    uploadSuccess = false;
    transparencyInfo = null;
    filterForm = {
      name: '',
      description: '',
      ai_need: false
    };
  }

  async function handleUpload(event) {
    resetState();
    file = event.target.files[0];
    if (!file) return;

    // Check file type - allow PNG and GIF
    if (!file.type.startsWith('image/png') && !file.type.startsWith('image/gif')) {
      errorMsg = 'Only PNG and GIF images are allowed!';
      return;
    }
    
    // Updated file size limit to 30MB
    if (file.size > 30 * 1024 * 1024) {
      errorMsg = 'File too large (max 30MB)';
      return;
    }

    // Show preview first
    filterPreview = URL.createObjectURL(file);
    
    // Validate transparency
    try {
      transparencyInfo = await validateTransparency(file);
      if (!transparencyInfo.isValid) {
        errorMsg = transparencyInfo.error || 'Image does not meet transparency requirements';
        return;
      }
    } catch (error) {
      console.error('Transparency validation error:', error);
      errorMsg = 'Failed to validate image transparency. Please try again.';
      return;
    }
  }

  async function uploadFilter() {
    if (!file) return;

    // Validate form
    if (!filterForm.name.trim()) {
      errorMsg = 'Please enter a filter name';
      return;
    }

    // Re-validate transparency before upload
    if (!transparencyInfo?.isValid) {
      errorMsg = 'Image transparency validation failed. Please upload a valid transparent image.';
      return;
    }

    isUploading = true;
    errorMsg = null;

    try {
      // Compress the image (if PNG)
      let imageToUpload = file;
      if (file.type.startsWith('image/png')) {
        imageToUpload = await compressImage(file);
      }
      
      // Upload to server
      const uploadedImageUrl = await uploadImage(imageToUpload, 'filters');
      
      // Construct full image URL
      const fullImageUrl = `${import.meta.env.VITE_IMAGE_URL}${uploadedImageUrl}`;
      
      if(!user?.id) {
        errorMsg = "User not found. Please login again.";
        return;
      }
      
      // Save filter to database with additional details
      const filterData = {
        user: user.id,
        filter_url: fullImageUrl,
        name: filterForm.name.trim(),
        description: filterForm.description.trim(),
        ai_need: filterForm.ai_need
      };
      
      console.log('Saving filter with data:', filterData);
      const res = await saveFilter(filterData);
      console.log('Save filter response:', res);
      
      if (res.err) {
        console.error('Filter save error:', res.err);
        errorMsg = "Failed to upload filter. Please try again.";
        return;
      }
      
      filterLink = `${window.location.origin}/filter/ar?filter=${encodeURIComponent(fullImageUrl)}`;
      qrCodeUrl = await QRCode.toDataURL(filterLink);
      uploadSuccess = true;
      
    } catch (error) {
      console.error('Upload failed:', error);
      errorMsg = 'Failed to upload image. Please try again.';
    } finally {
      isUploading = false;
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  }

  function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const fakeEvent = { target: { files: [files[0]] } };
      handleUpload(fakeEvent);
    }
  }
</script>

<svelte:head>
  <title>RongCam Admin - AR Filter Management</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>

<div class="app-container">
  <header class="header">
    <div class="header-content">
      <h1 class="logo">
        <span class="logo-icon">⚙️</span>
        RongCam Admin
      </h1>
      <div class="header-actions">
        <a href="/dashboard" class="dashboard-btn">
          <span class="btn-icon">📊</span>
          Dashboard
        </a>
        <span class="welcome-text">Welcome, {user?.name || 'Admin'}</span>
        <button class="logout-btn" on:click={logout}>
          <span class="logout-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
    <p class="tagline">AR Filter Management Dashboard</p>
  </header>

  <main class="main-content">
    <div class="upload-section">
      <div class="upload-container">
        <h2 class="section-title">🎨 Upload AR Filter</h2>
        
        <div 
          class="upload-area"
          on:dragover={handleDragOver}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop}
          class:uploading={isUploading}
          class:upload-success={uploadSuccess}
        >
          {#if isUploading}
            <div class="upload-icon">⏳</div>
            <div class="upload-text">
              <p class="upload-primary">Uploading your filter...</p>
              <p class="upload-secondary">Please wait while we process your image</p>
            </div>
          {:else if uploadSuccess}
            <div class="upload-icon">✅</div>
            <div class="upload-text">
              <p class="upload-primary">Upload successful!</p>
              <p class="upload-secondary">Your AR filter is ready to share</p>
            </div>
          {:else}
            <div class="upload-icon">📁</div>
            <div class="upload-text">
              <p class="upload-primary">Drag & drop your transparent PNG/GIF filter here</p>
              <p class="upload-secondary">or click to browse files • Must have transparent background</p>
            </div>
            <input 
              type="file" 
              accept="image/png,image/gif" 
              on:change={handleUpload} 
              class="file-input"
              id="file-upload"
              disabled={isUploading}
            />
            <label for="file-upload" class="upload-btn">
              <span class="btn-icon">📤</span>
              Choose File
            </label>
          {/if}
        </div>

        <div class="upload-info">
          <div class="info-item">
            <span class="info-icon">📏</span>
            <span class="info-text">Maximum file size: 30MB</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🖼️</span>
            <span class="info-text">Supported formats: PNG and GIF</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🎭</span>
            <span class="info-text">Must have transparent background (min 10%)</span>
          </div>
          <div class="info-item">
            <span class="info-icon">☁️</span>
            <span class="info-text">Uploaded to cloud storage</span>
          </div>
        </div>

        {#if errorMsg}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {errorMsg}
          </div>
        {/if}

        {#if transparencyInfo && filterPreview}
          <div class="transparency-info {transparencyInfo.isValid ? 'valid' : 'invalid'}">
            <div class="transparency-header">
              <span class="transparency-icon">{transparencyInfo.isValid ? '✅' : '❌'}</span>
              <span class="transparency-title">Transparency Check</span>
            </div>
            <div class="transparency-details">
              <div class="transparency-percentage">
                {transparencyInfo.transparencyPercentage}% transparent
              </div>
              <div class="transparency-status">
                {transparencyInfo.isValid ? 'Valid for AR filters' : 'Insufficient transparency'}
              </div>
              {#if transparencyInfo.error}
                <div class="transparency-error">
                  {transparencyInfo.error}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if filterPreview}
      <div class="filter-details-section">
        <div class="details-container">
          <h3 class="section-title">📝 Filter Details</h3>
          
          <form class="filter-form" on:submit|preventDefault={uploadFilter}>
            <div class="form-group">
              <label for="filter-name" class="form-label">Filter Name *</label>
              <input 
                id="filter-name"
                type="text" 
                bind:value={filterForm.name}
                placeholder="Enter a unique name for your filter"
                required
                class="form-input"
                disabled={isUploading}
              />
            </div>

            <div class="form-group">
              <label for="filter-description" class="form-label">Description</label>
              <textarea 
                id="filter-description"
                bind:value={filterForm.description}
                placeholder="Describe what makes this filter special..."
                rows="3"
                class="form-textarea"
                disabled={isUploading}
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  bind:checked={filterForm.ai_need}
                  class="checkbox-input"
                  disabled={isUploading}
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">This filter requires AI enhancement</span>
              </label>
            </div>

            <button 
              type="submit" 
              class="submit-btn"
              disabled={isUploading || !filterForm.name.trim() || !transparencyInfo?.isValid}
            >
              {#if isUploading}
                <div class="btn-spinner"></div>
                Uploading...
              {:else}
                <span class="btn-icon">🚀</span>
                Upload & Generate Link
              {/if}
            </button>
          </form>
        </div>
      </div>

      {#if filterLink}
        <div class="preview-section">
          <div class="preview-container">
            <h3 class="section-title">👁️ Filter Preview</h3>
            <div class="filter-preview">
              <img src={filterPreview} class="preview-image" alt="Filter preview" />
              <div class="preview-info">
                <div class="file-info">
                  <span class="info-label">Type:</span>
                  <span class="info-value">{file?.type.includes('gif') ? 'Animated GIF' : 'PNG Image'}</span>
                </div>
                <div class="file-info">
                  <span class="info-label">Size:</span>
                  <span class="info-value">{(file?.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {#if transparencyInfo}
                  <div class="file-info">
                    <span class="info-label">Transparency:</span>
                    <span class="info-value {transparencyInfo.isValid ? 'valid-transparency' : 'invalid-transparency'}">
                      {transparencyInfo.transparencyPercentage}%
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/if}

    {#if filterLink}
      <div class="share-section">
        <div class="share-container">
          <h3 class="section-title">🎉 Filter Successfully Created!</h3>
          
          <div class="filter-summary">
            <div class="summary-item">
              <span class="summary-label">Filter Name:</span>
              <span class="summary-value">{filterForm.name}</span>
            </div>
            {#if filterForm.description}
              <div class="summary-item">
                <span class="summary-label">Description:</span>
                <span class="summary-value">{filterForm.description}</span>
              </div>
            {/if}
            <div class="summary-item">
              <span class="summary-label">AI Enhanced:</span>
              <span class="summary-value {filterForm.ai_need ? 'ai-yes' : 'ai-no'}">
                {filterForm.ai_need ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          <div class="share-content">
            <div class="link-section">
              <label class="input-label">Share Link</label>
              <div class="input-group">
                <input 
                  type="text" 
                  value={filterLink} 
                  readonly 
                  class="share-input"
                />
                <button 
                  class="copy-btn"
                  on:click={() => navigator.clipboard.writeText(filterLink)}
                >
                  📋
                </button>
              </div>
            </div>

            {#if qrCodeUrl}
              <div class="qr-section">
                <label class="input-label">QR Code</label>
                <div class="qr-container">
                  <img src={qrCodeUrl} alt="QR Code" class="qr-image" />
                  <p class="qr-text">Scan to access AR camera</p>
                </div>
              </div>
            {/if}
          </div>

          <div class="action-buttons">
            <a href="/dashboard" class="dashboard-link-btn">
              <span class="btn-icon">📊</span>
              View Dashboard
            </a>
            <button class="new-filter-btn" on:click={resetState}>
              <span class="btn-icon">➕</span>
              Upload Another Filter
            </button>
          </div>

          <div class="demo-notice">
            <div class="notice-icon">☁️</div>
            <div class="notice-content">
              <p class="notice-title">Successfully Saved</p>
              <p class="notice-text">
                Your AR filter "{filterForm.name}" has been uploaded to cloud storage and saved to the database. 
                You can view all your filters and their analytics in your dashboard.
              </p>
            </div>
          </div>
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .welcome-text {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .dashboard-btn, .logout-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 0.8rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(68, 160, 141, 0.3);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .logout-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  }

  .dashboard-btn:hover, .logout-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(68, 160, 141, 0.4);
  }

  .logout-btn:hover {
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }

  .tagline {
    color: rgba(255, 255, 255, 0.9);
    margin: 0.5rem 0 0 0;
    font-size: 1.1rem;
    font-weight: 300;
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

  .main-content {
    flex: 1;
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .upload-section, .preview-section, .share-section, .filter-details-section {
    margin-bottom: 2rem;
  }

  .upload-container, .preview-container, .share-container, .details-container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .section-title {
    color: white;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  .upload-area {
    position: relative;
    border: 3px dashed rgba(255, 255, 255, 0.4);
    border-radius: 15px;
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
  }

  .upload-area:hover, .upload-area.drag-over {
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.02);
  }

  .upload-area.uploading {
    border-color: rgba(255, 193, 7, 0.8);
    background: rgba(255, 193, 7, 0.1);
    pointer-events: none;
  }

  .upload-area.upload-success {
    border-color: rgba(76, 175, 80, 0.8);
    background: rgba(76, 175, 80, 0.1);
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
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .upload-secondary {
    color: rgba(255, 255, 255, 0.7);
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
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
    transition: all 0.3s ease;
    pointer-events: none;
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
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }

  .info-icon {
    font-size: 1.2rem;
  }

  .error-message {
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.4);
    border-radius: 10px;
    padding: 1rem;
    margin-top: 1rem;
    color: #ffb3b3;
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
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.4);
  }

  .transparency-info.invalid {
    background: rgba(255, 152, 0, 0.2);
    border: 1px solid rgba(255, 152, 0, 0.4);
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
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .transparency-details {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .transparency-percentage {
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .transparency-status {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
  }

  .transparency-error {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-style: italic;
  }

  .filter-preview {
    text-align: center;
  }

  .preview-image {
    max-width: 100%;
    max-height: 400px;
    border-radius: 15px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  }

  .share-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .link-section, .qr-section {
    text-align: center;
  }

  .input-label {
    display: block;
    color: white;
    font-weight: 600;
    margin-bottom: 0.8rem;
    font-size: 1.1rem;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .share-input {
    flex: 1;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 1rem;
    backdrop-filter: blur(10px);
  }

  .share-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .copy-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 1rem;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.3s ease;
    min-width: 60px;
  }

  .copy-btn:hover {
    transform: scale(1.05);
  }

  .qr-container {
    display: inline-block;
    background: white;
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  }

  .qr-image {
    display: block;
    max-width: 200px;
    margin: 0 auto;
  }

  .qr-text {
    margin: 1rem 0 0 0;
    color: #333;
    font-weight: 500;
  }

  .demo-notice {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.4);
    border-radius: 15px;
    padding: 1.5rem;
    margin-top: 2rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .notice-icon {
    font-size: 1.5rem;
    margin-top: 0.2rem;
  }

  .notice-title {
    color: #4caf50;
    font-weight: 600;
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
  }

  .notice-text {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.5;
  }

  /* Form Styles */
  .filter-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .form-input, .form-textarea {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 1rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: rgba(78, 205, 196, 0.8);
    background: rgba(255, 255, 255, 0.15);
  }

  .form-input::placeholder, .form-textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    color: white;
    font-weight: 500;
  }

  .checkbox-input {
    display: none;
  }

  .checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    position: relative;
    transition: all 0.3s ease;
  }

  .checkbox-input:checked + .checkbox-custom {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    border-color: #4ecdc4;
  }

  .checkbox-input:checked + .checkbox-custom::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 12px;
  }

  .submit-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 1.2rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
    transition: all 0.3s ease;
    margin-top: 1rem;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .preview-info {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    gap: 2rem;
  }

  .file-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }

  .info-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .info-value {
    color: white;
    font-weight: 600;
  }

  .info-value.valid-transparency {
    color: #4caf50;
  }

  .info-value.invalid-transparency {
    color: #ff9800;
  }

  .filter-summary {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
  }

  .summary-item:last-child {
    margin-bottom: 0;
  }

  .summary-label {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  .summary-value {
    color: white;
    font-weight: 600;
  }

  .summary-value.ai-yes {
    color: #4caf50;
  }

  .summary-value.ai-no {
    color: #ff9800;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 2rem 0;
    flex-wrap: wrap;
  }

  .dashboard-link-btn, .new-filter-btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    text-decoration: none;
    border: none;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  .new-filter-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
  }

  .dashboard-link-btn:hover, .new-filter-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
  }

  .new-filter-btn:hover {
    box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (min-width: 768px) {
    .share-content {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }

    .logo {
      justify-content: flex-start;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .header-actions {
      justify-content: center;
    }

    .logo {
      font-size: 2rem;
      justify-content: center;
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

    .upload-container, .preview-container, .share-container, .details-container {
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

    .input-group {
      flex-direction: column;
    }

    .copy-btn {
      align-self: center;
      max-width: 200px;
    }

    .demo-notice {
      flex-direction: column;
      text-align: center;
    }

    .action-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .preview-info {
      flex-direction: column;
      gap: 1rem;
    }
  }

  @media (max-width: 480px) {
    .logo {
      font-size: 1.8rem;
    }

    .upload-container, .preview-container, .share-container, .details-container {
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

    .header-actions {
      flex-direction: column;
      gap: 0.8rem;
    }

    .dashboard-btn, .logout-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.8rem;
    }

    .submit-btn {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }
</style>
