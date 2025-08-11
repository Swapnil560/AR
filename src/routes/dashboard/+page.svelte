<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getFilters, updateFilter } from '../../services/actions/filter.js';
  import QRCode from 'qrcode';

  let user = null;
  let filters = [];
  let loading = true;
  let error = '';
  let editingFilter = null;
  let editForm = {
    name: '',
    description: '',
    ai_need: false
  };

  onMount(async () => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      goto('/login');
      return;
    }
    
    user = JSON.parse(userData);
    
    // Redirect based on user role
    if (user.role === 'super_admin') {
      goto('/superadmin');
      return;
    } else if (user.role === 'admin') {
      goto('/admin');
      return;
    }
    
    await loadUserFilters();
  });

  async function loadUserFilters() {
    try {
      loading = true;
      console.log('Loading filters for user:', user);
      
      // Try multiple search methods
      let response;
      let filters_found = [];
      
      // Method 1: Search by user field
      try {
        console.log('Trying search: user:' + user.id);
        response = await getFilters({ search: `user:${user.id}` });
        console.log('Method 1 response:', response);
        
        if (!response.err) {
          filters_found = response.result ||[];
          console.log('Method 1 found filters:', filters_found);
        }
      } catch (e) {
        console.log('Method 1 failed:', e);
      }
      
     
      
      
      if (response && response.err) {
        error = 'Failed to load filters';
        console.error('API Error:', response.err);
        return;
      }
      
      filters = filters_found;
      console.log('Final filters to display:', filters);
      
      // Generate QR codes for each filter
      for (let filter of filters) {
        const filterLink = `${window.location.origin}/filter/ar?filter=${encodeURIComponent(filter.filter_url)}`;
        filter.qr_code = await QRCode.toDataURL(filterLink);
        filter.share_link = filterLink;
      }
    } catch (err) {
      error = 'Failed to load filters';
      console.error('Error loading filters:', err);
    } finally {
      loading = false;
    }
  }

  function logout() {
    localStorage.removeItem('user');
    goto('/login');
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  }

  function startEdit(filter) {
    editingFilter = filter.id;
    editForm = {
      name: filter.name || '',
      description: filter.description || '',
      ai_need: filter.ai_need || false
    };
  }

  function cancelEdit() {
    editingFilter = null;
    editForm = {
      name: '',
      description: '',
      ai_need: false
    };
  }

  async function saveEdit(filterId) {
    try {
      const response = await updateFilter({
        id: filterId,
        name: editForm.name,
        description: editForm.description,
        ai_need: editForm.ai_need
      });

      if (!response.err) {
        // Update the filter in the local array
        const filterIndex = filters.findIndex(f => f.id === filterId);
        if (filterIndex !== -1) {
          filters[filterIndex] = {
            ...filters[filterIndex],
            name: editForm.name,
            description: editForm.description,
            ai_need: editForm.ai_need
          };
          filters = [...filters]; // Trigger reactivity
        }
        cancelEdit();
      } else {
        console.error('Error updating filter:', response.err);
        error = 'Failed to update filter';
      }
    } catch (err) {
      console.error('Error updating filter:', err);
      error = 'Failed to update filter';
    }
  }

  async function deleteFilter(filterId) {
    if (!confirm('Are you sure you want to delete this filter?')) {
      return;
    }

    try {
      const response = await updateFilter({
        id: filterId,
        is_deleted: 1
      });

      if (!response.err) {
        // Remove the filter from the local array
        filters = filters.filter(f => f.id !== filterId);
      } else {
        console.error('Error deleting filter:', response.err);
        error = 'Failed to delete filter';
      }
    } catch (err) {
      console.error('Error deleting filter:', err);
      error = 'Failed to delete filter';
    }
  }
</script>

<svelte:head>
  <title>RongCam Dashboard - My AR Filters</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>

<div class="app-container">
  <header class="header">
    <div class="header-content">
      <h1 class="logo">
        <span class="logo-icon">📷</span>
        RongCam Dashboard
      </h1>
      <div class="header-actions">
        <span class="welcome-text">Welcome, {user?.name || 'User'}</span>
        <button class="logout-btn" on:click={logout}>
          <span class="logout-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="dashboard-header">
      <h2 class="dashboard-title">My AR Filters</h2>
      <a href="/admin" class="upload-btn">
        <span class="btn-icon">➕</span>
        Upload New Filter
      </a>
    </div>

    {#if loading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your filters...</p>
      </div>
    {:else if error}
      <div class="error-container">
        <span class="error-icon">⚠️</span>
        <p class="error-text">{error}</p>
        <button class="retry-btn" on:click={loadUserFilters}>Try Again</button>
      </div>
    {:else if filters.length === 0}
      <div class="empty-state">
        <div class="empty-icon">🎨</div>
        <h3 class="empty-title">No AR Filters Yet</h3>
        <p class="empty-text">Start creating amazing AR experiences by uploading your first filter.</p>
        <a href="/admin" class="upload-btn primary">
          <span class="btn-icon">📤</span>
          Upload Your First Filter
        </a>
      </div>
    {:else}
      <div class="filters-grid">
        
        
        {#each filters as filter (filter.id)}
          <div class="filter-card">
            <div class="filter-image">
              <img src={filter.filter_url} alt={filter.name || 'AR Filter'} />
              <div class="filter-type-badge">
                {filter.filter_url.includes('.gif') ? 'GIF' : 'PNG'}
              </div>
            </div>
            
            <div class="filter-content">
              {#if editingFilter === filter.id}
                <!-- Edit Mode -->
                <div class="edit-form">
                  <div class="form-group">
                    <label class="input-label">Filter Name:</label>
                    <input 
                      type="text" 
                      bind:value={editForm.name} 
                      class="edit-input"
                      placeholder="Enter filter name"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label class="input-label">Description:</label>
                    <textarea 
                      bind:value={editForm.description} 
                      class="edit-textarea"
                      placeholder="Enter filter description"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        bind:checked={editForm.ai_need} 
                        class="edit-checkbox"
                      />
                      AI Enhanced
                    </label>
                  </div>
                  
                  <div class="edit-actions">
                    <button class="save-btn" on:click={() => saveEdit(filter.id)}>
                      ✅ Save
                    </button>
                    <button class="cancel-btn" on:click={cancelEdit}>
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              {:else}
                <!-- View Mode -->
                <div class="filter-header">
                  <h3 class="filter-name">{filter.name || 'Untitled Filter'}</h3>
                  <div class="filter-actions-header">
                    <button class="edit-btn" on:click={() => startEdit(filter)} title="Edit filter">
                      ✏️
                    </button>
                    <button class="delete-btn" on:click={() => deleteFilter(filter.id)} title="Delete filter">
                      🗑️
                    </button>
                  </div>
                </div>
                
                <p class="filter-description">{filter.description || 'No description provided'}</p>
                
                <div class="filter-meta">
                  <div class="meta-item">
                    <span class="meta-label">AI Enhanced:</span>
                    <span class="meta-value {filter.ai_need ? 'yes' : 'no'}">
                      {filter.ai_need ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Created:</span>
                    <span class="meta-value">
                      {new Date(filter.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div class="filter-actions">
                  <div class="share-section">
                    <label class="input-label">Share Link:</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        value={filter.share_link} 
                        readonly 
                        class="share-input"
                      />
                      <button 
                        class="copy-btn"
                        on:click={() => copyToClipboard(filter.share_link)}
                        title="Copy link"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div class="qr-section">
                    <label class="input-label">QR Code:</label>
                    <div class="qr-container">
                      <img src={filter.qr_code} alt="QR Code" class="qr-image" />
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
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
  }

  .logo {
    color: white;
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .welcome-text {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .logout-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
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
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  }

  .logout-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }

  .logout-icon {
    font-size: 1.2rem;
  }

  .main-content {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .dashboard-title {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
  }

  .upload-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    text-decoration: none;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
    border: none;
    cursor: pointer;
  }

  .upload-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
  }

  .upload-btn.primary {
    font-size: 1.1rem;
    padding: 1.2rem 2.5rem;
  }

  .btn-icon {
    font-size: 1.2rem;
  }

  .loading-container, .error-container, .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .loading-text, .error-text {
    color: white;
    font-size: 1.2rem;
    margin: 0;
  }

  .error-icon, .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .empty-title {
    color: white;
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .empty-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    margin: 0 0 2rem 0;
    line-height: 1.5;
  }

  .retry-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 0.8rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 2rem;
  }

  .filter-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .filter-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  }

  .filter-image {
    position: relative;
    margin-bottom: 1rem;
  }

  .filter-image img {
    width: 100%;
    height: 200px;
    object-fit: contain;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
  }

  .filter-type-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .filter-content {
    color: white;
  }

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .filter-actions-header {
    display: flex;
    gap: 0.5rem;
  }

  .edit-btn, .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.3rem;
    border-radius: 5px;
    transition: all 0.3s ease;
  }

  .edit-btn:hover {
    background: rgba(76, 175, 80, 0.2);
    transform: scale(1.1);
  }

  .delete-btn:hover {
    background: rgba(244, 67, 54, 0.2);
    transform: scale(1.1);
  }

  .edit-form {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .edit-input, .edit-textarea {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 1rem;
    backdrop-filter: blur(10px);
    box-sizing: border-box;
  }

  .edit-input::placeholder, .edit-textarea::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .edit-textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: white;
    font-weight: 500;
  }

  .edit-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .save-btn, .cancel-btn {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .save-btn {
    background: linear-gradient(135deg, #4caf50, #45a049);
    color: white;
  }

  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  }

  .cancel-btn {
    background: linear-gradient(135deg, #f44336, #d32f2f);
    color: white;
  }

  .cancel-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(244, 67, 54, 0.4);
  }

  .filter-name {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .filter-description {
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 1rem 0;
    line-height: 1.4;
  }

  .filter-meta {
    margin-bottom: 1.5rem;
  }

  .meta-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .meta-label {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .meta-value {
    font-weight: 600;
  }

  .meta-value.yes {
    color: #4caf50;
  }

  .meta-value.no {
    color: #ff9800;
  }

  .filter-actions {
    display: grid;
    gap: 1rem;
  }

  .share-section, .qr-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 10px;
  }

  .input-label {
    display: block;
    color: white;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
  }

  .share-input {
    flex: 1;
    padding: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
  }

  .copy-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.8rem;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
    min-width: 50px;
  }

  .copy-btn:hover {
    transform: scale(1.05);
  }

  .qr-container {
    display: flex;
    justify-content: center;
  }

  .qr-image {
    width: 80px;
    height: 80px;
    background: white;
    padding: 5px;
    border-radius: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .dashboard-header {
      flex-direction: column;
      text-align: center;
    }

    .dashboard-title {
      font-size: 2rem;
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .logo {
      font-size: 1.5rem;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .filter-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-actions-header {
      align-self: flex-end;
    }

    .edit-actions {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .main-content {
      padding: 1rem;
    }

    .filter-card {
      padding: 1rem;
    }

    .dashboard-title {
      font-size: 1.8rem;
    }
  }
</style>
