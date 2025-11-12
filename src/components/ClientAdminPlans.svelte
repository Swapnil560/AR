<script lang="ts">
  import { Plus, CreditCard, ChevronDown } from "lucide-svelte";
  
  let showDangerZone = false;
</script>

<div class="plans-container">


  <!-- Active Plan Section -->
  <div class="section">
    <h3 class="section-title">Active Plan</h3>
    <div class="plan-card">
      <div class="plan-content">
        <div class="plan-info">
          <h2 class="plan-title">Starter ₹6,999/month | 1 members (VAT or sales tax may apply)</h2>
          <p class="plan-dates">Purchased on: 1/15/2024 • Ends on: 3/20/2024</p>
          <ul class="features">
            <li>1 Static Filter / month</li>
            <li>Logo & text overlay customization</li>
            <li>Email support</li>
            <li>Basic analytics dashboard</li>
          </ul>
        </div>
        <button class="upgrade-btn">Upgrade</button>
      </div>
    </div>
  </div>

  <!-- Payment Details Section -->
  <div class="section">
    <div class="payment-details">
      <div class="payment-left">
        <h3 class="section-title">Payment details</h3>
        <div class="card-info">
          <CreditCard size={16} />
          <span>••••••••7009</span>
        </div>
      </div>
      <button class="link-btn">Update payment details</button>
    </div>
  </div>

  <!-- Danger Zone Section -->
  <div class="section">
    <div class="danger-zone">
      <div class="danger-content" on:click={() => showDangerZone = !showDangerZone}>
        <div>
          <h3 class="danger-title">Danger zone</h3>
          <p class="danger-subtitle">Manage subscription cancellations</p>
        </div>
        <ChevronDown size={16} class={showDangerZone ? 'rotated' : ''} />
      </div>
      
      {#if showDangerZone}
        <div class="danger-expanded">
          <p class="warning-text">
            Cancelling a subscription will result in immediate loss of access to premium features at the end of your current billing period. This action cannot be undone and may result in data loss.
          </p>
          
          <h4 class="subscriptions-title">Active subscriptions available for cancellation:</h4>
          
          <div class="subscription-card">
            <div class="subscription-info">
              <span class="plan-name">Premium</span>
              <span class="plan-price">8700 INR/year</span>
              <span class="plan-renewal">Next: Aug 17th, 2026</span>
            </div>
            <button class="cancel-btn">Cancel</button>
          </div>
          <p class="cancel-text">Cancel subscription</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Billing Information Section -->
  <div class="section">
    <h3 class="section-title">Billing information</h3>
    <div class="billing-card">
      <div class="billing-info">
        <h4 class="billing-name">Shriram</h4>
        <p class="billing-email">name@shriramfarmsolutions.com</p>
      </div>
      <div class="billing-actions">
        <button class="link-btn">Billing history</button>
        <button class="link-btn">Change billing information</button>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="powered-by">powered by MYAR</span>
  </div>
</div>

<style>
  .plans-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }



  .section {
    margin-bottom: 30px;
  }

  .section-title {
    color: #6B6B6B;
    font-size: 13px;
    font-weight: bold;
    margin: 0 0 10px 0;
  }

  .plan-card {
    border: 1px solid #E5E5E5;
    border-radius: 8px;
    padding: 25px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background: white;
  }

  .plan-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .plan-info {
    flex: 1;
  }

  .plan-title {
    font-size: 18px;
    font-weight: bold;
    color: black;
    margin: 0 0 8px 0;
  }

  .plan-dates {
    color: #6B6B6B;
    font-size: 13px;
    margin: 0 0 15px 0;
  }

  .features {
    list-style: disc;
    padding-left: 20px;
    margin: 0;
    color: #6B6B6B;
    font-size: 13px;
  }

  .features li {
    margin-bottom: 4px;
  }

  .upgrade-btn {
    background: #007BFF;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: bold;
    cursor: pointer;
    width: 120px;
    height: 40px;
  }

  .payment-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
  }

  .payment-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6B6B6B;
    font-size: 14px;
  }

  .link-btn {
    background: none;
    border: none;
    color: #007BFF;
    cursor: pointer;
    font-size: 14px;
    text-decoration: underline;
  }

  .danger-zone {
    border: 2px solid #FF4D4D;
    border-radius: 8px;
    padding: 15px;
    transition: background-color 0.2s;
  }

  .danger-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }

  .danger-content:hover {
    background-color: #FFF5F5;
  }

  .danger-title {
    color: #D32F2F;
    font-size: 15px;
    font-weight: bold;
    margin: 0;
  }

  .danger-subtitle {
    color: #666666;
    font-size: 13px;
    margin: 4px 0 0 0;
  }

  .rotated {
    transform: rotate(180deg);
  }

  .danger-expanded {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #E5E5E5;
  }

  .warning-text {
    color: #555555;
    font-size: 13px;
    line-height: 1.4;
    margin: 10px 0 15px 25px;
  }

  .subscriptions-title {
    color: black;
    font-size: 14px;
    font-weight: bold;
    margin: 0 0 15px 0;
  }

  .subscription-card {
    border: 1px solid #E57373;
    border-radius: 8px;
    padding: 12px;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 850px;
  }

  .subscription-info {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .plan-name {
    color: black;
    font-size: 14px;
    font-weight: bold;
  }

  .plan-price {
    color: #6B6B6B;
    font-size: 13px;
  }

  .plan-renewal {
    color: #6B6B6B;
    font-size: 12px;
  }

  .cancel-btn {
    background: #C62828;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    width: 130px;
    height: 35px;
    transition: background-color 0.2s;
  }

  .cancel-btn:hover {
    background: #B71C1C;
  }

  .cancel-text {
    color: #C62828;
    font-size: 13px;
    margin: 10px 0 0 0;
    text-align: center;
  }

  .billing-card {
    border: 1px solid #E5E5E5;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
  }

  .billing-name {
    font-weight: bold;
    color: black;
    font-size: 16px;
    margin: 0 0 4px 0;
  }

  .billing-email {
    color: #6B6B6B;
    font-size: 13px;
    margin: 0;
  }

  .billing-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .footer {
    text-align: right;
    margin-top: 40px;
  }

  .powered-by {
    color: #6B6B6B;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .plans-container {
      padding: 15px;
    }
    
    .plan-content {
      flex-direction: column;
      gap: 20px;
    }
    
    .billing-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }
    
    .billing-actions {
      align-items: flex-start;
    }
  }
</style>