<script>
  import { Facebook, Instagram, TwitterIcon } from "@lucide/svelte";

  let year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="footer-container">
    <!-- Left: Brand -->
    <div class="footer-brand">
      <div class="logo gradient">myAR.in</div>
      <p class="tagline">
        Bring your ideas to life with AR innovation. From playful overlays to
        intelligent face tracking, we make your brand unforgettable.
      </p>
      <!-- <div class="footer-socials">
        <a href="#" aria-label="Instagram">📸</a>
        <a href="#" aria-label="Facebook">📘</a>
        <a href="#" aria-label="LinkedIn">💼</a>
      </div> -->
    </div>

    <!-- Middle: Quick Links -->
    <div class="footer-links">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="#works">How MyAR Works</a></li>
        <li><a href="#customer">Why Customers Choose MyAR</a></li>
        <li><a href="#journy">Choose Your AR Journey </a></li>
        <li><a href="#benefits">Filter Benefits </a></li>
      </ul>
    </div>

    <!-- Right: Products -->
    <div class="footer-links">
      <h3>Follow Us</h3>
      <ul class="footer-socials">
        <a href="#" aria-label="Instagram"><Facebook /></a>
        <a href="#" aria-label="Facebook"><Instagram /></a>
        <a href="#" aria-label="LinkedIn"><TwitterIcon /></a>
      </ul>
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
  }

  .footer-socials {
    display: flex;
    gap: 0.5rem;
    color: var(--primary);
  }
  .footer-socials a {
    color: #2563eb;
    transition: color 0.3s ease;
  }
  .footer-socials a:hover {
    color: #2563eb;
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
  }
  .footer-links a:hover {
    color: #111827;
  }

  .footer-bottom {
    border-top: 1px solid #e5e7eb;
    margin-top: 2.5rem;
    padding-top: 1rem;
    display: flex;
    justify-content: space-between;
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
  }
  .footer-bottom-links a:hover {
    color: #111827;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: 200;
  }
  .gradient {
    background: linear-gradient(to right, #6366f1, #9333ea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
  }
</style>
