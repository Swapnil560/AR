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
      <div class="container">
        <a href="/landing-page" style="text-decoration: none;">
          <div class="logo gradient">myAR.in</div>
        </a>
        <button class="btn primary">Contact Us</button>
      </div>
    </header>

    <div class="container hero-container">
      <!-- Left Content -->
      <div class="left">
        <div class="intro">
          <div class="badge">
            <div class="dot"></div>
            <span>Your own AR Filter Studio</span>
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
            <div class="stat-number">100+</div>
            <div class="stat-label">Filters Created</div>
          </div>
          <div>
            <div class="stat-number">10+</div>
            <div class="stat-label">Happy Clients</div>
          </div>
          <div>
            <div class="stat-number">2hrs</div>
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
                <div class="tracking dot-a" />
                <!-- <div class="tracking dot-b" /> -->
                <div class="tracking dot-c" />
                <div class="tracking dot-d" />
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
        </div>
        <div class="floating card2">
          <div class="title">Promotion</div>
        </div>
        <div class="floating card3">
          <div class="title">Marketing</div>
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
  /* Global container for consistent width */
  .container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .page {
    min-height: 100vh;
    background: var(--background, #fdfdfd);
    overflow-x: hidden;
  }

  /* Header fixes */
  .hero-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1.25rem 0;
    background: rgba(255, 255, 255, 0.3); /* semi-transparent */
    backdrop-filter: blur(10px); /* blur effect */
    -webkit-backdrop-filter: blur(10px); /* Safari support */
    border: 1px solid rgba(255, 255, 255, 0.4);
  }

  .hero-header .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
  }

  .logo {
    font-size: 1.8rem;
    font-weight: 700;
  }

  /* Hero section responsive fixes */
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    /* background: linear-gradient(
      to bottom right,
      var(--background, #f9f9ff),
      rgba(99, 102, 241, 0.05),
      rgba(236, 72, 153, 0.1)
    ); */
    overflow: hidden;
    padding-top: 6rem;
  }

  .hero {
    background: radial-gradient(
        circle at 20% 30%,
        rgba(138, 119, 239, 0.6),
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(101, 76, 243, 0.5),
        transparent 50%
      ),
      radial-gradient(
        circle at 50% 80%,
        rgba(173, 121, 255, 0.35),
        transparent 60%
      ),
      linear-gradient(180deg, #c4cbf7 0%, #ffffff 100%);
    background-blend-mode: screen;
  }

  .hero-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4rem;
    align-items: center;
    position: relative;
    z-index: 10;
    width: 100%;
    padding: 2rem 1.5rem;
  }

  @media (min-width: 1024px) {
    .hero-container {
      grid-template-columns: 1fr 1fr;
      gap: 6rem;
      padding: 3rem 1.5rem;
    }
  }

  /* Left content alignment */
  .left {
    order: 1;
  }

  @media (min-width: 1024px) {
    .left {
      text-align: left;
      order: 1;
    }
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(99, 102, 241, 0.1);
    color: var(--primary, #6366f1);
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 1.5rem;
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
    margin-bottom: 1.5rem;
  }

  @media (min-width: 768px) {
    h1 {
      font-size: 3.5rem;
    }
  }

  @media (min-width: 1024px) {
    h1 {
      font-size: 3.8rem;
    }
  }

  .left p {
    margin-bottom: 2rem;
    font-size: 1.1rem;
    color: #6b7280;
    line-height: 1.6;
    max-width: 100%;
  }

  @media (min-width: 768px) {
    .left p {
      font-size: 1.2rem;
      max-width: 30rem;
    }
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
    justify-content: center;
  }

  @media (min-width: 640px) {
    .buttons {
      flex-direction: row;
      justify-content: flex-start;
    }
  }

  .btn {
    padding: 0.9rem 1.8rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
  }

  @media (min-width: 768px) {
    .btn {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }
  }

  .btn.primary {
    background: linear-gradient(to right, #6366f1, #9333ea);
    color: white;
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
    gap: 1.5rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
    max-width: 400px;
    margin: 0 auto;
  }

  @media (min-width: 1024px) {
    .stats {
      margin: 0;
    }
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

  /* Right content alignment */
  .right {
    position: relative;
    display: flex;
    justify-content: center;
    order: 1;
  }

  @media (min-width: 1024px) {
    .right {
      order: 2;
    }
  }

  .phone {
    position: relative;
    width: 18rem;
    height: 35rem;
    margin: 0 auto;
    border-radius: 3rem;
    padding: 1rem;
    background: white;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    z-index: 2;
  }

  @media (min-width: 768px) {
    .phone {
      width: 20rem;
      height: 37.5rem;
    }
  }

  .phone-screen {
    width: 100%;
    height: 100%;
    border-radius: 2.5rem;
    background: black;
    position: relative;
    overflow: hidden;
  }

  .dot-a,
  .dot-c,
  .dot-d {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  /* adjust positions as per screenshot */
  .dot-a {
    top: -40%;
    left: -3%;
    transform: translateX(-50%);
    background: var(--primary);
  }

  /* .dot-b {
    top: 40%;
    left: 90%;
    background: var(--accent);
    animation-delay: 0.12s;
  } */

  .dot-c {
    top: -50%;
    right: 2%;
    background: var(--accent);
    animation-delay: 0.24s;
  }

  .dot-d {
    bottom: -20%;
    left: -10%;
    transform: translateX(-50%);
    background: rgba(var(--primary-rgb), 0.75);
    animation-delay: 0.36s;
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

  /* Floating cards positioning */
  .floating {
    position: absolute;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    animation: float 4s infinite ease-in-out;
    z-index: 1;
    min-width: 100px;
  }

  .card1 {
    top: 10%;
    right: 80%;
  }

  .card2 {
    top: 35%;
    right: -8%;
    animation-delay: 1s;
  }

  .card3 {
    bottom: 15%;
    right: 80%;
    animation-delay: 2s;
  }

  @media (min-width: 1536px) {
    .card1 {
      right: 90%;
    }
    .card3 {
      right: 90%;
    }
  }

  .title {
    font-size: 0.8rem;
    font-weight: 600;
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
    background: rgba(71, 4, 37, 0.15);
    animation-delay: 0.75s;
  }

  .c3 {
    bottom: 8rem;
    left: 25%;
    width: 5rem;
    height: 5rem;
    background: rgba(1, 1, 20, 0.2);
    animation-delay: 1.5s;
  }

  .c4 {
    top: 50%;
    right: 25%;
    width: 4rem;
    height: 4rem;
    background: rgba(150, 7, 78, 0.1);
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

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .gradient {
    background: linear-gradient(to right, #6366f1, #9333ea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
  }

  /* Responsive adjustments */
  @media (max-width: 1023px) {
    .hero-container {
      padding-top: 2rem;
      padding-bottom: 2rem;
    }

    .right {
      margin-bottom: 2rem;
    }

    /* .floating {
      display: none;
    } */
  }

  @media (max-width: 640px) {
    .hero {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    h1 {
      font-size: 2.2rem;
    }

    .phone {
      width: 16rem;
      height: 32rem;
    }

    .stats {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .stat-number {
      font-size: 1.3rem;
    }

    .stat-label {
      font-size: 0.8rem;
    }

    .hero-header .container {
      padding: 0 1rem;
    }
  }
</style>
