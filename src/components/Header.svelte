<script lang="ts">
  import { Menu, Search, Settings, Megaphone, User, Box } from "lucide-svelte";

  export let sidebarWidth = 250;
  export let onProfileClick: () => void; // Add this prop
  
  // Function to handle menu click (for mobile toggle)
  function handleMenuClick() {
    const event = new CustomEvent('toggleSidebar');
    window.dispatchEvent(event);
  }

  // Function to handle profile icon click
  function handleProfileClick() {
    if (onProfileClick) {
      onProfileClick();
    }
  }
</script>

<header class="header">
  <div class="header-content">
    <!-- Left Section -->
    <div class="left-section">
      <button class="menu-button" on:click={handleMenuClick}>
        <Menu class="icon" />
      </button>
      <Box class="icon" />
      <div class="search-bar">
        <Search class="search-icon" />
        <input type="text" placeholder="Type to search" />
      </div>
    </div>

    <!-- Right Section -->
    <div class="right-section">
      <Settings class="icon" />
      <div class="notification-wrapper">
        <Megaphone class="icon" />
        <span class="notification-badge">3</span>
      </div>
      <button class="profile-button" on:click={handleProfileClick}>
        <User class="icon" />
      </button>
    </div>
  </div>
</header>

<style>
  /* Your existing header styles remain the same */
  .header {
    background: #fff;
    position: fixed;
    top: 0;
    left: 250px;
    width: calc(100vw - 250px);
    height: 7.5vh;
    display: flex;
    align-items: center;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-bottom: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 1rem;
  }

  .left-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .menu-button {
    background: none;
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .profile-button {
    background: none;
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .menu-button:hover,
  .profile-button:hover {
    background: #f7f9fc;
  }

  .icon {
    width: 20px;
    height: 20px;
    color: #4a5568;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .icon:hover {
    color: #1a8ef1;
  }

  .search-bar {
    display: flex;
    align-items: center;
    background: #f7f9fc;
    border-radius: 20px;
    padding: 0.4rem 1rem;
    gap: 0.5rem;
    width: 220px;
    transition: width 0.3s ease;
  }

  .search-bar input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.85rem;
    width: 100%;
    color: #2d3748;
  }

  .search-bar input::placeholder {
    color: #a0aec0;
  }

  .search-icon {
    color: #1a8ef1;
    width: 16px;
    height: 16px;
  }

  .notification-wrapper {
    position: relative;
  }

  .notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ff4d6d;
    color: white;
    font-size: 0.6rem;
    font-weight: 600;
    border-radius: 50%;
    width: 15px;
    height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Your existing responsive styles remain the same */
  @media (max-width: 1024px) {
    .header {
      left: 60px;
      width: calc(100vw - 60px);
    }

    .search-bar {
      width: 180px;
    }
  }

  @media (max-width: 768px) {
    .header {
      left: 60px;
      width: calc(100vw - 60px);
      height: auto;
      min-height: 7.5vh;
    }

    .header-content {
      padding: 0.8rem 1rem;
    }

    .search-bar {
      width: 150px;
    }

    .right-section {
      gap: 1rem;
    }
  }

  @media (max-width: 640px) {
    .header {
      left: 0;
      width: 100%;
    }

    .header-content {
      flex-wrap: wrap;
      gap: 0.8rem;
    }

    .left-section {
      flex: 1;
      min-width: 200px;
    }

    .search-bar {
      width: 100%;
      max-width: 200px;
    }

    .right-section {
      gap: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .header-content {
      padding: 0.6rem 0.8rem;
    }

    .left-section {
      gap: 0.5rem;
    }

    .search-bar {
      max-width: 150px;
      padding: 0.4rem 0.8rem;
    }

    .right-section {
      gap: 0.6rem;
    }

    .icon {
      width: 18px;
      height: 18px;
    }
  }

  @media (max-width: 360px) {
    .header {
      left: 0;
      width: 100%;
    }

    .search-bar {
      max-width: 120px;
    }

    .search-bar input::placeholder {
      font-size: 0.75rem;
    }
  }
</style>