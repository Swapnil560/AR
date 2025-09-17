<script>
  import { Facebook, Instagram, TwitterIcon } from "@lucide/svelte";

  let year = new Date().getFullYear();

  // Smooth scroll with header offset
  function scrollToSection(event, id) {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerHeight = 120; // adjust to your actual header height
      const y = el.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }
</script>

<footer class="footer">
  <div class="footer-container">
    <!-- Left: Brand -->
    <div class="footer-brand">
      <a href="/landing-page" style="text-decoration: none;">
        <div class="logo gradient">myAR.in</div>
      </a>
      <p class="tagline">
        Bring your ideas to life with AR innovation. From playful overlays to
        intelligent face tracking, we make your brand unforgettable.
      </p>
    </div>

    <!-- Middle: Quick Links -->
    <div class="footer-links">
      <h3>Quick Links</h3>
      <ul>
        <li>
          <a href="#works" on:click={(e) => scrollToSection(e, "works")}
            >How MyAR Works</a
          >
        </li>
        <li>
          <a href="#customer" on:click={(e) => scrollToSection(e, "customer")}
            >Why Customers Choose MyAR</a
          >
        </li>
        <li>
          <a href="#journy" on:click={(e) => scrollToSection(e, "journy")}
            >Choose Your AR Journey</a
          >
        </li>
        <li>
          <a href="#benefits" on:click={(e) => scrollToSection(e, "benefits")}
            >Filter Benefits</a
          >
        </li>
      </ul>
    </div>

    <!-- Right: Social Links -->
    <div class="footer-links">
      <h3>Follow Us</h3>
      <div class="footer-socials">
        <a href="#" aria-label="Facebook"><Facebook /></a>
        <a href="#" aria-label="Instagram"><Instagram /></a>
        <a href="#" aria-label="Twitter"><TwitterIcon /></a>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p>© {year} myAR.in. All rights reserved.</p>
    <div class="footer-bottom-links">
      <a href="#">Privacy Policy</a>
      <a href="#">Terms of Service</a>
    </div>
  </div>
</footer>

<style>
  .footer {
    background: #fff;
    color: #374151;
    padding: 3rem 1.5rem 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .footer-container {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-brand .brand {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 0.5rem;
  }

  .footer-brand span {
    color: #111827;
  }

  .footer-brand .tagline {
    font-size: 0.95rem;
    color: #4b5563;
    line-height: 1.5;
    margin-bottom: 1.5rem;
    max-width: 300px;
  }

  .footer-socials {
    display: flex;
    gap: 1rem;
  }

  .footer-socials a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f3f4f6;
    transition: all 0.3s ease;
  }

  .footer-socials a:hover {
    /* background: #2563eb; */
    color: white;
    transform: translateY(-2px);
  }

  .footer-links h3 {
    font-weight: 600;
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #111827;
  }

  .footer-links ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .footer-links li {
    margin-bottom: 0.75rem;
  }

  .footer-links a {
    color: #374151;
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.2s ease;
  }

  .footer-links a:hover {
    color: #2563eb;
  }

  .footer-bottom {
    border-top: 1px solid #e5e7eb;
    margin-top: 2.5rem;
    padding-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .footer-bottom-links {
    display: flex;
    gap: 1.5rem;
  }

  .footer-bottom-links a {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .footer-bottom-links a:hover {
    color: #2563eb;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: 200;
    margin-bottom: 0.5rem;
  }

  .gradient {
    background: linear-gradient(to right, #6366f1, #9333ea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
  }

  /* Responsive styles */
  @media (max-width: 900px) {
    .footer-container {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .footer-brand {
      grid-column: 1 / span 2;
    }
  }

  @media (max-width: 600px) {
    .footer {
      padding: 2rem 1rem 1rem;
    }

    .footer-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .footer-brand {
      grid-column: 1;
    }

    .footer-bottom {
      flex-direction: column;
      text-align: center;
    }

    .footer-bottom-links {
      justify-content: center;
    }
  }
</style>
