<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getAllUsers, createUser, deleteUser, updateUserRole } from '../../services/actions/user.js';
  import { getFilters, updateFilter } from '../../services/actions/filter.js';

  let user = null;
  let activeTab = 'users';
  let loading = false;
  let loadingUsers = false;
  let loadingFilters = false;
  let error = '';
  let success = '';

  // User Management State
  let users = [];
  let totalUsers = 0;
  let showCreateAdminModal = false;
  let showUserModal = false;
  let selectedUser = null;
  
  // User pagination state
  let currentUsersPage = 1;
  let usersPerPage = 10;
  let totalUsersPages = 0;

  // Filter Management State
  let filters = [];
  let totalFilters = 0;
  let currentFiltersPage = 1;
  let filtersPerPage = 6;
  let totalFiltersPages = 0;
  let showFilterModal = false;
  let selectedFilter = null;

  // Create User Form
  let userForm = {
    name: '',
    email: '',
    phone: '',
    password: ''
  };

  onMount(() => {
    // Check if user is logged in and is super admin
    const userData = localStorage.getItem('user');
    if (!userData) {
      goto('/login');
      return;
    }
    
    user = JSON.parse(userData);
    if (user.role !== 'super_admin') {
      goto('/login');
      return;
    }

    loadData();
  });

  // Reactive statements for pagination
  $: if (activeTab === 'users' && user) {
    loadUsers();
  }
  
  $: if (activeTab === 'filters' && user && users.length > 0) {
    loadFilters();
  }

  async function loadData() {
    loading = true;
    try {
      // Load users first, then filters (so we can match user names)
      await loadUsers();
      await loadFilters();
    } catch (err) {
      error = 'Failed to load data';
    }
    loading = false;
  }

  async function loadUsers() {
    loadingUsers = true;
    try {
      const response = await getAllUsers({
        page: `${currentUsersPage},${usersPerPage}`,
        sort: "-created_at"
      });
      if (response.err) {
        error = 'Failed to load users';
        return;
      }
      users = response.result || [];
      totalUsers = response.count || 0;
      totalUsersPages = Math.ceil(totalUsers / usersPerPage);
    } catch (err) {
      error = 'Failed to load users';
      console.error('Error loading users:', err);
    } finally {
      loadingUsers = false;
    }
  }

  async function loadFilters() {
    loadingFilters = true;
    try {
      const response = await getFilters({ 
        page: `${currentFiltersPage},${filtersPerPage}`,
        sort: "-created_at"
      });
      if (response.err) {
        error = 'Failed to load filters';
        return;
      }
      
      // Get filters and match with user names
      const rawFilters = response.result || [];
      
      // Map user IDs to user names for quick lookup
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user.name;
      });
      
      // Add user_name to each filter based on user ID
      filters = rawFilters.map(filter => ({
        ...filter,
        user_name: userMap[filter.user] || 'Unknown'
      }));
      
      totalFilters = response.count || 0;
      totalFiltersPages = Math.ceil(totalFilters / filtersPerPage);
    } catch (err) {
      error = 'Failed to load filters';
      console.error('Error loading filters:', err);
    } finally {
      loadingFilters = false;
    }
  }

  async function refreshFiltersAfterUserChange() {
    if (activeTab === 'filters') {
      await loadFilters();
    }
  }

  async function handleCreateUser() {
    if (!userForm.name || !userForm.email || !userForm.password) {
      error = 'Please fill all required fields';
      return;
    }

    loading = true;
    try {
      const response = await createUser(userForm);
      if (response.err) {
        error = 'Failed to create user account';
        return;
      }
      
      success = 'User account created successfully';
      showCreateAdminModal = false;
      userForm = { name: '', email: '', phone: '', password: '' };
      
      // Refresh users with current pagination
      await loadUsers();
      await refreshFiltersAfterUserChange(); // Refresh filters to update user names
    } catch (err) {
      error = 'Failed to create user account';
    }
    loading = false;
  }

  async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    loading = true;
    try {
      const response = await deleteUser(userId);
      if (response.err) {
        error = 'Failed to delete user';
        return;
      }
      
      success = 'User deleted successfully';
      
      // Refresh current page data from server
      await loadUsers();
      
      // If current page becomes empty and it's not the first page, go to previous page
      if (users.length === 0 && currentUsersPage > 1) {
        currentUsersPage--;
        await loadUsers();
      }
      
      await refreshFiltersAfterUserChange(); // Refresh filters to update user names
    } catch (err) {
      error = 'Failed to delete user';
    }
    loading = false;
  }

  async function handleDeleteFilter(filterId) {
    if (!confirm('Are you sure you want to delete this filter? This action cannot be undone.')) {
      return;
    }

    loading = true;
    try {
      const response = await updateFilter({ id: filterId, is_deleted: 1 });
      if (response.err) {
        error = 'Failed to delete filter';
        return;
      }
      
      success = 'Filter deleted successfully';
      
      // Refresh current page data from server
      await loadFilters();
      
      // If current page becomes empty and it's not the first page, go to previous page
      if (filters.length === 0 && currentFiltersPage > 1) {
        currentFiltersPage--;
        await loadFilters();
      }
      
      showFilterModal = false;
    } catch (err) {
      error = 'Failed to delete filter';
    }
    loading = false;
  }

  async function handleRoleChange(userId, newRole) {
    loading = true;
    try {
      const response = await updateUserRole(userId, newRole);
      if (response.err) {
        error = 'Failed to update user role';
        return;
      }
      
      success = 'User role updated successfully';
      
      // Refresh current page data from server
      await loadUsers();
      showUserModal = false;
    } catch (err) {
      error = 'Failed to update user role';
    }
    loading = false;
  }

  function logout() {
    localStorage.removeItem('user');
    goto('/login');
  }

  function clearMessages() {
    error = '';
    success = '';
  }

  // Reset pagination when switching tabs
  async function switchTab(newTab) {
    if (activeTab === newTab) return; // Don't switch if already on the same tab
    
    activeTab = newTab;
    if (newTab === 'users') {
      currentUsersPage = 1;
      await loadUsers();
    } else if (newTab === 'filters') {
      currentFiltersPage = 1;
      if (users.length > 0) {
        await loadFilters();
      }
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  function getUserRoleBadge(role) {
    const roleColors = {
      'super_admin': 'super-admin',
      'admin': 'admin',
      'user': 'user'
    };
    return roleColors[role] || 'user';
  }

  async function goToPage(page) {
    if (page >= 1 && page <= totalFiltersPages && !loadingFilters) {
      currentFiltersPage = page;
      await loadFilters();
    }
  }

  async function nextPage() {
    if (currentFiltersPage < totalFiltersPages && !loadingFilters) {
      currentFiltersPage++;
      await loadFilters();
    }
  }

  async function prevPage() {
    if (currentFiltersPage > 1 && !loadingFilters) {
      currentFiltersPage--;
      await loadFilters();
    }
  }

  // User pagination functions
  async function goToUsersPage(page) {
    if (page >= 1 && page <= totalUsersPages && !loadingUsers) {
      currentUsersPage = page;
      await loadUsers();
    }
  }

  async function nextUsersPage() {
    if (currentUsersPage < totalUsersPages && !loadingUsers) {
      currentUsersPage++;
      await loadUsers();
    }
  }

  async function prevUsersPage() {
    if (currentUsersPage > 1 && !loadingUsers) {
      currentUsersPage--;
      await loadUsers();
    }
  }
</script>

<svelte:head>
  <title>Super Admin Dashboard - RongCam</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>

<div class="app-container">
  <header class="header">
    <div class="header-content">
      <h1 class="logo">
        <span class="logo-icon">👑</span>
        Super Admin Dashboard
      </h1>
      <div class="header-actions">
        <span class="welcome-text">Welcome, {user?.name || 'Super Admin'}</span>
        <button class="logout-btn" on:click={logout}>
          <span class="logout-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <!-- Statistics Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-number">{totalUsers}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎨</div>
        <div class="stat-info">
          <div class="stat-number">{totalFilters}</div>
          <div class="stat-label">Total Filters</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">�</div>
        <div class="stat-info">
          <div class="stat-number">{users.filter(u => u.role === 'user').length}</div>
          <div class="stat-label">Regular Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">�</div>
        <div class="stat-info">
          <div class="stat-number">{users.filter(u => u.role === 'super_admin').length}</div>
          <div class="stat-label">Super Admins</div>
        </div>
      </div>
    </div>

    <!-- Messages -->
    {#if error}
      <div class="alert alert-error">
        <span class="alert-icon">⚠️</span>
        {error}
        <button class="alert-close" on:click={clearMessages}>×</button>
      </div>
    {/if}

    {#if success}
      <div class="alert alert-success">
        <span class="alert-icon">✅</span>
        {success}
        <button class="alert-close" on:click={clearMessages}>×</button>
      </div>
    {/if}

    <!-- Tab Navigation -->
    <div class="tab-container">
      <div class="tab-nav">
        <button 
          class="tab-btn"
          class:active={activeTab === 'users'}
          class:loading={loadingUsers && activeTab === 'users'}
          disabled={loadingUsers || loadingFilters}
          on:click={() => switchTab('users')}
        >
          {#if loadingUsers && activeTab === 'users'}
            <div class="small-spinner"></div>
          {/if}
          👥 User Management
        </button>
        <button 
          class="tab-btn"
          class:active={activeTab === 'filters'}
          class:loading={loadingFilters && activeTab === 'filters'}
          disabled={loadingUsers || loadingFilters}
          on:click={() => switchTab('filters')}
        >
          {#if loadingFilters && activeTab === 'filters'}
            <div class="small-spinner"></div>
          {/if}
          🎨 Filter Management
        </button>
      </div>

      <!-- Users Tab -->
      {#if activeTab === 'users'}
        <div class="tab-content">
          <div class="section-header">
            <h2 class="section-title">User Management</h2>
            <button 
              class="action-btn primary"
              on:click={() => showCreateAdminModal = true}
            >
              <span class="btn-icon">➕</span>
              Create User Account
            </button>
          </div>

          <div class="table-container">
            {#if loadingUsers}
              <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Loading users...</p>
              </div>
            {:else}
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each users as user}
                    <tr>
                      <td class="user-name">
                        <div class="user-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>
                        <span class="role-badge {getUserRoleBadge(user.role)}">
                          {user.role}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div class="action-buttons">
                          <button 
                            class="action-btn small"
                            on:click={() => { selectedUser = user; showUserModal = true; }}
                          >
                            ✏️ view
                          </button>
                          {#if user.role !== 'super_admin'}
                            <button 
                              class="action-btn small danger"
                              on:click={() => handleDeleteUser(user.id)}
                            >
                              🗑️ Delete
                            </button>
                          {/if}
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>

          <!-- User Pagination Controls -->
          {#if totalUsersPages > 1}
            <div class="pagination">
              <div class="pagination-info">
                Showing {Math.min((currentUsersPage - 1) * usersPerPage + 1, totalUsers)} to {Math.min(currentUsersPage * usersPerPage, totalUsers)} of {totalUsers} users
              </div>
              <div class="pagination-controls">
                <button 
                  class="pagination-btn" 
                  disabled={currentUsersPage === 1 || loadingUsers}
                  on:click={prevUsersPage}
                >
                  ← Previous
                </button>
                
                {#each Array(totalUsersPages).fill().map((_, i) => i + 1) as page}
                  {#if page === 1 || page === totalUsersPages || (page >= currentUsersPage - 2 && page <= currentUsersPage + 2)}
                    <button 
                      class="pagination-btn"
                      class:active={page === currentUsersPage}
                      disabled={loadingUsers}
                      on:click={() => goToUsersPage(page)}
                    >
                      {page}
                    </button>
                  {:else if page === currentUsersPage - 3 || page === currentUsersPage + 3}
                    <span class="pagination-ellipsis">...</span>
                  {/if}
                {/each}
                
                <button 
                  class="pagination-btn"
                  disabled={currentUsersPage === totalUsersPages || loadingUsers}
                  on:click={nextUsersPage}
                >
                  Next →
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Filters Tab -->
      {#if activeTab === 'filters'}
        <div class="tab-content">
          <div class="section-header">
            <h2 class="section-title">Filter Management</h2>
          </div>

          <div class="table-container">
            {#if loadingFilters}
              <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Loading filters...</p>
              </div>
            {:else}
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Owner</th>
                    <th>AI Enhanced</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each filters as filter}
                    <tr>
                      <td>
                        <div class="filter-preview">
                          <img src={filter.filter_url} alt={filter.name} class="preview-img" />
                        </div>
                      </td>
                      <td class="filter-name">{filter.name}</td>
                      <td class="filter-description">
                        {filter.description || 'No description'}
                      </td>
                      <td>{filter.user_name || 'Unknown'}</td>
                      <td>
                        <span class="ai-badge {filter.ai_need ? 'ai-yes' : 'ai-no'}">
                          {filter.ai_need ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>{formatDate(filter.created_at)}</td>
                      <td>
                        <div class="action-buttons">
                          <button 
                            class="action-btn small"
                            on:click={() => { selectedFilter = filter; showFilterModal = true; }}
                          >
                            👁️ View
                          </button>
                          <button 
                            class="action-btn small danger"
                            on:click={() => handleDeleteFilter(filter.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>

          <!-- Pagination Controls -->
          {#if totalFiltersPages > 1}
            <div class="pagination">
              <div class="pagination-info">
                Showing {Math.min((currentFiltersPage - 1) * filtersPerPage + 1, totalFilters)} to {Math.min(currentFiltersPage * filtersPerPage, totalFilters)} of {totalFilters} filters
              </div>
              <div class="pagination-controls">
                <button 
                  class="pagination-btn" 
                  disabled={currentFiltersPage === 1 || loadingFilters}
                  on:click={prevPage}
                >
                  ← Previous
                </button>
                
                {#each Array(totalFiltersPages).fill().map((_, i) => i + 1) as page}
                  {#if page === 1 || page === totalFiltersPages || (page >= currentFiltersPage - 2 && page <= currentFiltersPage + 2)}
                    <button 
                      class="pagination-btn"
                      class:active={page === currentFiltersPage}
                      disabled={loadingFilters}
                      on:click={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  {:else if page === currentFiltersPage - 3 || page === currentFiltersPage + 3}
                    <span class="pagination-ellipsis">...</span>
                  {/if}
                {/each}
                
                <button 
                  class="pagination-btn"
                  disabled={currentFiltersPage === totalFiltersPages || loadingFilters}
                  on:click={nextPage}
                >
                  Next →
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </main>
</div>

<!-- Create User Modal -->
{#if showCreateAdminModal}
  <div class="modal-overlay" on:click={() => showCreateAdminModal = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Create User Account</h3>
        <button class="modal-close" on:click={() => showCreateAdminModal = false}>×</button>
      </div>
      <div class="modal-body">
        <form on:submit|preventDefault={handleCreateUser}>
          <div class="form-group">
            <label for="user-name">Full Name *</label>
            <input 
              id="user-name"
              type="text" 
              bind:value={userForm.name}
              placeholder="Enter full name"
              required
            />
          </div>
          <div class="form-group">
            <label for="user-email">Email *</label>
            <input 
              id="user-email"
              type="email" 
              bind:value={userForm.email}
              placeholder="Enter email address"
              required
            />
          </div>
          <div class="form-group">
            <label for="user-phone">Phone</label>
            <input 
              id="user-phone"
              type="tel" 
              bind:value={userForm.phone}
              placeholder="Enter phone number"
            />
          </div>
          <div class="form-group">
            <label for="user-password">Password *</label>
            <input 
              id="user-password"
              type="password" 
              bind:value={userForm.password}
              placeholder="Enter password"
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" class="action-btn secondary" on:click={() => showCreateAdminModal = false}>
              Cancel
            </button>
            <button type="submit" class="action-btn primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- User Edit Modal -->
{#if showUserModal && selectedUser}
  <div class="modal-overlay" on:click={() => showUserModal = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Edit User: {selectedUser.name}</h3>
        <button class="modal-close" on:click={() => showUserModal = false}>×</button>
      </div>
      <div class="modal-body">
        <div class="user-details">
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">{selectedUser.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">{selectedUser.email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">{selectedUser.phone || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Current Role:</span>
            <span class="role-badge {getUserRoleBadge(selectedUser.role)}">
              {selectedUser.role}
            </span>
          </div>
        </div>
        
        {#if selectedUser.role !== 'super_admin'}
          <div class="role-change">
            <h4>Change Role</h4>
            <div class="role-options">
              <button 
                class="role-btn {selectedUser.role === 'user' ? 'active' : ''}"
                on:click={() => handleRoleChange(selectedUser.id, 'user')}
              >
                👤 User
              </button>
              <button 
                class="role-btn {selectedUser.role === 'super_admin' ? 'active' : ''}"
                on:click={() => handleRoleChange(selectedUser.id, 'super_admin')}
              >
                � Super Admin
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Filter View Modal -->
{#if showFilterModal && selectedFilter}
  <div class="modal-overlay" on:click={() => showFilterModal = false}>
    <div class="modal large" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Filter Details: {selectedFilter.name}</h3>
        <button class="modal-close" on:click={() => showFilterModal = false}>×</button>
      </div>
      <div class="modal-body">
        <div class="filter-details">
          <div class="filter-image">
            <img src={selectedFilter.filter_url} alt={selectedFilter.name} />
          </div>
          <div class="filter-info">
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">{selectedFilter.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">{selectedFilter.description || 'No description'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Owner:</span>
              <span class="detail-value">{selectedFilter.user_name || 'Unknown'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">AI Enhanced:</span>
              <span class="ai-badge {selectedFilter.ai_need ? 'ai-yes' : 'ai-no'}">
                {selectedFilter.ai_need ? 'Yes' : 'No'}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{formatDate(selectedFilter.created_at)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Filter URL:</span>
              <span class="detail-value url">{selectedFilter.filter_url}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button 
            class="action-btn danger"
            on:click={() => handleDeleteFilter(selectedFilter.id)}
          >
            🗑️ Delete Filter
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

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
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
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

  .main-content {
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 15px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    font-size: 2rem;
    opacity: 0.8;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .alert {
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }

  .alert-error {
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.4);
    color: #ffb3b3;
  }

  .alert-success {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.4);
    color: #a5d6a7;
  }

  .alert-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
    margin-left: auto;
  }

  .tab-container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .tab-nav {
    display: flex;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tab-btn {
    flex: 1;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 1rem 2rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
  }

  .tab-btn.active {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .tab-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .tab-btn.loading {
    position: relative;
  }

  .small-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 0.5rem;
  }

  .tab-content {
    padding: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .section-title {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .action-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.8rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(68, 160, 141, 0.3);
    text-decoration: none;
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(68, 160, 141, 0.4);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
  }

  .action-btn.secondary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .action-btn.danger {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  }

  .action-btn.small {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .table-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .data-table td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
  }

  .data-table tr:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .user-name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .role-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .role-badge.super-admin {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
  }

  .role-badge.admin {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
  }

  .role-badge.user {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }

  .ai-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .ai-badge.ai-yes {
    background: rgba(76, 175, 80, 0.3);
    color: #4caf50;
  }

  .ai-badge.ai-no {
    background: rgba(255, 152, 0, 0.3);
    color: #ff9800;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-preview {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .filter-name {
    font-weight: 600;
    color: white;
  }

  .filter-description {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .modal.large {
    max-width: 800px;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    color: white;
    margin: 0;
    font-size: 1.3rem;
  }

  .modal-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close:hover {
    color: white;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    color: white;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .form-group input {
    width: 100%;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    backdrop-filter: blur(10px);
    box-sizing: border-box;
  }

  .form-group input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .form-group input:focus {
    outline: none;
    border-color: rgba(78, 205, 196, 0.8);
    background: rgba(255, 255, 255, 0.15);
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .user-details, .filter-details {
    margin-bottom: 2rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  .detail-value {
    color: white;
    font-weight: 600;
  }

  .detail-value.url {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  .role-change {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1.5rem;
  }

  .role-change h4 {
    color: white;
    margin: 0 0 1rem 0;
  }

  .role-options {
    display: flex;
    gap: 1rem;
  }

  .role-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    padding: 1rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
  }

  .role-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .role-btn.active {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    border-color: #4ecdc4;
    color: white;
  }

  .filter-details {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 2rem;
    align-items: start;
  }

  .filter-image img {
    width: 100%;
    height: auto;
    border-radius: 10px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }

  .modal-actions {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1.5rem;
    display: flex;
    justify-content: center;
  }

  /* Pagination Styles */
  .pagination {
    margin-top: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .pagination-info {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .pagination-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .pagination-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-color: rgba(255, 255, 255, 0.4);
  }

  .pagination-btn.active {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    border-color: #4ecdc4;
    color: white;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-dots {
    color: rgba(255, 255, 255, 0.6);
    padding: 0 0.5rem;
  }

  /* Loading Styles */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top: 4px solid #4ecdc4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .logo {
      font-size: 1.5rem;
    }

    .main-content {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      padding: 1rem;
      flex-direction: column;
      text-align: center;
    }

    .section-header {
      flex-direction: column;
      align-items: stretch;
    }

    .tab-nav {
      flex-direction: column;
    }

    .tab-content {
      padding: 1rem;
    }

    .data-table {
      font-size: 0.9rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.8rem 0.5rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .modal {
      margin: 0.5rem;
      max-width: none;
    }

    .filter-details {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .role-options {
      flex-direction: column;
    }

    .pagination {
      flex-direction: column;
      text-align: center;
    }

    .pagination-controls {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .header-actions {
      flex-direction: column;
      gap: 0.8rem;
    }

    .logout-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.6rem 0.3rem;
      font-size: 0.8rem;
    }

    .user-name {
      flex-direction: column;
      gap: 0.3rem;
      text-align: center;
    }

    .user-avatar {
      width: 30px;
      height: 30px;
      font-size: 0.9rem;
    }

    .pagination-btn {
      padding: 0.5rem 0.8rem;
      font-size: 0.8rem;
    }

    .pagination-info {
      font-size: 0.8rem;
      text-align: center;
    }
  }
</style>
