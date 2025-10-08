<script lang="ts">
  import { createEventDispatcher } from "svelte";
  export let pricingPlans = [];
  export let currentPlan: string = "";
  export let displayRate: string = "monthly";
  export let show: boolean = false;
  export let isProcessingPayment: boolean = false;
  export let loading: boolean = false;
  export let onSelectPlan: (planId: string) => void;
  export let onToggle: () => void;
  export let showBillingSwitch: boolean = true;

  const dispatch = createEventDispatcher();

  function handleSelectPlan(planId: string) {
    if (onSelectPlan) onSelectPlan(planId);
    dispatch("selectPlan", { planId });
  }
  function handleToggle() {
    if (onToggle) onToggle();
    dispatch("toggle");
  }
</script>

{#if show}
  <div class="pricing-section">
    <div class="pricing-header">
      <h3 class="pricing-title">Choose Your Plan</h3>
      <button class="close-btn" on:click={handleToggle}>✕</button>
    </div>
    {#if showBillingSwitch}
      <div>
        <div class="billing-switch">
          <span class="switch-label">Billing:</span>
          <label
            class="switch-option {displayRate === 'monthly' ? 'active' : ''}"
          >
            <input type="radio" bind:group={displayRate} value="monthly" />
            Monthly
          </label>
          <label
            class="switch-option {displayRate === 'yearly' ? 'active' : ''}"
          >
            <input type="radio" bind:group={displayRate} value="yearly" />
            Yearly
          </label>
        </div>
      </div>
    {/if}
    <div class="pricing-grid">
      {#each pricingPlans as plan}
        <div
          class="pricing-card {plan.popular ? 'popular' : ''} {currentPlan ==
          plan.id
            ? 'current'
            : ''}"
        >
          {#if plan.popular}
            <div class="popular-badge">Most Popular</div>
          {/if}
          {#if currentPlan === plan.id}
            <div class="current-badge">Current Plan</div>
          {/if}
          <div class="plan-header">
            <h4 class="plan-name">{plan.name}</h4>
            <div class="plan-price">
              <span class="price">
                {#if plan.monthly_price !== undefined && plan.yearly_price !== undefined}
                  ₹{displayRate === "monthly"
                    ? plan.monthly_price
                    : plan.yearly_price}
                {:else}
                  {plan.price}
                {/if}
              </span>
              {#if plan.period !== "forever"}
                <span class="period">
                  /{#if plan.monthly_price !== undefined && plan.yearly_price !== undefined}{displayRate ===
                    "monthly"
                      ? "mo"
                      : "yr"}{:else}{plan.period}{/if}
                </span>
              {/if}
            </div>
          </div>
          <div class="plan-features">
            <div class="feature-item">
              <span class="feature-label">Filters:</span>
              <span class="feature-value">{plan.filters}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">Storage:</span>
              <span class="feature-value">{plan.storage}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">Features:</span>
              <span class="feature-value">{plan.features}</span>
            </div>
          </div>
          <div class="plan-action">
            {#if currentPlan === plan.id}
              <button class="plan-btn current" disabled>Current Plan</button>
            {:else}
              <button
                class="plan-btn"
                on:click={() => handleSelectPlan(plan.id)}
                disabled={isProcessingPayment || currentPlan == plan.id}
              >
                {#if isProcessingPayment}
                  <div class="payment-loading">
                    <div class="spinner"></div>
                    Processing...
                  </div>
                {:else if currentPlan == plan.id}
                  Subscribed
                {:else if plan.monthly_price !== undefined && plan.yearly_price !== undefined}
                  {plan.monthly_price == 0 ? "Downgrade" : "Upgrade"} to {plan.name}
                {:else}
                  {plan.id === "free" ? "Downgrade" : "Upgrade"} to {plan.name}
                {/if}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- <style>
  /* Copy the relevant styles from dashboard and admin for .pricing-section, .pricing-header, .pricing-card, etc. */
  @import "../routes/(private)/dashboard/+page.svelte";
</style> -->

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    min-height: 100vh;
  }

  /* Pricing Plans Styles */
  .pricing-section {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .pricing-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .pricing-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 1.2rem;
    color: #666;
    transition: all 0.3s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .pricing-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    position: relative;
    border: 2px solid transparent;
  }

  .pricing-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }

  .pricing-card.popular {
    border-color: #ffd700;
    transform: scale(1.05);
  }

  .pricing-card.current {
    border-color: #48bb78;
    background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
  }

  .popular-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%);
    color: #744210;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  }

  .current-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);
  }

  .plan-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-top: 1rem;
  }

  .plan-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 0.5rem 0;
  }

  .plan-price {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 0.25rem;
  }

  .price {
    font-size: 2.5rem;
    font-weight: 800;
    color: #4a5568;
  }

  .period {
    font-size: 1rem;
    color: #718096;
    font-weight: 500;
  }

  .plan-features {
    margin-bottom: 1.5rem;
  }

  .feature-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .feature-item:last-child {
    border-bottom: none;
  }

  .feature-label {
    font-weight: 600;
    color: #4a5568;
  }

  .feature-value {
    color: #2d3748;
    font-weight: 500;
  }

  .plan-action {
    text-align: center;
  }

  .plan-btn {
    width: 100%;
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
  }

  .plan-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(66, 153, 225, 0.4);
  }

  .plan-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .plan-btn:disabled:hover {
    transform: none;
    box-shadow: none;
  }

  .payment-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .plan-btn.current {
    background: #48bb78;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .plan-btn.current:hover {
    transform: none;
    box-shadow: none;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .pricing-section {
      padding: 1.5rem;
    }

    .pricing-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .pricing-card {
      margin: 0;
    }

    .pricing-card.popular {
      transform: none;
      scale: 1;
    }

    .pricing-title {
      font-size: 1.5rem;
    }

    .plan-name {
      font-size: 1.3rem;
    }

    .price {
      font-size: 2rem;
    }

    .plan-btn {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }

    .billing-switch {
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }

    .switch-option {
      width: 120px;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .pricing-section {
      padding: 1rem;
    }

    .pricing-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .pricing-title {
      font-size: 1.3rem;
    }

    .pricing-card {
      padding: 1.25rem;
    }

    .plan-header {
      padding-top: 0.75rem;
    }

    .plan-btn {
      padding: 0.875rem 1.25rem;
      font-size: 0.95rem;
    }

    .billing-switch {
      margin-bottom: 1rem;
    }

    .switch-option {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      width: 100px;
    }
  }
  .billing-switch {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  .switch-label {
    font-weight: 600;
    color: #4a5568;
    margin-right: 0.5rem;
  }
  .switch-option {
    background: #e2e8f0;
    border-radius: 20px;
    padding: 0.5rem 1.2rem;
    cursor: pointer;
    font-weight: 500;
    color: #2d3748;
    transition: background 0.2s;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .switch-option.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: #667eea;
  }
  .switch-option input[type="radio"] {
    accent-color: #667eea;
    margin-right: 0.3rem;
  }
</style>
