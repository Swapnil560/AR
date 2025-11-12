<script lang="ts">
  import {
    LayoutDashboard,
    Palette,
    Proportions,
    User2,
    LogOut,
    CreditCard,
  } from "lucide-svelte";
  import logo from "../lib/assets/pic.png";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  export let activeSection: string = "dashboard";
  export let switchSection: (section: string) => void;
  export let logout: () => void;
  export let user: any = null;

  onMount(() => {
    // Check for auth parameter in URL (from subdomain redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get("auth");

    if (authParam) {
      try {
        // Decode user data from URL parameter
        const userData = JSON.parse(atob(authParam));
        console.log("User data from URL:", userData);

        // Store in localStorage for the current domain/subdomain
        localStorage.setItem("user", JSON.stringify(userData));

        // Clean up URL by removing auth parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        user = userData;  // This sets the user state
      } catch (error) {
        console.error("Error parsing auth parameter:", error);
        goto("/login");
        return;
      }
    } else {
      // Check if user is logged in from localStorage
      const userData = localStorage.getItem("user");
      if (!userData) {
        goto("/login");
        return;
      }
      user = JSON.parse(userData);
    }

    // Redirect based on user role if needed
    if (user.role === "super_admin") {
      // You can add redirect logic here if needed
      console.log("Super admin detected");
    }
  });
</script>

<aside class="sidebar">
  <nav class="sidebar-nav">
    <div class="logo-section">
      <img src={logo} alt="logo" />
      <span class="admin-text">
        {#if user?.role === "super_admin"}
          Admin
        {:else if user?.role === "admin"}
          {user?.name || "User"}
        {:else}
          {user?.name || "User"}
        {/if}
      </span>
    </div>
    <button
      class="nav-item {activeSection === 'dashboard' ? 'active' : ''}"
      on:click={() => switchSection("dashboard")}
    >
      <LayoutDashboard size="20" />
      <span class="nav-text">Dashboard</span>
    </button>
    <button
      class="nav-item {activeSection === 'filters' ? 'active' : ''}"
      on:click={() => switchSection("filters")}
    >
      <Palette size="20" />
      <span class="nav-text">Filter</span>
    </button>
    {#if user?.role === "super_admin"}
      <button
        class="nav-item {activeSection === 'clients' ? 'active' : ''}"
        on:click={() => switchSection("clients")}
      >
        <User2 size="20" />
        <span class="nav-text">Clients</span>
      </button>
    {/if}
    <button
      class="nav-item {activeSection === 'reports' ? 'active' : ''}"
      on:click={() => switchSection("reports")}
    >
      <Proportions size="20" />
      <span class="nav-text">Reports</span>
    </button>

    <button
      class="nav-item {activeSection === 'plans' ? 'active' : ''}"
      on:click={() => switchSection("plans")}
    >
      <CreditCard size="20" />
      <span class="nav-text">Plans</span>
    </button>
    <button class="nav-item" on:click={logout}>
      <LogOut size="20" />
      <span class="nav-text">Logout</span>
    </button>
  </nav>
</aside>

<style>
  .sidebar {
    height: 100vh;
    z-index: 100;
    position: fixed;
    width: 250px;
    background: white;
    border-right: 1px solid #e2e8f0;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
    padding: 0.5rem 0;
    overflow-y: auto;
    transition: width 0.3s ease;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    /* gap: 0.5rem; */
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    margin-top: 3.5rem;
    flex-direction: row;
  }

  .logo-section img {
    width: 32px;
    height: 32px;
  }

  .admin-text {
    color: #2d3748;
    font-size: 1rem;
    font-weight: 500;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    color: #4a5568;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    border-left: 4px solid transparent;
    white-space: nowrap;
    overflow: hidden;
  }

  .nav-item:hover {
    background: #f7fafc;
    color: #2d3748;
  }

  .nav-item.active {
    background: #dbdbdb;
    color: black;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }

  .nav-text {
    transition: opacity 0.3s ease;
  }

  /* Medium and small screens */
  @media (max-width: 1024px) {
    .sidebar {
      width: 60px;
    }

    .logo-section {
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem 0.5rem;
      text-align: center;
    }

    .admin-text {
      font-size: 0.7rem;
      line-height: 1;
    }

    .nav-item {
      padding: 1rem 0.5rem;
      justify-content: center;
    }

    .nav-text {
      opacity: 0;
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
    }

    /* Show tooltip on hover */
    .nav-item:hover .nav-text {
      opacity: 1;
      position: fixed;
      left: 70px;
      background: #2d3748;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      width: auto;
      height: auto;
      z-index: 1000;
      white-space: nowrap;
    }

    .nav-item:hover .nav-text::before {
      content: "";
      position: absolute;
      left: -4px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-right: 4px solid #2d3748;
    }
  }

  /* For very small screens - keep the same collapsed behavior */
  @media (max-width: 768px) {
    .sidebar {
      width: 60px;
      position: fixed;
      height: 100vh;
    }

    .sidebar-nav {
      flex-direction: column;
      overflow-x: visible;
      padding: 0;
    }

    .nav-item {
      flex-shrink: 0;
      border-left: 4px solid transparent;
      border-bottom: none;
      padding: 1rem 0.5rem;
    }

    .nav-item.active {
      border-left: 4px solid #4c51bf;
      border-bottom: none;
    }

    .logo-section {
      display: flex;
    }
  }

  /* Extra small screens */
  @media (max-width: 480px) {
    .sidebar {
      width: 60px;
    }
  }
</style>