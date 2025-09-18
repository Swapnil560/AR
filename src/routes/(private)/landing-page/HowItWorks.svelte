<script>
  import { Upload, Eye, Share2, Check, ArrowRight } from "lucide-svelte";
  import photo1 from "../../../lib/assets/Clip path group (1).png";
  import photo2 from "../../../lib/assets/Clip path group.png";
  const steps = [
    {
      id: 1,
      icon: Upload,
      title: "Upload",
      description: "Drag & drop your PNG/GIF with transparent background.",
      chip: "Auto cloud upload",
    },
    {
      id: 2,
      icon: Eye,
      title: "Preview",
      description: "Test on web camera and adjust position/scale in 3D.",
      chip: "Depth-aware placement",
    },
    {
      id: 3,
      icon: Share2,
      title: "Publish",
      description: "Generate a share link or QR code and go live instantly.",
      chip: "No app required",
    },
  ];

  const metrics = [
    { number: "10+", label: "Businesses onboarded" },
    { number: "100", label: "Filters published" },
    { number: "30,000", label: "Monthly opens & views" },
    { number: "18%", label: "Avg. engagement uplift vs. baseline" },
  ];

  const benefits = [
    {
      title: "Faster Go-Live",
      description: "Ship campaigns in hours, not weeks.",
    },
    {
      title: "Scales with You",
      description: "From one-off events to nationwide rollouts.",
    },
    {
      title: "Brand-Safe",
      description: "White-label options and custom dashboards on higher tiers.",
    },
  ];

  const useCases = [
    "Salons",
    "Restaurants",
    "D2C",
    "Colleges",
    "Festivals",
    "Agencies",
  ];
</script>

<section class="how-it-works">
  <div class="container">
    <!-- Block A -->
    <div class="block-a">
      <header class="section-header">
        <h2>How MyAR Works</h2>
        <p>From idea to shareable AR experience in minutes.</p>
      </header>

      <div class="grid">
        <!-- Steps column -->
        <div class="steps-col">
          {#each steps as step, i}
            <article class="step">
              <div class="step-icon" aria-hidden="true">
                <!-- connector only if not last -->
                {#if i < steps.length - 1}
                  <span class="connector" />
                {/if}
                <div class="icon-wrap">
                  <svelte:component this={step.icon} class="icon" />
                </div>
              </div>

              <div class="step-body">
                <div class="step-head">
                  <h3>{step.title}</h3>
                  <span class="chip">{step.chip}</span>
                </div>
                <p class="step-desc">{step.description}</p>

                <button class="learn-more" type="button">
                  <span>Learn more</span>
                  <ArrowRight class="arrow" />
                </button>
              </div>
            </article>
          {/each}

          <div class="requirements">
            <div class="req-title">Requirements</div>
            <div class="req-text">
              Recommended: transparent assets • PNG/GIF
            </div>
          </div>

          <div class="cta-row">
            <button class="btn primary">Create Your First Filter</button>
            <button class="btn outline">See Docs</button>
          </div>
        </div>

        <!-- Illustration column -->
        <aside class="illustration-col" aria-hidden="true">
          <div class="illustration-card">
            <div class="illustration-face">
              <div class="face-outline" />
              <div class="tracking dot-a" />
              <div class="tracking dot-b" />
              <div class="tracking dot-c" />
              <div class="tracking dot-d" />
              <div class="ar el1" />
              <div class="ar el2" />
              <div class="ar el3" />
              <div class="grid-overlay" />
            </div>
            <div class="illustration-caption">
              Real-time 3D positioning & face tracking
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Block B -->
    <div class="block-b" id="customer">
      <header class="section-header">
        <h2>Why Customers Choose MyAR</h2>
      </header>

      <div class="metrics">
        {#each metrics as m}
          <div class="metric">
            <div class="metric-number">{m.number}</div>
            <div class="metric-label">{m.label}</div>
          </div>
        {/each}
      </div>

      <div class="benefits">
        {#each benefits as b}
          <div class="benefit">
            <div class="benefit-icon"><Check class="check" /></div>
            <div class="benefit-body">
              <h3>{b.title}</h3>
              <p>{b.description}</p>
            </div>
          </div>
        {/each}
      </div>

      <div class="usecases">
        {#each useCases as uc}
          <span class="usecase">{uc}</span>
        {/each}
      </div>

      <!-- <div class="testimonial">
        <p class="quote">"MyAR made our campus fest go viral in 48 hours."</p>
        <p class="byline">— Festival Organizer, Delhi University</p>
      </div> -->

      <div class="testimonial">
        <div class="testimonial-content">
          <!-- Left side: step-styled images -->
          <div class="testimonial-images steps">
            <img src={photo2} alt="AR Filter Example 1" class="step-1" />
            <img src={photo1} alt="AR Filter Example 2" class="step-2" />
            <img src={photo1} alt="AR Filter Example 3" class="step-3" />
            <img src={photo1} alt="AR Filter Example 4" class="step-4" />
          </div>

          <!-- Right side: text -->
          <div class="testimonial-text">
            <p class="quote">
              "MyAR filters are a great addition to our puja. They are really
              boosting our engagement! 👍🏻"
            </p>
          </div>
        </div>
      </div>

      <div class="final-cta">
        <h3>Ready to launch your first AR filter?</h3>
        <div class="final-cta-row">
          <button class="btn primary">Start Free</button>
          <button class="btn outline">Talk to Sales</button>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* ----------------------
       Theme variables (edit as needed)
       ---------------------- */
  :root {
    --bg: #fff; /* page bg fallback */
    --foreground: #0f172a;
    --muted: #f8fafc;
    --muted-foreground: #6b7280;
    --primary: #6366f1;
    --accent: #ec4899;
    --card: #ffffff;
    --border: #e6e9f2;
    /* rgb versions for rgba() use */
    --primary-rgb: 99, 102, 241;
    --accent-rgb: 236, 72, 153;
    --background-rgb: 245, 246, 250;
  }

  /* Container */
  .how-it-works {
    background: linear-gradient(
      to bottom,
      var(--muted),
      rgba(255, 255, 255, 0.02)
    );
    padding: 4.5rem 0;
    color: var(--foreground);
    font-family:
      Inter,
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial;
  }

  .container {
    width: 90%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2.25rem;
    padding: 0 1rem;
  }

  .section-header h2 {
    font-size: 2.25rem;
    line-height: 1.2;
    margin: 0 0 0.5rem;
    font-weight: 700;
  }

  .section-header p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 1.125rem;
    max-width: 600px;
    margin: 0 auto;
  }

  /* Grid for block A (steps + illustration) */
  .grid {
    display: grid;
    gap: 3rem;
    grid-template-columns: 1fr;
    align-items: start;
  }

  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
    }
  }

  /* Steps column */
  .steps-col {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .step {
    /* display: flex; */
    gap: 1.5rem;
    align-items: flex-start;
  }

  .step-icon {
    position: relative;
    width: 64px;
    min-width: 64px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    color: var(--primary);
  }

  /* connector line between steps */
  .connector {
    position: absolute;
    width: 2px;
    height: 60px;
    background: var(--border);
    top: 44px; /* starts below icon */
    left: 50%;
    transform: translateX(-50%);
    border-radius: 2px;
    transition: background 0.2s;
  }

  .icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 9999px;
    background: rgba(var(--primary-rgb), 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.2s,
      transform 0.18s;
    z-index: 2;
  }

  .step:hover .icon-wrap {
    background: rgba(var(--primary-rgb), 0.12);
    transform: translateY(-2px);
  }

  .icon {
    width: 28px;
    height: 28px;
    color: var(--primary);
  }

  .step-body {
    flex: 1;
  }

  .step-head {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  @media (min-width: 640px) {
    .step-head {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }
  }

  .step-head h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .chip {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    background: rgba(var(--primary-rgb), 0.06);
    color: #410a5c;
    display: inline-block;
    white-space: nowrap;
  }

  .step-desc {
    margin: 0 0 1rem;
    color: var(--muted-foreground);
    line-height: 1.6;
    font-size: 1rem;
  }

  .learn-more {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    transition: gap 0.2s ease;
  }

  .learn-more:hover {
    gap: 0.6rem;
  }

  .arrow {
    width: 14px;
    height: 14px;
    transition: transform 0.2s ease;
  }

  .learn-more:hover .arrow {
    transform: translateX(2px);
  }

  /* Requirements box */
  .requirements {
    margin-top: 1.5rem;
    background: rgba(var(--primary-rgb), 0.04);
    border: 1px solid rgba(var(--primary-rgb), 0.14);
    padding: 1rem;
    border-radius: 10px;
    max-width: 400px;
  }

  .req-title {
    color: var(--primary);
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: 0.95rem;
  }

  .req-text {
    color: var(--muted-foreground);
    font-size: 0.95rem;
  }

  /* CTA buttons row */
  .cta-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  @media (min-width: 640px) {
    .cta-row {
      flex-direction: row;
    }
  }

  .btn {
    padding: 0.85rem 1.5rem;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.2s ease;
    text-align: center;
  }

  .btn.primary {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    color: white;
  }

  .btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  .btn.outline {
    background: transparent;
    border-color: var(--border);
    color: var(--foreground);
  }

  .btn.outline:hover {
    background: rgba(var(--primary-rgb), 0.05);
    border-color: var(--primary);
  }

  /* Illustration card */
  .illustration-col {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .illustration-card {
    background: linear-gradient(
      135deg,
      rgba(var(--primary-rgb), 0.06),
      rgba(var(--accent-rgb), 0.06)
    );
    border-radius: 16px;
    border: 1px solid var(--border);
    padding: 1.5rem;
    max-width: 420px;
    width: 100%;
  }

  .illustration-face {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.02),
      rgba(0, 0, 0, 0.02)
    );
  }

  .face-outline {
    position: absolute;
    width: 120px;
    height: 170px;
    border-radius: 999px;
    border: 2px dashed rgba(var(--primary-rgb), 0.36);
    animation: pulse 2.2s infinite;

    /* Center it */
    top: 20%;
    left: 34%;
    transform: translate(-50%, -50%);
  }

  .tracking {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: ping 1.6s infinite ease-out;
  }

  .dot-a,
  .dot-b,
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
    top: 28%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
  }

  .dot-b {
    top: 40%;
    left: 40%;
    background: var(--accent);
    animation-delay: 0.12s;
  }

  .dot-c {
    top: 40%;
    right: 40%;
    background: var(--accent);
    animation-delay: 0.24s;
  }

  .dot-d {
    bottom: 40%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(var(--primary-rgb), 0.75);
    animation-delay: 0.36s;
  }

  /* AR overlay elements */
  .el1,
  .el2,
  .el3 {
    position: absolute;
    border: 2px solid;
    animation: float 4s ease-in-out infinite;
  }

  .el1 {
    top: 14%;
    left: 50%;
    transform: translateX(-50%);
    width: 20%;
    height: 10%;
    background: rgba(var(--accent-rgb), 0.22);
    border-color: rgba(var(--accent-rgb), 0.35);
  }

  .el2 {
    top: 38%;
    left: 23%;
    width: 15%;
    height: 10%;
    border-radius: 999px;
    background: rgba(var(--primary-rgb), 0.18);
    border-color: rgba(var(--primary-rgb), 0.32);
    animation-delay: 0.12s;
  }

  .el3 {
    top: 38%;
    right: 23%;
    width: 15%;
    height: 10%;
    border-radius: 999px;
    background: rgba(var(--primary-rgb), 0.18);
    border-color: rgba(var(--primary-rgb), 0.32);
    animation-delay: 0.24s;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        rgba(var(--primary-rgb), 0.08) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(var(--primary-rgb), 0.08) 1px,
        transparent 1px
      );
    background-size: 20px 20px;
    pointer-events: none;
  }

  .illustration-caption {
    text-align: center;
    margin-top: 1rem;
    color: var(--muted-foreground);
    font-size: 0.95rem;
  }

  /* Block B styles */
  .block-b {
    margin-top: 5rem;
    padding-top: 4rem;
    border-top: 1px solid var(--border);
  }

  /* Metrics */
  .metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin: 2.5rem 0;
  }

  @media (min-width: 768px) {
    .metrics {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .metric {
    text-align: center;
    padding: 1rem;
  }

  .metric-number {
    font-weight: 700;
    font-size: 1.75rem;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }

  .metric-label {
    color: var(--muted-foreground);
    font-size: 0.95rem;
  }

  /* Benefits */
  .benefits {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin: 2.5rem 0;
  }

  @media (min-width: 768px) {
    .benefits {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .benefit {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1.5rem;
    border-radius: 12px;
    background: var(--card);
    border: 1px solid var(--border);
    transition:
      box-shadow 0.2s ease,
      transform 0.2s ease;
  }

  .benefit:hover {
    box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
    transform: translateY(-3px);
  }

  .benefit-icon {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: rgba(var(--primary-rgb), 0.08);
    display: grid;
    place-items: center;
    color: var(--primary);
    flex-shrink: 0;
  }

  .check {
    color: var(--primary);
    width: 20px;
    height: 20px;
  }

  .benefit-body h3 {
    margin: 0 0 0.5rem;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .benefit-body p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  /* Use cases */
  .usecases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 2rem 0;
    justify-content: center;
  }

  .usecase {
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.95rem;
    background: var(--card);
    transition: all 0.2s ease;
  }

  .usecase:hover {
    background: rgba(var(--primary-rgb), 0.05);
    border-color: var(--primary);
    color: var(--primary);
  }

  /* Testimonial and final CTA */
  /* .testimonial {
    margin: 3rem 0;
    background: linear-gradient(
      90deg,
      rgba(var(--primary-rgb), 0.04),
      rgba(var(--accent-rgb), 0.04)
    );
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    text-align: center;
  } */

  /* Testimonial Wrapper */
  .testimonial {
    /* margin: 3rem 0; */
    background: linear-gradient(
      90deg,
      rgba(var(--primary-rgb), 0.04),
      rgba(var(--accent-rgb), 0.04)
    );
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  /* Flexbox for 2-column layout */
  .testimonial-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rem;
    flex-wrap: wrap; /* responsive */
  }

  /* Step-styled images */
  .testimonial-images.steps {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .testimonial-images.steps img {
    width: 160px;
    border-radius: 16px;
    /* box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); */
    object-fit: cover;
  }

  /* Step effect (each lower than the previous one) */
  .testimonial-images .step-1 {
    margin-top: 0;
  }
  .testimonial-images .step-2 {
    margin-top: 20px;
  }
  .testimonial-images .step-3 {
    margin-top: 40px;
  }
  .testimonial-images .step-4 {
    margin-top: 60px;
  }

  /* Right side text */
  .testimonial-text {
    max-width: 400px;
    text-align: left;
  }

  .testimonial-text .quote {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  /* .testimonial-text .byline {
    font-weight: 600;
    color: var(--text-muted);
  } */

  .quote {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  /* .byline {
    color: var(--muted-foreground);
    font-size: 1rem;
  } */

  /* 📱 Medium + Mobile view: 2 images per row */
  @media (max-width: 775px) {
    .testimonial-content {
      flex-direction: column;
      text-align: center;
    }

    .testimonial-images.steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr); /* 2 per row */
      gap: 1rem;
      justify-items: center;
    }

    .testimonial-images.steps img {
      width: 90%; /* make images fill nicely */
      margin-top: 0; /* remove step effect */
    }

    .testimonial-text {
      text-align: center;
      max-width: 90%;
    }

    /* Keep staircase effect */
    .testimonial-images.steps img:nth-child(1) {
      margin-top: 0;
    }
    .testimonial-images.steps img:nth-child(2) {
      margin-top: 20px;
    }
    .testimonial-images.steps img:nth-child(3) {
      margin-top: 40px;
    }
    .testimonial-images.steps img:nth-child(4) {
      margin-top: 60px;
    }
  }

  .final-cta {
    margin: 3rem 0 1rem;
    background: var(--card);
    border-radius: 16px;
    padding: 2rem;
    border: 1px solid var(--border);
    text-align: center;
  }

  .final-cta h3 {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .final-cta-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
  }

  @media (min-width: 640px) {
    .final-cta-row {
      flex-direction: row;
    }
  }

  .block-a {
    padding-bottom: 2rem;
  }

  /* Animations */
  @keyframes pulse {
    0% {
      opacity: 0.6;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.02);
    }
    100% {
      opacity: 0.6;
      transform: scale(1);
    }
  }

  @keyframes ping {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    75% {
      transform: scale(1.8);
      opacity: 0;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
    100% {
      transform: translateY(0);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 1023px) {
    .how-it-works {
      padding: 3rem 0;
    }

    .section-header h2 {
      font-size: 2rem;
    }

    .step {
      gap: 1.25rem;
    }

    .illustration-card {
      max-width: 350px;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 1rem;
    }

    .step-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .metrics {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .metric {
      padding: 0.75rem;
    }

    .metric-number {
      font-size: 1.5rem;
    }

    .benefits {
      grid-template-columns: 1fr;
    }

    .testimonial {
      padding: 1.5rem;
    }

    .final-cta {
      padding: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .metrics {
      grid-template-columns: 1fr;
    }

    .step {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
    }

    .step-body {
      width: 100%;
    }

    .step-head {
      align-items: center;
    }

    .illustration-card {
      padding: 1rem;
    }
  }
</style>
