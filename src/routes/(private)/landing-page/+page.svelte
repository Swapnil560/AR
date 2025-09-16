<script>
  import Footer from "./footer.svelte";
  import HowItWorks from "./HowItWorks.svelte";
  import PricingSection from "./PricingSection.svelte";

  import { goto } from "$app/navigation";

  function handleLogin() {
    goto("/login");
  }
</script>

<div class="page">
  <!-- Hero Section -->
  <section class="hero">
    <!-- Background Pattern -->
    <div class="bg-pattern"></div>

    <!-- Animated Background Elements -->
    <div class="bg-circle c1"></div>
    <div class="bg-circle c2"></div>
    <div class="bg-circle c3"></div>
    <div class="bg-circle c4"></div>

    <header class="hero-header">
      <div class="logo gradient">myAR.in</div>
      <button class="btn primary" on:click={handleLogin}>Login</button>
    </header>

    <div class="hero-container">
      <!-- Left Content -->
      <div class="left">
        <div class="intro">
          <div class="badge">
            <div class="dot"></div>
            <span>India's Leading AR Filter Studio</span>
          </div>

          <h1>
            <span class="gradient">Dream It.</span><br />
            <span class="foreground">Build It.</span><br />
            <span class="gradient">Share It.</span>
          </h1>

          <p>
            Professional AR filters that captivate audiences and amplify your
            brand. From static overlays to AI-powered face tracking – we bring
            your creative vision to life.
          </p>
        </div>

        <div class="buttons">
          <button class="btn primary">Start Creating</button>
          <button class="btn secondary">Watch Demo</button>
        </div>

        <!-- Trust Indicators -->
        <div class="stats">
          <div>
            <div class="stat-number">500+</div>
            <div class="stat-label">Filters Created</div>
          </div>
          <div>
            <div class="stat-number">100+</div>
            <div class="stat-label">Happy Clients</div>
          </div>
          <div>
            <div class="stat-number">24hrs</div>
            <div class="stat-label">Avg. Delivery</div>
          </div>
        </div>
      </div>

      <!-- Right Content - Interactive Demo -->
      <div class="right">
        <!-- Phone Mockup -->
        <div class="phone">
          <div class="phone-screen">
            <div class="notch"></div>

            <div class="filter-demo">
              <div class="demo-shape">
                <div class="circle"></div>
                <div class="box top"></div>
                <div class="oval left"></div>
                <div class="oval right"></div>
                <div class="label">AI Face Tracking</div>
              </div>
            </div>

            <div class="controls">
              <div class="control">
                <div class="inner-circle"></div>
              </div>
              <div class="control">
                <div class="square"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Cards -->
        <div class="floating card1">
          <div class="title">Education</div>
          <!-- <div class="price">₹9,999</div> -->
        </div>
        <div class="floating card2">
          <div class="title">Promotion</div>
          <!-- <div class="price">₹4,999</div> -->
        </div>
        <div class="floating card3">
          <div class="title">Marketing</div>
          <!-- <div class="price">₹14,999</div> -->
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section id="works">
    <HowItWorks />
  </section>
  <!-- Pricing -->
  <section id="journy">
    <PricingSection />
  </section>
  <Footer />
</div>

<style>
  .page {
    min-height: 100vh;
    background: var(--background, #fdfdfd);
  }
  @media (max-width: 640px) {
    .hero {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }

  /* Hero */
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      to bottom right,
      var(--background, #f9f9ff),
      rgba(99, 102, 241, 0.05),
      rgba(236, 72, 153, 0.1)
    );
    /* background: linear-gradient(135deg, #F5F5F9 0%, #1A1AE6 50%, #B447EB 100%);
  background-size: 400% 400%; */
    overflow: hidden;
  }

  /* Background Pattern */
  .bg-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
      circle at center,
      var(--primary, #6366f1) 1px,
      transparent 1px
    );
    background-size: 50px 50px;
    opacity: 0.1;
  }

  /* Background Circles */
  .bg-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(30px);
    animation: pulse 6s infinite;
  }
  .c1 {
    top: 5rem;
    left: 2.5rem;
    width: 8rem;
    height: 8rem;
    background: rgba(99, 102, 241, 0.1);
  }
  .c2 {
    top: 8rem;
    right: 5rem;
    width: 6rem;
    height: 6rem;
    background: rgba(236, 72, 153, 0.15);
    animation-delay: 0.75s;
  }
  .c3 {
    bottom: 8rem;
    left: 25%;
    width: 5rem;
    height: 5rem;
    background: rgba(99, 102, 241, 0.2);
    animation-delay: 1.5s;
  }
  .c4 {
    top: 50%;
    right: 25%;
    width: 4rem;
    height: 4rem;
    background: rgba(236, 72, 153, 0.1);
    animation-delay: 3s;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  /* Hero Container */
  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 5rem;
    padding-bottom: 2rem;
    display: grid;
    gap: 8rem;
    align-items: center;
    position: relative;
    z-index: 10;
  }
  
  @media (min-width: 1024px) {
    .hero-container {
      grid-template-columns: 1fr 1fr;
      padding-left: 5rem;
    }
  }

  /* Left Section */
  .left .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(99, 102, 241, 0.1);
    color: var(--primary, #6366f1);
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  .badge .dot {
    width: 0.5rem;
    height: 0.5rem;
    background: var(--primary, #6366f1);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.2;
  }
  @media (min-width: 768px) {
    h1 {
      font-size: 3.5rem;
    }
  }
  @media (min-width: 1024px) {
    h1 {
      font-size: 4.5rem;
    }
  }
  h1 .gradient {
    background: linear-gradient(to right, #6366f1, #9333ea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  h1 .foreground {
    color: #111827;
  }

  .left p {
    margin-top: 1.5rem;
    font-size: 1.2rem;
    color: #6b7280;
    max-width: 30rem;
    line-height: 1.6;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
  }
  @media (min-width: 640px) {
    .buttons {
      flex-direction: row;
    }
  }
  .btn {
    padding: 1rem 2rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s;
  }
  .btn.primary {
    background: linear-gradient(to right, #6366f1, #9333ea);
    color: white;
    border-color: white;
  }
  .btn.primary:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
  }
  .btn.secondary {
    background: white;
    color: #111827;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  .btn.secondary:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.4);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }
  .stat-number {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary, #6366f1);
  }
  .stat-label {
    font-size: 0.9rem;
    color: #6b7280;
  }

  /* Right Section */
  .phone {
    position: relative;
    width: 20rem;
    height: 37.5rem;
    margin: 0 auto;
    border-radius: 3rem;
    padding: 1rem;
    background: white;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  }
  .phone-screen {
    width: 100%;
    height: 100%;
    border-radius: 2.5rem;
    background: black;
    position: relative;
    overflow: hidden;
  }
  .notch {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: 8rem;
    height: 1.5rem;
    background: black;
    border-radius: 1rem;
    z-index: 10;
  }

  .filter-demo {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom right,
      rgba(99, 102, 241, 0.2),
      rgba(236, 72, 153, 0.2)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .demo-shape {
    position: relative;
  }
  .demo-shape .circle {
    width: 12rem;
    height: 15rem;
    border: 2px dashed rgba(99, 102, 241, 0.5);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  .demo-shape .box.top {
    position: absolute;
    top: -2rem;
    left: 50%;
    transform: translateX(-50%);
    width: 4rem;
    height: 3rem;
    background: rgba(236, 72, 153, 0.3);
    border: 1px solid #ec4899;
    border-radius: 0.5rem;
    animation: bounce 2s infinite;
  }
  .demo-shape .oval {
    position: absolute;
    top: 4rem;
    width: 3rem;
    height: 2rem;
    background: rgba(99, 102, 241, 0.3);
    border: 1px solid #6366f1;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  .demo-shape .oval.left {
    left: -2rem;
    animation-delay: 0.75s;
  }
  .demo-shape .oval.right {
    right: -2rem;
    animation-delay: 1.5s;
  }
  .demo-shape .label {
    position: absolute;
    bottom: -2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translate(-50%, 0);
    }
    50% {
      transform: translate(-50%, -10px);
    }
  }

  .controls {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.75rem;
  }
  .control {
    width: 3rem;
    height: 3rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .inner-circle {
    width: 2rem;
    height: 2rem;
    background: #6366f1;
    border-radius: 50%;
  }
  .square {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid white;
  }

  .floating {
    position: absolute;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.75rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    animation: float 4s infinite ease-in-out;
  }
  .card1 {
    top: 15rem;
    right: 40rem;
  }
  .card2 {
    top: 25rem;
    right: 5rem;
    animation-delay: 1s;
  }
  .card3 {
    bottom: 12rem;
    right: 40rem;
    animation-delay: 2s;
  }

  .title {
    font-size: 0.8rem;
    font-weight: 600;
  }
  .price {
    font-size: 0.8rem;
    color: #6b7280;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .hero-header {
    position: absolute;
    top: 1rem;
    left: 0;
    right: 0;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 20;
  }

  /* @media (min-width: 1024px) {
    .hero-header {
      grid-template-columns: 1fr 1fr;
    }
  } */
  /* .hero-header,
  .hero-container {
    padding-left: 1rem;
    padding-right: 1rem;
  } */
  @media (min-width: 1024px) {
    .hero-header,
    .hero-container {
      /* padding-left: 5rem; */
      padding-right: 12rem;
    }
  }
  .logo {
    font-size: 2rem;
    font-weight: 700;
    margin-left: 0; /* reset */
  }

  @media (min-width: 1024px) {
    .hero-header {
      padding: 0 5rem; /* same padding as .intro text */
    }
    .logo {
      margin-left: 0; /* align with intro badge/span */
    }
  }

  .gradient {
    background: linear-gradient(to right, #6366f1, #9333ea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
  }

  /* .login-btn {
    padding: 0.6rem 1.2rem;
    border-radius: 0.5rem;
    background: linear-gradient(to right, #6366f1, #9333ea);
    color: white;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .login-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
  } */
</style>
