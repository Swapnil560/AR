<script>
  import { Upload, Eye, Share2, Check, ArrowRight } from "lucide-svelte";

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
    { number: "1,200+", label: "Businesses onboarded" },
    { number: "25,000+", label: "Filters published" },
    { number: "2.3M+", label: "Monthly opens & views" },
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
  <div class="wrap">
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

      <div class="testimonial">
        <p class="quote">"MyAR made our campus fest go viral in 48 hours."</p>
        <p class="byline">— Festival Organizer, Delhi University</p>
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
    padding: 4.5rem 1rem;
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

  .wrap {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2.25rem;
  }

  .section-header h2 {
    font-size: 2rem;
    line-height: 1.08;
    margin: 0 0 0.5rem;
    font-weight: 700;
  }

  .section-header p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 1.05rem;
  }

  /* Grid for block A (steps + illustration) */
  .grid {
    display: grid;
    gap: 2.5rem;
    grid-template-columns: 1fr;
    align-items: start;
  }

  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Steps column */
  .steps-col {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .step {
    display: flex;
    gap: 1.25rem;
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
    height: 56px;
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
    gap: 0.75rem;
    align-items: center;
  }

  .step-head h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .chip {
    font-size: 0.72rem;
    padding: 0.18rem 0.45rem;
    border-radius: 6px;
    background: rgba(var(--primary-rgb), 0.06);
    color: #410a5c;
    display: inline-block;
  }

  .step-desc {
    margin: 0.5rem 0 0.75rem;
    color: var(--muted-foreground);
    line-height: 1.6;
  }

  .learn-more {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0;
  }

  .arrow {
    width: 14px;
    height: 14px;
  }

  /* Requirements box */
  .requirements {
    margin-top: 1rem;
    background: rgba(var(--primary-rgb), 0.04);
    border: 1px solid rgba(var(--primary-rgb), 0.14);
    padding: 0.85rem;
    border-radius: 10px;
  }
  .req-title {
    color: var(--primary);
    font-weight: 600;
    margin-bottom: 0.2rem;
  }
  .req-text {
    color: var(--muted-foreground);
    font-size: 0.92rem;
  }

  /* CTA buttons row */
  .cta-row {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.72rem 1rem;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .btn.primary {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    color: white;
  }

  .btn.outline {
    background: transparent;
    border-color: var(--border);
    color: var(--foreground);
  }

  /* Illustration card */
  .illustration-card {
    background: linear-gradient(
      135deg,
      rgba(var(--primary-rgb), 0.06),
      rgba(var(--accent-rgb), 0.06)
    );
    border-radius: 12px;
    border: 1px solid var(--border);
    padding: 1.25rem;
  }

  .illustration-face {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 10px;
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
    inset: 1rem;
    border-radius: 999px;
    border: 2px dashed rgba(var(--primary-rgb), 0.36);
    animation: pulse 2.2s infinite;
  }

  .tracking {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: ping 1.6s infinite ease-out;
  }
  .dot-a {
    top: 3rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
  }
  .dot-b {
    top: 6.5rem;
    left: 3.25rem;
    background: var(--accent);
    animation-delay: 0.12s;
  }
  .dot-c {
    top: 6.5rem;
    right: 3.25rem;
    background: var(--accent);
    animation-delay: 0.24s;
  }
  .dot-d {
    bottom: 4.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(var(--primary-rgb), 0.75);
    animation-delay: 0.36s;
  }

  .ar {
    position: absolute;
    border-radius: 8px;
    border: 1px solid transparent;
    animation: float 3.6s infinite;
  }
  .el1 {
    top: -0.6rem;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 28px;
    background: rgba(var(--accent-rgb), 0.22);
    border-color: rgba(var(--accent-rgb), 0.35);
  }
  .el2 {
    top: 6.5rem;
    left: -1.2rem;
    width: 36px;
    height: 26px;
    background: rgba(var(--primary-rgb), 0.18);
    border-color: rgba(var(--primary-rgb), 0.32);
    border-radius: 999px;
    animation-delay: 0.12s;
  }
  .el3 {
    top: 6.5rem;
    right: -1.2rem;
    width: 36px;
    height: 26px;
    background: rgba(var(--primary-rgb), 0.18);
    border-color: rgba(var(--primary-rgb), 0.32);
    border-radius: 999px;
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
    margin-top: 0.75rem;
    color: var(--muted-foreground);
    font-size: 0.9rem;
  }

  /* Metrics */
  .metrics {
    padding-top: 1rem;
    padding-bottom: 1rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-top: 2rem;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 768px) {
    .metrics {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .metric {
    text-align: center;
  }
  .metric-number {
    font-weight: 700;
    font-size: 1.6rem;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .metric-label {
    color: var(--muted-foreground);
    font-size: 0.9rem;
    margin-top: 0.25rem;
  }

  /* Benefits */
  .benefits {
    padding-top: 1rem;
    padding-bottom: 1rem;
    display: grid;
    gap: 1rem;
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 768px) {
    .benefits {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .benefit {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 1rem;
    border-radius: 10px;
    background: var(--card);
    border: 1px solid var(--border);
    transition: box-shadow 0.18s ease;
  }
  .benefit:hover {
    box-shadow: 0 10px 30px rgba(2, 6, 23, 0.06);
  }

  .benefit-icon {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: rgba(var(--primary-rgb), 0.08);
    display: grid;
    place-items: center;
    color: var(--primary);
  }
  .check {
    color: var(--primary);
    width: 18px;
    height: 18px;
  }

  .benefit-body h3 {
    margin: 0 0 0.3rem;
    font-weight: 700;
    font-size: 1rem;
  }
  .benefit-body p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.95rem;
  }

  /* Use cases */
  .usecases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
    justify-content: center;
  }
  .usecase {
    border: 1px solid var(--border);
    padding: 0.45rem 0.75rem;
    border-radius: 999px;
    font-size: 0.9rem;
  }

  /* Testimonial and final CTA */
  .testimonial {
    height: 30vh;
    margin-top: 2rem;
    margin-bottom: 2rem;
    background: linear-gradient(
      90deg,
      rgba(var(--primary-rgb), 0.04),
      rgba(var(--accent-rgb), 0.04)
    );
    padding: 1rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    text-align: center;
  }
  .quote {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  .byline {
    color: var(--muted-foreground);
    font-size: 0.95rem;
  }

  .final-cta {
    margin-top: 1rem;
    background: var(--card);
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid var(--border);
    text-align: center;
  }
  .final-cta h3 {
    margin: 0 0 0.75rem;
    font-size: 1.125rem;
  }
  .final-cta-row {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .block-a{
    padding-bottom: 5rem;
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
</style>
