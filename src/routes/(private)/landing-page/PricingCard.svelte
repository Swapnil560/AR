<script lang="ts">
    import { Check, Star } from "lucide-svelte";
  
    export let name: string;
    export let description: string;
    export let monthlyPrice: number | null;
    export let annualPrice: number | null;
    export let features: string[];
    export let cta: string;
    export let popular: boolean;
    export let isAnnual: boolean;
    export let delay: number;
  
    const price = isAnnual ? annualPrice : monthlyPrice;
    const period = isAnnual ? "year" : "month";
  
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(price);
    };
  
    const getButtonVariant = () => {
      if (name === "Enterprise") return "outline";
      return popular ? "default" : "outline";
    };
  </script>
  
  <div
    class="card {popular ? 'card-popular' : 'card-normal'}"
    style="animation-delay: {delay}ms"
  >
    {#if popular}
      <div class="popular-badge">
        <Star class="icon-star" />
        Most Popular
      </div>
    {/if}
  
    <div class="header">
      <h3 class={popular ? "title title-popular" : "title"}>
        {name}
      </h3>
      <p class={popular ? "desc desc-popular" : "desc"}>{description}</p>
    </div>
  
    <div class="price-box">
      {#if price}
        <div class={popular ? "price price-popular" : "price"}>
          {formatPrice(price)}
        </div>
        <div class={popular ? "period period-popular" : "period"}>
          per {period}
        </div>
      {:else}
        <div class={popular ? "custom custom-popular" : "custom"}>
          Custom Pricing
        </div>
      {/if}
    </div>
  
    <ul class="features">
      {#each features as feature, index}
        <li>
          <Check class="check" />
          <span class={popular ? "feature-text-popular" : "feature-text"}>
            {feature}
          </span>
        </li>
      {/each}
    </ul>
  
    <button
      class={`cta ${popular ? "cta-popular" : ""}`}
      data-variant={getButtonVariant()}
    >
      {cta}
    </button>
  </div>
  
  <style>
    .card {
      position: relative;
      padding: 1.5rem;
      height: 90%;
      transition: all 0.5s;
      border-radius: 0.75rem;
    }
    .card:hover {
      transform: scale(1.05);
    }
  
    .card-normal {
      background: linear-gradient(to bottom right, #fff, #f9fafb);
      border: 1px solid #e5e7eb;
      color: #4f46e5;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
  
    .card-popular {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #fff;
      border: none;
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
    }
  
    .popular-badge {
      position: absolute;
      top: -1rem;
      left: 50%;
      transform: translateX(-50%);
      background: #facc15;
      color: #000;
      padding: 0.25rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  
    .icon-star {
      width: 0.75rem;
      height: 0.75rem;
    }
  
    .header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
  
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #111827;
    }
    .title-popular {
      color: #fff;
    }
  
    .desc {
      font-size: 0.875rem;
      color: #6b7280;
    }
    .desc-popular {
      color: rgba(255, 255, 255, 0.8);
    }
  
    .price-box {
      text-align: center;
      margin-bottom: 2rem;
    }
  
    .price {
      font-size: 2.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: #111827;
    }
    .price-popular {
      color: #fff;
    }
  
    .period {
      font-size: 0.875rem;
      color: #6b7280;
    }
    .period-popular {
      color: rgba(255, 255, 255, 0.8);
    }
  
    .custom {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
    }
    .custom-popular {
      color: #fff;
    }
  
    .features {
      list-style: none;
      margin: 0;
      padding: 0;
      margin-bottom: 2rem;
    }
  
    .features li {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
  
    .check {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
      color: #4f46e5;
    }
  
    .feature-text {
      font-size: 0.875rem;
      color: #111827;
    }
    .feature-text-popular {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
    }
  
    .cta {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 0.5rem;
      border: 1px solid #d1d5db;
      transition: all 0.3s;
    }
  
    .cta:hover {
      background: #4f46e5;
      color: #fff;
    }
  
    .cta-popular {
      background: #fff;
      color: #4f46e5;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .cta-popular:hover {
      background: rgba(255, 255, 255, 0.9);
    }
  </style>
  