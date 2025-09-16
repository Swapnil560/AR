<script>
    import { Image, Play, Brain } from "lucide-svelte";
  
    const benefits = [
      {
        icon: Image,
        title: "Static Filters",
        description: "Lightweight, great for logos, dates & slogans",
        gradient: "linear-gradient(135deg, #3b82f6, #2563eb)" /* blue */
      },
      {
        icon: Play,
        title: "Animated Filters",
        description: "Moving graphics, perfect for promotions",
        gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" /* purple */
      },
      {
        icon: Brain,
        title: "AI Filters",
        description: "Face-tracking & interactive, deliver the WOW factor",
        gradient: "linear-gradient(135deg, #ec4899, #e11d48)" /* pink/rose */
      }
    ];
  </script>
  
  <div class="wrapper" id="benefits">
    <h3 class="heading">Filter Benefits</h3>
    <p class="subheading">
      Choose the perfect filter type for your campaign
    </p>
  
    <div class="grid">
      {#each benefits as benefit, index}
        <div class="card" style="animation-delay: {index * 100}ms">
          <div class="icon" style="background: {benefit.gradient}">
            <svelte:component this={benefit.icon} class="icon-svg" />
          </div>
          <h4 class="title">{benefit.title}</h4>
          <p class="description">{benefit.description}</p>
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .wrapper {
      padding-bottom: 2rem;
      text-align: center;
      margin: 0 auto;
      max-width: 1000px;
    }
  
    .heading {
      font-size: 1.875rem; /* ~30px */
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #111827;
    }
  
    .subheading {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 3rem;
    }
  
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      animation: fadeInUp 0.6s forwards;
    }
  
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  
    .card {
      padding: 2rem;
      border-radius: 12px;
      background: linear-gradient(to bottom right, #ffffff, #f9fafb);
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s forwards;
    }
    .card:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
    }
  
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
    }
    .icon-svg {
      width: 32px;
      height: 32px;
      color: var(--primary);
    }
  
    .title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #111827;
    }
  
    .description {
      font-size: 0.95rem;
      color: #6b7280;
    }
  
    /* Animation */
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
  