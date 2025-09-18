<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<div class="auth-container">
  <div class="auth-background">
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
  </div>

  <div class="auth-card">
    <div class="auth-header">
      <div class="logo">
        <div class="logo-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <span class="logo-text">MyAR</span>
      </div>
      <h1 class="auth-title">Welcome to MyAR</h1>
      <div class="bg-white shadow-xl rounded-2xl p-8 max-w-md">
    <p class="text-gray-600 mb-4">
      We’ve identified you as a <span class="font-semibold">new user</span>.  
      Your portal setup is currently <span class="text-blue-600 font-medium">in progress</span>.
    </p>
    <p class="text-gray-500 text-sm">
      Please check back soon while we finish preparing your account.
    </p>
  </div>
      <div class="auth-switch">
        <span>Already have an another account?</span>
        <button
          type="button"
          class="switch-btn"
          on:click={() => {
            localStorage.removeItem("user")
            goto("/login");
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 1rem;
  }

  .auth-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  .floating-shapes {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .shape {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }

  .shape-1 {
    width: 80px;
    height: 80px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  .shape-2 {
    width: 120px;
    height: 120px;
    top: 70%;
    right: 10%;
    animation-delay: 2s;
  }

  .shape-3 {
    width: 60px;
    height: 60px;
    top: 40%;
    left: 80%;
    animation-delay: 4s;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(180deg);
    }
  }

  .auth-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 3rem 2.5rem;
    width: 100%;
    max-width: 480px;
    position: relative;
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .logo-icon svg {
    width: 24px;
    height: 24px;
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .auth-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .auth-subtitle {
    color: #6b7280;
    font-size: 1rem;
    line-height: 1.5;
  }
  .auth-switch {
    text-align: center;
    margin-top: 1rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 0.875rem;
  }
  .switch-btn {
    background: none;
    border: none;
    color: #667eea;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    margin-left: 0.5rem;
    transition: color 0.2s;
  }

  .switch-btn:hover:not(:disabled) {
    color: #764ba2;
  }

  .switch-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .auth-container {
      padding: 1rem;
    }

    .auth-card {
      padding: 2rem 1.5rem;
      border-radius: 20px;
    }

    .auth-title {
      font-size: 1.75rem;
    }

    .logo-text {
      font-size: 1.25rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .auth-card {
      background: rgba(31, 41, 55, 0.95);
      border: 1px solid rgba(55, 65, 81, 0.3);
    }

    .auth-title {
      color: #f9fafb;
    }

    .auth-subtitle {
      color: #d1d5db;
    }
  }
</style>
