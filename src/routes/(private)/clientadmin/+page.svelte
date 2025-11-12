<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getHost } from "$lib/utils";

  import Header from "../../../components/Header.svelte";
  import Sidebar from "../../../components/Sidebar.svelte";

  import Dashboard from "../../../components/dashboard.svelte";
  import { Plus } from "lucide-svelte";
  import Filterdashboard from "../../../components/filterdashboard.svelte";
  import Filterupload from "../../../components/filterupload.svelte";
  import Profile from "../../../components/profile.svelte";
  import ClientAdminPlans from "../../../components/ClientAdminPlans.svelte";
  import ClientAdminReports from "../../../components/ClientAdminReports.svelte";

  let user = null;
  let activeSection = "dashboard";
  let showImageUpload = false;
  let showProfile = false; // Add profile visibility state

  let error = "";
  let success = "";

  // Create User Form
  let userForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
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
      filters: "Filters",
      reports: "Reports",
      profile: "Profile Settings",
      plans: "Price Plans",
    };
    return titles[section] || "Dashboard";
  }

  let currentUsersPage = 1;

  // Image Upload Handlers
  // function handleFileSelected(event) {
  //   const file = event.detail.file;
  //   console.log("File selected:", file);
  //   // Add your file processing logic here
  // }

  function handleCreateFilter() {
    showImageUpload = true;
    showProfile = false;
  }

  // Profile navigation handlers
  function handleProfileClick() {
    showProfile = true;
    showImageUpload = false;
    activeSection = "profile";
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

    // if (user.role !== "admin") {
    //   goto("/login");
    //   return;
    // }
  });

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

  async function switchSection(newSection: any) {
    if (activeSection === newSection) return;

    activeSection = newSection;
    showProfile = false;
    showImageUpload = false;

    if (newSection === "users") {
      currentUsersPage = 1;
    }
  }
</script>

<svelte:head>
  <title>Client Admin Dashboard - MyAR</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="app-container">
  <Header onProfileClick={handleProfileClick} />
  <Sidebar {activeSection} {switchSection} {logout} />

  <div class="main-layout">
    <main class="main-content">
      <!-- Welcome Header Section -->
      <div class="welcome-header">
        <div class="welcome-section">
          <div class="welcome-content">
            <h1 class="welcome-title">
              Welcome <span class="section-highlight">{sectionTitle}</span>
            </h1>
          </div>

          <div class="welcome-actions">
            <button class="action-btn primary" on:click={handleCreateFilter}>
              <span class="btn-icon"><Plus /></span>
              Create Filter
            </button>
          </div>
        </div>

        {#if showImageUpload}
          <div>
            <Filterupload />
          </div>
        {:else}
          <!-- Dashboard Section -->
          {#if activeSection === "dashboard"}
            <Dashboard />
          {/if}

          <!-- Filters Section -->
          {#if activeSection === "filters"}
            <Filterdashboard />
          {/if}

          <!-- Add other sections as needed -->
          {#if activeSection === "reports"}
            <ClientAdminReports />
          {/if}

          {#if activeSection === "plans"}
            <ClientAdminPlans />
          {/if}

          {#if showProfile}
            <!-- Profile Section -->
            <Profile />
          {/if}
        {/if}
      </div>
    </main>
  </div>
</div>

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

  .section-placeholder {
    background: white;
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .section-placeholder h2 {
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .section-placeholder p {
    color: #718096;
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
  }

  @media (max-width: 480px) {
    .section-title {
      font-size: 1.1rem;
    }

    .welcome-title {
      font-size: 0.8rem;
    }
  }
</style>
