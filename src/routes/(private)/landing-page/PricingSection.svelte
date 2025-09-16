<script>
  import PricingCard from "./PricingCard.svelte";
  import EventPackCard from "./EventPackCard.svelte";
  import FilterBenefits from "./FilterBenefits.svelte";
  let isAnnual = false;

  const toggleAnnual = () => {
    isAnnual = !isAnnual;
  };

  const subscriptionPlans = [
    {
      name: "Starter",
      description: "Perfect for individuals & first-time creators",
      monthlyPrice: 2999,
      annualPrice: 32000,
      features: [
        "1 Static Filter / month",
        "Logo & text overlay customization",
        "Email support",
        "Basic analytics dashboard",
      ],
      cta: "Start with Starter",
      popular: false,
    },
    {
      name: "Growth",
      description: "Best for small businesses, restaurants & salons",
      monthlyPrice: 24999,
      annualPrice: 249999,
      features: [
        "Up to 3 Animated Filters / month",
        "Logo + Branding + Call-to-Action",
        "Email + Chat support",
        "Advanced analytics & insights",
        "Social media integration",
      ],
      cta: "Upgrade to Growth",
      popular: false,
    },
    {
      name: "Pro AI",
      description:
        "Designed for D2C brands, colleges & high-engagement campaigns",
      monthlyPrice: 29999,
      annualPrice: 299999,
      features: [
        "Up to 12 AI-Powered Filters / month",
        "Face-tracking, full brand customization",
        "Priority support",
        "Custom AI training",
        "White-label options",
        "API access",
      ],
      cta: "Choose Pro AI",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Ideal for enterprises, agencies & nationwide campaigns",
      monthlyPrice: null,
      annualPrice: null,
      features: [
        "Up to 20 Static + Animated + AI Filters / month",
        "Advanced AI features",
        "White-label branding + Custom dashboard",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
      ],
      cta: "Contact Us",
      popular: false,
    },
  ];

  const eventPacks = [
    {
      name: "Basic Pack",
      description: "1 Static Filter",
      price: 9999,
      cta: "Get This Pack",
    },
    {
      name: "Premium Pack",
      description: "Up to 3 Animated Filters",
      price: 27999,
      cta: "Get This Pack",
    },
    {
      name: "Animated Filter",
      description: "1 Animated Filter",
      price: 14999,
      cta: "Get This Pack",
    },
    {
      name: "AI Filter",
      description: "1 AI Face Tracking Filter",
      price: 4999,
      cta: "Get This Pack",
    },
  ];
</script>

<section class="pricing-section">
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h2>
        Choose Your <span class="gradient-text">AR Journey</span>
      </h2>
      <p>
        Select the perfect plan that grows with your AR needs and creativity
      </p>

      <!-- Toggle -->
      <div class="toggle">
        <span class:active={!isAnnual}>Monthly</span>
        <button class="switch" on:click={toggleAnnual}>
          <div class:knob-annual={isAnnual} class="knob"></div>
        </button>
        <span class:active={isAnnual}>Annual</span>
        {#if isAnnual}
          <span class="save-badge">Save up to 20%</span>
        {/if}
      </div>
    </div>

    <!-- Subscription Plans -->
    <div class="plans">
      {#each subscriptionPlans as plan, index}
        <PricingCard {...plan} {isAnnual} delay={index * 100} />
      {/each}
    </div>

    <!-- Event Packs -->
    <div class="event-packs">
      <div class="event-header">
        <h3>One-Time Event Packs</h3>
        <p>Perfect for weddings, festivals & product launches</p>
      </div>

      <div class="packs">
        {#each eventPacks as pack, index}
          <EventPackCard {...pack} delay={index * 100} />
        {/each}
      </div>
    </div>

    <!-- Filter Benefits -->
    <FilterBenefits />
  </div>
</section>

<style>
  .pricing-section {
    padding: 0rem 1rem;
    background: var(--background, #fafafa);
  }
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
  .header {
    text-align: center;
    margin-bottom: 4rem;
  }
  .header h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .header p {
    font-size: 1.125rem;
    color: #666;
    margin-bottom: 2rem;
  }
  .gradient-text {
    background: linear-gradient(90deg, #6366f1, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
  }
  .toggle span {
    font-weight: 500;
    color: #999;
  }
  .toggle span.active {
    color: #6366f1;
  }
  .switch {
    position: relative;
    width: 56px;
    height: 28px;
    border-radius: 9999px;
    border: 2px solid #ccc;
    background: #eee;
    cursor: pointer;
    overflow: hidden;
  }
  .switch:hover {
    border-color: #6366f1;
  }
  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s;
  }
  .knob-annual {
    transform: translateX(28px);
  }
  .save-badge {
    background: linear-gradient(90deg, #6366f1, #ec4899);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .plans {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 5rem;
  }
  @media (min-width: 768px) {
    .plans {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1200px) {
    .plans {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .event-packs {
    margin-bottom: 5rem;
  }
  .event-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  .event-header h3 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .event-header p {
    font-size: 1.125rem;
    color: #666;
  }
  .packs {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 768px) {
    .packs {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1200px) {
    .packs {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
