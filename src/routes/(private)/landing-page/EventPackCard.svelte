<script>
    export let name;
    export let description;
    export let price;
    export let cta;
    export let delay = 0;
  
    function formatPrice(price) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(price);
    }
  </script>
  
  <div class="card" style="animation-delay: {delay}ms">
    <div class="content">
      <h4 class="title">{name}</h4>
      <p class="subtitle">{description}</p>
  
      <div class="price-block">
        <div class="price">{formatPrice(price)}</div>
        <div class="period">one-time</div>
      </div>
  
      <button class="btn">{cta}</button>
    </div>
  </div>
  
  <style>
    .card {
      padding: 1.5rem;
      border-radius: 12px;
      background: linear-gradient(to bottom right, #ffffff, #f9fafb);
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s forwards;
    }
    .card:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
  
    .content {
      text-align: center;
    }
  
    .title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #111827;
    }
  
    .subtitle {
      font-size: 0.9rem;
      color: #6b7280;
      margin-bottom: 1rem;
    }
  
    .price-block {
      margin-bottom: 1.5rem;
    }
  
    .price {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: #111827;
    }
  
    .period {
      font-size: 0.85rem;
      color: #6b7280;
    }
  
    .btn {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 8px;
      border: 2px solid #6d28d9;
      background: transparent;
      color: #6d28d9;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn:hover {
      background: #6d28d9;
      color: #fff;
    }
  
    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
  