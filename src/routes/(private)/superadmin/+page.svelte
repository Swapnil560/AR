<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getHost } from "$lib/utils";
  import {
    getAllUsers,
    createUser,
    deleteUser,
    updateUserRole,
  } from "../../../services/actions/user.js";
  import {
    getFilters,
    getAllFilters,
    updateFilter,
  } from "../../../services/actions/filter.js";
  import {
    getPricePlans,
    savePricePlan,
    updatePricePlan,
    deletePricePlan,
  } from "../../../services/actions/price-plans.js";
  import {
    Eye,
    IndianRupee,
    LogOut,
    Palette,
    Pencil,
    Plus,
    Trash2,
    User,
    Users,
    LayoutDashboard,
    User2,
  } from "lucide-svelte";
  import { CreditCard, Proportions } from "@lucide/svelte";
  import mobile from "../../../lib/assets/SVG.png";
  import photo from "../../../lib/assets/SVG (2).png";
  import camera from "../../../lib/assets/SVG (1).png";
  import cross from "../../../lib/assets/SVG (3).png";
  import filter from "../../../lib/assets/Vintage filter preview.png";
  import piechart from "../../../lib/assets/Container.png";
  import graph from "../../../lib/assets/SVG (4).png";
  import Header from "../../../components/Header.svelte";
  import Sidebar from "../../../components/Sidebar.svelte";
  import Dashboard from "./dashboard.svelte";
  import ImageUpload from "./ImageUpload.svelte";
  import Client from "./client.svelte";
  import FilterGrid from "./filterGrid.svelte";

  let user = null;
  let activeSection = "dashboard";
  let loading = false;
  let loadingUsers = false;
  let loadingFilters = false;
  let loadingPlans = false;
  let error = "";
  let success = "";

  // Image Upload State
  let showImageUpload = false;
  let isUploading = false;
  let uploadSuccess = false;
  let transparencyInfo: {
    isValid: boolean;
    transparencyPercentage: number;
    error?: string;
  } | null = null;

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
  let includeDeletedFilters = false;

  // Price Plan Management State
  let pricePlans = [];
  let totalPlans = 0;
  let currentPlansPage = 1;
  let plansPerPage = 6;
  let totalPlansPages = 0;
  let showPlanModal = false;
  let showCreatePlanModal = false;
  let selectedPlan = null;
  let editingPlan = false;

  // Create User Form
  let userForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
  };

  // Price Plan Form
  let planForm = {
    name: "",
    monthly_price: "",
    yearly_price: "",
    filters: "",
    ai_elements: "",
    storage: "",
    features: "",
  };

  // Dashboard Statistics
  let dashboardStats = {
    totalUsers: 0,
    totalFilters: 0,
    regularUsers: 0,
    superAdmins: 0,
  };

  // Dynamic title based on active section
  $: sectionTitle = getSectionTitle(activeSection);

  function getSectionTitle(section: string): string {
    const titles = {
      dashboard: "Dashboard",
      users: "User Management",
      filters: "Filters",
      reports: "Reports",
      profile: "Profile",
      plans: "Price Plans",
    };
    return titles[section] || "Dashboard";
  }

  // Image Upload Handlers
  function handleFileSelected(event) {
    const file = event.detail.file;
    console.log("File selected:", file);
    // Add your file processing logic here
  }

  function handleCreateFilter() {
    showImageUpload = true;
  }

  function handleCloseImageUpload() {
    showImageUpload = false;
    isUploading = false;
    uploadSuccess = false;
    transparencyInfo = null;
    error = "";
  }

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get("auth");

    if (authParam) {
      try {
        const userData = JSON.parse(atob(authParam));
        console.log("User data from URL:", userData);
        localStorage.setItem("user", JSON.stringify(userData));
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        user = userData;
      } catch (error) {
        console.error("Error parsing auth parameter:", error);
        goto("/login");
        return;
      }
    } else {
      const userData = localStorage.getItem("user");
      if (!userData) {
        goto("/login");
        return;
      }
      user = JSON.parse(userData);
    }

    if (user.role !== "super_admin") {
      goto("/login");
      return;
    }

    loadData();
  });

  // Reactive statements for pagination
  $: if (activeSection === "users" && user) {
    loadUsers();
  }

  $: if (activeSection === "filters" && user && users.length > 0) {
    loadFilters();
  }

  $: if (activeSection === "plans" && user) {
    loadPlans();
  }

  $: if (
    includeDeletedFilters !== undefined &&
    activeSection === "filters" &&
    user &&
    users.length > 0
  ) {
    currentFiltersPage = 1;
    loadFilters();
  }

  $: if (users.length > 0) {
    updateDashboardStats();
  }

  function updateDashboardStats() {
    dashboardStats = {
      totalUsers: totalUsers,
      totalFilters: totalFilters,
      regularUsers: users.filter((u) => u.role === "user").length,
      superAdmins: users.filter((u) => u.role === "super_admin").length,
    };
  }

  async function loadData() {
    loading = true;
    try {
      await loadUsers();
      await loadFilters();
      await loadPlans();
    } catch (err) {
      error = "Failed to load data";
    }
    loading = false;
  }

  async function loadUsers() {
    loadingUsers = true;
    try {
      const response = await getAllUsers({
        page: `${currentUsersPage},${usersPerPage}`,
        sort: "-created_at",
      });
      if (response.err) {
        error = "Failed to load users";
        return;
      }
      users = response.result || [];
      totalUsers = response.count || 0;
      totalUsersPages = Math.ceil(totalUsers / usersPerPage);
      updateDashboardStats();
    } catch (err) {
      error = "Failed to load users";
      console.error("Error loading users:", err);
    } finally {
      loadingUsers = false;
    }
  }

  async function loadFilters() {
    loadingFilters = true;
    try {
      const response = includeDeletedFilters
        ? await getAllFilters({
            page: `${currentFiltersPage},${filtersPerPage}`,
            sort: "-created_at",
            includeDeleted: true,
          })
        : await getFilters({
            page: `${currentFiltersPage},${filtersPerPage}`,
            sort: "-created_at",
          });
      if (response.err) {
        error = "Failed to load filters";
        return;
      }

      const rawFilters = response.result || [];
      const userMap = {};
      users.forEach((user) => {
        userMap[user.id] = user.name;
      });

      filters = rawFilters.map((filter) => ({
        ...filter,
        user_name: userMap[filter.user] || "Unknown",
      }));

      totalFilters = response.count || 0;
      totalFiltersPages = Math.ceil(totalFilters / filtersPerPage);
      updateDashboardStats();
    } catch (err) {
      error = "Failed to load filters";
      console.error("Error loading filters:", err);
    } finally {
      loadingFilters = false;
    }
  }

  async function loadPlans() {
    loadingPlans = true;
    try {
      const response = await getPricePlans({
        page: currentPlansPage,
        sort: "-created_at",
      });

      if (!response.err) {
        pricePlans = response.result || [];
        totalPlans = response.count || 0;
      } else {
        console.error("Error loading plans:", response.err);
        error = "Failed to load price plans";
      }

      totalPlansPages = Math.ceil(totalPlans / plansPerPage);
    } catch (err) {
      console.error("Error loading plans:", err);
      error = "Failed to load price plans";
    } finally {
      loadingPlans = false;
    }
  }

  async function handleCreatePlan() {
    if (!planForm.name || !planForm.monthly_price || !planForm.yearly_price) {
      error = "Please fill in all required fields";
      return;
    }

    loading = true;
    try {
      const response = await savePricePlan(planForm);

      if (!response.err) {
        success = "Price plan created successfully!";
        showCreatePlanModal = false;
        planForm = {
          name: "",
          monthly_price: "",
          yearly_price: "",
          filters: "",
          ai_elements: "",
          storage: "",
          features: "",
        };
        await loadPlans();
      } else {
        error = response.err || "Failed to create price plan";
      }
    } catch (err) {
      console.error("Error creating plan:", err);
      error = "Failed to create price plan";
    }
    loading = false;
  }

  async function handleUpdatePlan() {
    if (!planForm.name || !planForm.monthly_price || !planForm.yearly_price) {
      error = "Please fill in all required fields";
      return;
    }

    loading = true;
    try {
      const response = await updatePricePlan({
        ...planForm,
        id: selectedPlan.id,
      });

      if (!response.err) {
        success = "Price plan updated successfully!";
        showPlanModal = false;
        editingPlan = false;
        selectedPlan = null;
        await loadPlans();
      } else {
        error = response.err || "Failed to update price plan";
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      error = "Failed to update price plan";
    }
    loading = false;
  }

  async function handleDeletePlan(planId) {
    if (
      !confirm(
        "Are you sure you want to delete this price plan? This action cannot be undone."
      )
    ) {
      return;
    }

    loading = true;
    try {
      const response = await deletePricePlan(planId);

      if (!response.err) {
        success = "Price plan deleted successfully!";
        showPlanModal = false;
        await loadPlans();
      } else {
        error = response.err || "Failed to delete price plan";
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
      error = "Failed to delete price plan";
    }
    loading = false;
  }

  function openPlanModal(plan) {
    selectedPlan = plan;
    planForm = {
      name: plan.name || "",
      monthly_price: plan.monthly_price || "",
      yearly_price: plan.yearly_price || "",
      filters: plan.filters || "",
      ai_elements: plan.ai_elements || "",
      storage: plan.storage || "",
      features: plan.features || "",
    };
    showPlanModal = true;
  }

  function startEditPlan() {
    editingPlan = true;
  }

  function cancelEditPlan() {
    editingPlan = false;
    if (selectedPlan) {
      planForm = {
        name: selectedPlan.name || "",
        monthly_price: selectedPlan.monthly_price || "",
        yearly_price: selectedPlan.yearly_price || "",
        filters: selectedPlan.filters || "",
        ai_elements: selectedPlan.ai_elements || "",
        storage: selectedPlan.storage || "",
        features: selectedPlan.features || "",
      };
    }
  }

  async function refreshFiltersAfterUserChange() {
    if (activeSection === "filters") {
      await loadFilters();
    }
  }

  async function handleCreateUser() {
    if (!userForm.name || !userForm.email || !userForm.password) {
      error = "Please fill all required fields";
      return;
    }

    loading = true;
    try {
      const response = await createUser(userForm);
      if (response.err) {
        error = "Failed to create user account";
        return;
      }

      success = "User account created successfully";
      showCreateAdminModal = false;
      userForm = { name: "", email: "", phone: "", password: "" };

      await loadUsers();
      await refreshFiltersAfterUserChange();
    } catch (err) {
      error = "Failed to create user account";
    }
    loading = false;
  }

  async function handleDeleteUser(userId) {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    loading = true;
    try {
      const response = await deleteUser(userId);
      if (response.err) {
        error = "Failed to delete user";
        return;
      }

      success = "User deleted successfully";

      await loadUsers();

      if (users.length === 0 && currentUsersPage > 1) {
        currentUsersPage--;
        await loadUsers();
      }

      await refreshFiltersAfterUserChange();
    } catch (err) {
      error = "Failed to delete user";
    }
    loading = false;
  }

  async function handleDeleteFilter(filterId) {
    if (
      !confirm(
        "Are you sure you want to delete this filter? This action cannot be undone."
      )
    ) {
      return;
    }

    loading = true;
    try {
      const response = await updateFilter({
        id: filterId,
        is_deleted: 1,
      });
      if (response.err) {
        error = "Failed to delete filter";
        return;
      }

      success = "Filter deleted successfully";

      await loadFilters();

      if (filters.length === 0 && currentFiltersPage > 1) {
        currentFiltersPage--;
        await loadFilters();
      }

      showFilterModal = false;
    } catch (err) {
      error = "Failed to delete filter";
    }
    loading = false;
  }

  async function handleRoleChange(userId, newRole) {
    loading = true;
    try {
      const response = await updateUserRole(userId, newRole);
      if (response.err) {
        error = "Failed to update user role";
        return;
      }

      success = "User role updated successfully";

      await loadUsers();
      showUserModal = false;
    } catch (err) {
      error = "Failed to update user role";
    }
    loading = false;
  }

  function logout() {
    localStorage.removeItem("user");

    const currentHost = window.location.host;
    const mainHost = getHost();

    if (currentHost !== mainHost) {
      const protocol = window.location.protocol;
      const logoutUrl = `${protocol}//${mainHost}/login?logout=true`;
      console.log("Redirecting to main domain for logout:", logoutUrl);
      window.location.href = logoutUrl;
    } else {
      goto("/login");
    }
  }

  function clearMessages() {
    error = "";
    success = "";
  }

  async function switchSection(newSection) {
    if (activeSection === newSection) return;

    activeSection = newSection;
    if (newSection === "users") {
      currentUsersPage = 1;
      await loadUsers();
    } else if (newSection === "filters") {
      currentFiltersPage = 1;
      if (users.length > 0) {
        await loadFilters();
      }
    } else if (newSection === "plans") {
      currentPlansPage = 1;
      await loadPlans();
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  function getUserRoleBadge(role) {
    const roleColors = {
      super_admin: "super-admin",
      admin: "admin",
      user: "user",
    };
    return roleColors[role] || "user";
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

  async function goToPlansPage(page) {
    if (page >= 1 && page <= totalPlansPages && !loadingPlans) {
      currentPlansPage = page;
      await loadPlans();
    }
  }

  async function nextPlansPage() {
    if (currentPlansPage < totalPlansPages && !loadingPlans) {
      currentPlansPage++;
      await loadPlans();
    }
  }

  async function prevPlansPage() {
    if (currentPlansPage > 1 && !loadingPlans) {
      currentPlansPage--;
      await loadPlans();
    }
  }
</script>

<svelte:head>
  <title>Super Admin Dashboard - MyAR</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="app-container">
  <Header {user} />
  <Sidebar {activeSection} {switchSection} {logout} />

  <div class="main-layout">
    <main class="main-content">
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

      <!-- Welcome Header Section -->
      <div class="welcome-header">
        <div class="welcome-section">
          <div class="welcome-content">
            <h1 class="welcome-title">
              Welcome <span class="section-highlight">{sectionTitle}</span>
            </h1>
          </div>

          {#if !showImageUpload}
            <div class="welcome-actions">
              <button class="action-btn primary" on:click={handleCreateFilter}>
                <span class="btn-icon"><Plus /></span>
                Create Filter
              </button>
            </div>
          {/if}
        </div>

        <!-- Image Upload Section -->
        {#if showImageUpload}
          <div>
            <ImageUpload
              {isUploading}
              {uploadSuccess}
              errorMsg={error}
              {transparencyInfo}
              on:fileSelected={handleFileSelected}
            />
          </div>
        {:else}
          <!-- Dashboard Section -->
          {#if activeSection === "dashboard"}
            <Dashboard />
          {/if}

          <!-- Users Section -->
          <!-- {#if activeSection === "users"}
            <div class="section-content">
              <div class="section-header">
                <h2 class="section-title">User Management</h2>
                <button
                  class="action-btn primary"
                  on:click={() => (showCreateAdminModal = true)}
                >
                  <span class="btn-icon"><Plus /></span>
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
                          <td>{user.phone || "N/A"}</td>
                          <td>
                            <span
                              class="role-badge {getUserRoleBadge(user.role)}"
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            <div class="action-buttons">
                              <button
                                class="action-btn small"
                                on:click={() => {
                                  selectedUser = user;
                                  showUserModal = true;
                                }}
                              >
                                <Pencil size="18" />
                              </button>
                              {#if user.role !== "super_admin"}
                                <button
                                  class="action-btn small danger"
                                  on:click={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 size="18" />
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

              {#if totalUsersPages > 1}
                <div class="pagination">
                  <div class="pagination-info">
                    Showing {Math.min(
                      (currentUsersPage - 1) * usersPerPage + 1,
                      totalUsers
                    )} to {Math.min(
                      currentUsersPage * usersPerPage,
                      totalUsers
                    )} of
                    {totalUsers} users
                  </div>
                  <div class="pagination-controls">
                    <button
                      class="pagination-btn"
                      disabled={currentUsersPage === 1 || loadingUsers}
                      on:click={prevUsersPage}
                    >
                      ← Previous
                    </button>

                    {#each Array(totalUsersPages)
                      .fill()
                      .map((_, i) => i + 1) as page}
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
                      disabled={currentUsersPage === totalUsersPages ||
                        loadingUsers}
                      on:click={nextUsersPage}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/if} -->

          <!-- Filters Section -->
          {#if activeSection === "filters"}
            <ImageUpload
              {isUploading}
              {uploadSuccess}
              errorMsg={error}
              {transparencyInfo}
              on:fileSelected={handleFileSelected}
            />

            <FilterGrid />
          {/if}
          {#if activeSection === "clients"}
            <Client />
          {/if}

          <!-- Price Plans Section -->
          <!-- {#if activeSection === "plans"}
            <div class="section-content">
              <div class="section-header">
                <h2 class="section-title">Price Plan Management</h2>
                <button
                  class="action-btn primary"
                  on:click={() => (showCreatePlanModal = true)}
                >
                  <span class="btn-icon"><Plus /></span>
                  Create Price Plan
                </button>
              </div>

              {#if loadingPlans}
                <div class="loading-container">
                  <div class="loading-spinner"></div>
                  <p class="loading-text">Loading price plans...</p>
                </div>
              {:else if pricePlans.length === 0}
                <div class="loading-container">
                  <div class="empty-icon">📋</div>
                  <h3 class="empty-title">No Price Plans Found</h3>
                  <p class="empty-text">
                    Start by creating your first price plan to offer different
                    subscription tiers to your users.
                  </p>
                  <button
                    class="action-btn primary"
                    on:click={() => (showCreatePlanModal = true)}
                  >
                    <span class="btn-icon"><Plus /></span>
                    Create First Price Plan
                  </button>
                </div>
              {:else}
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Plan Name</th>
                        <th>Monthly Price</th>
                        <th>Yearly Price</th>
                        <th>Filters</th>
                        <th>AI Elements</th>
                        <th>Storage</th>
                        <th>Features</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each pricePlans as plan (plan.id)}
                        <tr>
                          <td>
                            <div class="plan-name">
                              <strong>{plan.name}</strong>
                            </div>
                          </td>
                          <td>
                            <span class="price">₹{plan.monthly_price}</span>
                          </td>
                          <td>
                            <span class="price">₹{plan.yearly_price}</span>
                          </td>
                          <td>
                            <span class="feature-value"
                              >{plan.filters || "Unlimited"}</span
                            >
                          </td>
                          <td>
                            <span class="feature-value"
                              >{plan.ai_elements || "Unlimited"}</span
                            >
                          </td>
                          <td>
                            <span class="feature-value"
                              >{plan.storage || "Unlimited"}</span
                            >
                          </td>
                          <td>
                            <span class="feature-value truncate"
                              >{plan.features || "N/A"}</span
                            >
                          </td>
                          <td>
                            <div class="action-buttons">
                              <button
                                class="action-btn small secondary"
                                on:click={() => openPlanModal(plan)}
                              >
                                <span class="btn-icon"><Eye size="18" /></span>
                              </button>
                              <button
                                class="action-btn small danger"
                                on:click={() => handleDeletePlan(plan.id)}
                              >
                                <span class="btn-icon"
                                  ><Trash2 size="18" /></span
                                >
                              </button>
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>

                  {#if totalPlansPages > 1}
                    <div class="pagination">
                      <div class="pagination-info">
                        Showing {(currentPlansPage - 1) * plansPerPage + 1} to {Math.min(
                          currentPlansPage * plansPerPage,
                          totalPlans
                        )} of {totalPlans} price plans
                      </div>
                      <div class="pagination-controls">
                        <button
                          class="pagination-btn"
                          disabled={currentPlansPage === 1 || loadingPlans}
                          on:click={prevPlansPage}
                        >
                          « Previous
                        </button>

                        {#if totalPlansPages <= 5}
                          {#each Array(totalPlansPages) as _, i}
                            <button
                              class="pagination-btn"
                              class:active={currentPlansPage === i + 1}
                              disabled={loadingPlans}
                              on:click={() => goToPlansPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          {/each}
                        {:else if currentPlansPage <= 3}
                          {#each Array(3) as _, i}
                            <button
                              class="pagination-btn"
                              class:active={currentPlansPage === i + 1}
                              disabled={loadingPlans}
                              on:click={() => goToPlansPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          {/each}
                          <span class="pagination-ellipsis">...</span>
                          <button
                            class="pagination-btn"
                            disabled={loadingPlans}
                            on:click={() => goToPlansPage(totalPlansPages)}
                          >
                            {totalPlansPages}
                          </button>
                        {:else if currentPlansPage >= totalPlansPages - 2}
                          <button
                            class="pagination-btn"
                            disabled={loadingPlans}
                            on:click={() => goToPlansPage(1)}
                          >
                            1
                          </button>
                          <span class="pagination-ellipsis">...</span>
                          {#each Array(3) as _, i}
                            <button
                              class="pagination-btn"
                              class:active={currentPlansPage ===
                                totalPlansPages - 2 + i}
                              disabled={loadingPlans}
                              on:click={() =>
                                goToPlansPage(totalPlansPages - 2 + i)}
                            >
                              {totalPlansPages - 2 + i}
                            </button>
                          {/each}
                        {:else}
                          <button
                            class="pagination-btn"
                            disabled={loadingPlans}
                            on:click={() => goToPlansPage(1)}
                          >
                            1
                          </button>
                          <span class="pagination-ellipsis">...</span>
                          {#each Array(3) as _, i}
                            <button
                              class="pagination-btn"
                              class:active={currentPlansPage ===
                                currentPlansPage - 1 + i}
                              disabled={loadingPlans}
                              on:click={() =>
                                goToPlansPage(currentPlansPage - 1 + i)}
                            >
                              {currentPlansPage - 1 + i}
                            </button>
                          {/each}
                          <span class="pagination-ellipsis">...</span>
                          <button
                            class="pagination-btn"
                            disabled={loadingPlans}
                            on:click={() => goToPlansPage(totalPlansPages)}
                          >
                            {totalPlansPages}
                          </button>
                        {/if}

                        <button
                          class="pagination-btn"
                          disabled={currentPlansPage === totalPlansPages ||
                            loadingPlans}
                          on:click={nextPlansPage}
                        >
                          Next »
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/if} -->
        {/if}
      </div>
    </main>
  </div>
</div>

<!-- Create User Modal -->
<!-- {#if showCreateAdminModal}
  <div class="modal-overlay" on:click={() => (showCreateAdminModal = false)}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Create User Account</h3>
        <button
          class="modal-close"
          on:click={() => (showCreateAdminModal = false)}>×</button
        >
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
            <button
              type="button"
              class="action-btn secondary"
              on:click={() => (showCreateAdminModal = false)}
            >
              Cancel
            </button>
            <button type="submit" class="action-btn primary" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if} -->

<!-- User Edit Modal -->
<!-- {#if showUserModal && selectedUser}
  <div class="modal-overlay" on:click={() => (showUserModal = false)}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Edit User: {selectedUser.name}</h3>
        <button class="modal-close" on:click={() => (showUserModal = false)}
          >×</button
        >
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
            <span class="detail-value">{selectedUser.phone || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Current Role:</span>
            <span class="role-badge {getUserRoleBadge(selectedUser.role)}">
              {selectedUser.role}
            </span>
          </div>
        </div>

        {#if selectedUser.role !== "super_admin"}
          <div class="role-change">
            <h4>Change Role</h4>
            <div class="role-options">
              <button
                class="role-btn {selectedUser.role === 'user' ? 'active' : ''}"
                on:click={() => handleRoleChange(selectedUser.id, "user")}
              >
                👤 User
              </button>
              <button
                class="role-btn {selectedUser.role === 'super_admin'
                  ? 'active'
                  : ''}"
                on:click={() =>
                  handleRoleChange(selectedUser.id, "super_admin")}
              >
                👑 Super Admin
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if} -->

<!-- Filter View Modal -->
<!-- {#if showFilterModal && selectedFilter}
  <div class="modal-overlay" on:click={() => (showFilterModal = false)}>
    <div class="modal large" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Filter Details: {selectedFilter.name}</h3>
        <button class="modal-close" on:click={() => (showFilterModal = false)}
          >×</button
        >
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
              <span class="detail-value"
                >{selectedFilter.description || "No description"}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Owner:</span>
              <span class="detail-value"
                >{selectedFilter.user_name || "Unknown"}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">AI Enhanced:</span>
              <span
                class="ai-badge {selectedFilter.ai_need ? 'ai-yes' : 'ai-no'}"
              >
                {selectedFilter.ai_need ? "Yes" : "No"}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value"
                >{formatDate(selectedFilter.created_at)}</span
              >
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
            <Trash2 size="18" /> Delete Filter
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} -->

<!-- Create Price Plan Modal -->
<!-- {#if showCreatePlanModal}
  <div class="modal-overlay" on:click={() => (showCreatePlanModal = false)}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Create Price Plan</h3>
        <button
          class="modal-close"
          on:click={() => (showCreatePlanModal = false)}
        >
          ✕
        </button>
      </div>
      <div class="modal-body">
        <form on:submit|preventDefault={handleCreatePlan}>
          <div class="form-group">
            <label for="planName">Plan Name *</label>
            <input
              id="planName"
              type="text"
              bind:value={planForm.name}
              placeholder="e.g., Basic, Premium, Enterprise"
              required
            />
          </div>

          <div class="form-group">
            <label for="monthlyPrice">Monthly Price (₹) *</label>
            <input
              id="monthlyPrice"
              type="number"
              bind:value={planForm.monthly_price}
              placeholder="e.g., 299"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div class="form-group">
            <label for="yearlyPrice">Yearly Price (₹) *</label>
            <input
              id="yearlyPrice"
              type="number"
              bind:value={planForm.yearly_price}
              placeholder="e.g., 2999"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div class="form-group">
            <label for="filters">Number of Filters</label>
            <input
              id="filters"
              type="text"
              bind:value={planForm.filters}
              placeholder="e.g., 10, 50, Unlimited"
            />
          </div>

          <div class="form-group">
            <label for="aiElements">AI Elements</label>
            <input
              id="aiElements"
              type="text"
              bind:value={planForm.ai_elements}
              placeholder="e.g., 5, 20, Unlimited"
            />
          </div>

          <div class="form-group">
            <label for="storage">Storage</label>
            <input
              id="storage"
              type="text"
              bind:value={planForm.storage}
              placeholder="e.g., 1GB, 10GB, Unlimited"
            />
          </div>

          <div class="form-group">
            <label for="features">Features</label>
            <input
              id="features"
              type="text"
              bind:value={planForm.features}
              placeholder="e.g., Basic filters, Advanced AI, Priority support"
            />
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="action-btn secondary"
              on:click={() => (showCreatePlanModal = false)}
            >
              Cancel
            </button>
            <button type="submit" class="action-btn primary" disabled={loading}>
              {#if loading}
                <div class="small-spinner"></div>
                Creating...
              {:else}
                Create Plan
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if} -->

<!-- Price Plan View/Edit Modal -->
<!-- {#if showPlanModal && selectedPlan}
  <div class="modal-overlay" on:click={() => (showPlanModal = false)}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>
          {editingPlan ? "Edit" : "View"} Price Plan: {selectedPlan.name}
        </h3>
        <button class="modal-close" on:click={() => (showPlanModal = false)}>
          ✕
        </button>
      </div>
      <div class="modal-body">
        {#if editingPlan}
          <form on:submit|preventDefault={handleUpdatePlan}>
            <div class="form-group">
              <label for="editPlanName">Plan Name *</label>
              <input
                id="editPlanName"
                type="text"
                bind:value={planForm.name}
                placeholder="e.g., Basic, Premium, Enterprise"
                required
              />
            </div>

            <div class="form-group">
              <label for="editMonthlyPrice">Monthly Price (₹) *</label>
              <input
                id="editMonthlyPrice"
                type="number"
                bind:value={planForm.monthly_price}
                placeholder="e.g., 299"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div class="form-group">
              <label for="editYearlyPrice">Yearly Price (₹) *</label>
              <input
                id="editYearlyPrice"
                type="number"
                bind:value={planForm.yearly_price}
                placeholder="e.g., 2999"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div class="form-group">
              <label for="editFilters">Number of Filters</label>
              <input
                id="editFilters"
                type="text"
                bind:value={planForm.filters}
                placeholder="e.g., 10, 50, Unlimited"
              />
            </div>

            <div class="form-group">
              <label for="editAiElements">AI Elements</label>
              <input
                id="editAiElements"
                type="text"
                bind:value={planForm.ai_elements}
                placeholder="e.g., 5, 20, Unlimited"
              />
            </div>

            <div class="form-group">
              <label for="editStorage">Storage</label>
              <input
                id="editStorage"
                type="text"
                bind:value={planForm.storage}
                placeholder="e.g., 1GB, 10GB, Unlimited"
              />
            </div>

            <div class="form-group">
              <label for="editFeatures">Features</label>
              <input
                id="editFeatures"
                type="text"
                bind:value={planForm.features}
                placeholder="e.g., Basic filters, Advanced AI, Priority support"
              />
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="action-btn secondary"
                on:click={cancelEditPlan}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn primary"
                disabled={loading}
              >
                {#if loading}
                  <div class="small-spinner"></div>
                  Updating...
                {:else}
                  Update Plan
                {/if}
              </button>
            </div>
          </form>
        {:else}
          <div class="plan-details">
            <div class="detail-row">
              <span class="detail-label">Plan Name:</span>
              <span class="detail-value">{selectedPlan.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Monthly Price:</span>
              <span class="detail-value price"
                >₹{selectedPlan.monthly_price}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Yearly Price:</span>
              <span class="detail-value price"
                >₹{selectedPlan.yearly_price}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Filters:</span>
              <span class="detail-value"
                >{selectedPlan.filters || "Unlimited"}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">AI Elements:</span>
              <span class="detail-value"
                >{selectedPlan.ai_elements || "Unlimited"}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Storage:</span>
              <span class="detail-value"
                >{selectedPlan.storage || "Unlimited"}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Features:</span>
              <span class="detail-value">{selectedPlan.features || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value"
                >{formatDate(selectedPlan.created_at)}</span
              >
            </div>
          </div>

          <div class="modal-actions">
            <button class="action-btn primary" on:click={startEditPlan}>
              <span class="btn-icon"><Pencil size="18" /></span>
              Edit Plan
            </button>
            <button
              class="action-btn danger"
              on:click={() => handleDeletePlan(selectedPlan.id)}
            >
              <span class="btn-icon"><Trash2 size="18" /></span>
              Delete Plan
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if} -->

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    min-height: 100vh;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-layout {
    display: flex;
    flex: 1;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    margin-top: 2rem;
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    margin-left: 250px;
    width: calc(100vw - 250px);
    box-sizing: border-box;
    transition: all 0.3s ease;
  }

  /* Image Upload Section Styles */
  .image-upload-section {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }

  /* Responsive Design */
  /* Medium and small screens (matches sidebar breakpoint) */
  @media (max-width: 1024px) {
    .main-content {
      margin-left: 60px;
      width: calc(100vw - 60px);
      padding: 1.5rem;
    }

    .image-upload-section {
      padding: 1.5rem;
    }
  }

  /* Small screens */
  @media (max-width: 768px) {
    .main-layout {
      margin-top: auto;
    }

    .main-content {
      margin-left: 60px;
      width: calc(100vw - 60px);
      padding: 1rem;
    }

    .image-upload-section {
      padding: 1rem;
    }
  }

  /* Extra small screens */
  @media (max-width: 640px) {
    .main-content {
      margin-left: 0;
      width: 100%;
      padding: 1rem;
    }
  }

  /* Very small screens */
  @media (max-width: 480px) {
    .main-content {
      padding: 0.8rem;
    }

    .image-upload-section {
      padding: 1rem;
      margin-bottom: 1rem;
    }
  }

  .alert {
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    border: 1px solid;
  }

  .alert-error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }

  .alert-success {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #16a34a;
  }

  .alert-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
    margin-left: auto;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .alert-close:hover {
    opacity: 1;
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
    color: #2d3748;
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0;
  }

  .section-subtitle {
    color: #2d3748;
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }

  .filter-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #4a5568;
  }

  .toggle-checkbox {
    accent-color: #667eea;
    width: 1.1rem;
    height: 1.1rem;
    cursor: pointer;
  }

  .toggle-label {
    user-select: none;
    cursor: pointer;
  }

  .action-btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 0.8rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }

  .action-btn::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  .action-btn:hover::before {
    left: 100%;
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #1a8ef1, #0066cc);
    box-shadow: 0 4px 15px rgba(26, 142, 241, 0.3);
  }

  .action-btn.primary:hover {
    box-shadow: 0 8px 25px rgba(26, 142, 241, 0.4);
  }

  .action-btn.secondary {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
  }

  .action-btn.secondary:hover {
    box-shadow: 0 8px 25px rgba(107, 114, 128, 0.4);
  }

  .action-btn.danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
  }

  .action-btn.danger:hover {
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  }

  .action-btn.small {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .action-btn:disabled:hover {
    transform: none;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .table-container {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    background: #f8fafc;
    color: #374151;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .data-table td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
    font-size: 0.9rem;
  }

  .data-table tr:hover {
    background: #f9fafb;
  }

  .data-table tr:last-child td {
    border-bottom: none;
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
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }

  .role-badge {
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .role-badge.super-admin {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  .role-badge.admin {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }

  .role-badge.user {
    background: #e5e7eb;
    color: #374151;
  }

  .ai-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ai-badge.ai-yes {
    background: #dcfce7;
    color: #16a34a;
  }

  .ai-badge.ai-no {
    background: #fed7aa;
    color: #ea580c;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    min-width: 140px;
  }

  .filter-preview {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    overflow: hidden;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #e5e7eb;
  }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .filter-name {
    font-weight: 600;
    color: #2d3748;
  }

  .filter-description {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #6b7280;
  }

  /* Quick Actions */
  .quick-actions {
    margin-top: 2rem;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .action-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }

  .action-card span {
    font-weight: 600;
    color: #2d3748;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(5px);
  }

  .modal {
    background: white;
    border-radius: 20px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid #e2e8f0;
  }

  .modal.large {
    max-width: 800px;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border-radius: 20px 20px 0 0;
  }

  .modal-header h3 {
    color: #2d3748;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .modal-close {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .modal-close:hover {
    color: #374151;
    background: #e5e7eb;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    color: #374151;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .form-group input {
    width: 100%;
    padding: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    background: white;
    color: #374151;
    font-size: 1rem;
    box-sizing: border-box;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-group input::placeholder {
    color: #9ca3af;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .user-details,
  .filter-details {
    margin-bottom: 2rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    color: #6b7280;
    font-weight: 500;
  }

  .detail-value {
    color: #374151;
    font-weight: 600;
  }

  .detail-value.url {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
    color: #1d4ed8;
  }

  .role-change {
    border-top: 1px solid #e5e7eb;
    padding-top: 1.5rem;
    background: #f9fafb;
    margin: -1.5rem -1.5rem 0;
    padding: 1.5rem;
    border-radius: 0 0 20px 20px;
  }

  .role-change h4 {
    color: #374151;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .role-options {
    display: flex;
    gap: 1rem;
  }

  .role-btn {
    flex: 1;
    background: white;
    border: 2px solid #e5e7eb;
    color: #6b7280;
    padding: 1rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
  }

  .role-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }

  .role-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
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
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
  }

  .modal-actions {
    border-top: 1px solid #e5e7eb;
    padding-top: 1.5rem;
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
    gap: 1rem;
  }

  /* Pagination Styles */
  .pagination {
    margin-top: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .pagination-info {
    color: #6b7280;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .pagination-btn {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
    transform: translateY(-1px);
  }

  .pagination-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
    color: white;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .pagination-ellipsis {
    color: #9ca3af;
    padding: 0 0.5rem;
    font-weight: 500;
  }

  /* Loading Styles */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    color: #6b7280;
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
  }

  /* Price Plan Specific Styles */
  .plan-name {
    font-weight: 600;
    color: #2d3748;
  }

  .price {
    font-weight: 700;
    color: #16a34a;
    font-size: 1.1rem;
  }

  .feature-value {
    color: #374151;
    font-weight: 500;
  }

  .feature-value.truncate {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plan-details {
    margin-bottom: 2rem;
  }

  .detail-row .detail-value.price {
    font-size: 1.2rem;
    font-weight: 700;
    color: #16a34a;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.8;
    color: #9ca3af;
  }

  .empty-title {
    color: #2d3748;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .empty-text {
    color: #718096;
    font-size: 1rem;
    margin: 0 0 2rem 0;
    line-height: 1.5;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .chart-card {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .table-card {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .table-card table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .table-card th,
  .table-card td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  .filter-img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    margin-right: 10px;
    vertical-align: middle;
  }

  /* Stats Cards Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  /* Stat Card */
  .stat-card {
    border-radius: 12px;
    padding: 1.2rem;
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Title */
  .stat-card h3 {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  /* Icon + Number Row */
  .stat-card .icon {
    display: flex;
    align-items: center;
    gap: 30px;
  }

  .stat-card .icon img {
    width: 70px;
    height: 70px;
    opacity: 0.8;
  }

  .stat-card .icon .text {
    font-size: 2rem;
    font-weight: bold;
  }

  /* Color Themes */
  .stat-card.blue {
    background: #1d7fe0;
  }
  .stat-card.green {
    background: #28a745;
  }
  .stat-card.purple {
    background: #7e3ff2;
  }
  .stat-card.red {
    background: #e6492d;
  }

  /* Charts Grid */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .chart-card {
    background: #fff;
    border-radius: 12px;
    padding: 1.2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .chart-card h4 {
    margin-bottom: 1rem;
    font-size: 1rem;
    font-weight: 600;
  }

  /* Table Card */
  .table-card {
    background: #fff;
    border-radius: 12px;
    padding: 1.2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .table-card h4 {
    margin-bottom: 1rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .table-card table {
    width: 100%;
    border-collapse: collapse;
  }

  .table-card th,
  .table-card td {
    text-align: left;
    padding: 0.8rem;
    border-bottom: 1px solid #ddd;
  }

  .table-card th {
    background: #f5f5f5;
    font-weight: 600;
  }

  .filter-img {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    margin-right: 8px;
    vertical-align: middle;
  }
  .graph {
    width: 98%;
  }
  .pie {
    width: 80%;
  }

  .filters-page {
    margin-top: 20px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border-radius: 12px;
    background-color: #fff;
  }

  .filters-page h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  /* Grid layout */
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  /* Card */
  .filter-card {
    background: #fff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 1px solid #ccc;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .filter-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .filter-card img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    margin-right: 1rem;
  }

  /* Info section */
  .filter-info h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .filter-info .date {
    font-size: 0.85rem;
    color: #666;
    margin: 0.2rem 0 0.5rem 0;
  }

  .filter-info .stats {
    display: flex;
    gap: 1.5rem;
    font-size: 0.85rem;
    color: #444;
  }

  .welcome-header {
    position: relative;
  }

  .welcome-section {
    padding-top: 10px;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    position: relative;
    overflow: hidden;
  }

  .welcome-section::before {
    content: "";
    position: absolute;
    top: -20px;
    left: -20px;
    width: 80px;
    height: 80px;
    background-size: contain;
    opacity: 0.7;
    z-index: 0;
  }

  .welcome-content {
    flex: 1;
    position: relative;
    z-index: 1;
  }

  .welcome-title {
    font-size: 1rem;
    color: #000000;
    margin: 0;
    line-height: 1.4;
  }

  .section-highlight {
    color: #2563eb;
    font-weight: 600;
  }

  .welcome-actions {
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .action-btn {
    background: #000000;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .btn-icon {
    display: flex;
    align-items: center;
  }

  /* Responsive adjustments for main content */
  @media (max-width: 1024px) {
    .section-title {
      font-size: 1.5rem;
    }

    .section-subtitle {
      font-size: 1.2rem;
    }

    .welcome-title {
      font-size: 0.9rem;
    }

    .action-btn {
      padding: 0.6rem 1rem;
      font-size: 0.8rem;
    }
  }

  @media (max-width: 768px) {
    .section-title {
      font-size: 1.3rem;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .welcome-section {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .welcome-actions {
      width: 100%;
    }

    .action-btn {
      width: 100%;
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .section-title {
      font-size: 1.1rem;
    }

    .welcome-title {
      font-size: 0.8rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .filter-card {
      flex-direction: column;
      text-align: center;
    }

    .filter-card img {
      margin-right: 0;
      margin-bottom: 1rem;
    }
  }
</style>
