<script lang="ts">
  import filter from "$lib/assets/Vintage filter preview.png";

  export let title = "Filters";
  export let userName = "Shriram";
  export let filters = [];

  // Default filters if none provided
  const defaultFilters = [
    {
      id: 1,
      name: "Vintage",
      date: "Created 1/15/2024",
      views: "1,250",
      downloads: "850",
      image: filter
    },
    {
      id: 2,
      name: "Black & White",
      date: "Created 2/10/2024",
      views: "980",
      downloads: "720",
      image: filter
    },
    {
      id: 3,
      name: "Sepia",
      date: "Created 3/5/2024",
      views: "650",
      downloads: "480",
      image: filter
    },
    {
      id: 4,
      name: "Sepia",
      date: "Created 3/5/2024",
      views: "650",
      downloads: "480",
      image: filter
    },
    {
      id: 5,
      name: "Sepia",
      date: "Created 3/5/2024",
      views: "650",
      downloads: "480",
      image: filter
    },
    {
      id: 6,
      name: "Sepia",
      date: "Created 3/5/2024",
      views: "650",
      downloads: "480",
      image: filter
    }
  ];

  $: displayFilters = filters.length > 0 ? filters : defaultFilters;
</script>

<div class="filters-page">
  <h2>{title} {userName ? `for ${userName}` : ''}</h2>

  <div class="filters-grid">
    {#each displayFilters as filter}
      <div class="filter-card">
        <img src={filter.image} alt={filter.name} />
        <div class="filter-info">
          <h3>{filter.name}</h3>
          <p class="date">{filter.date}</p>
          <div class="stats">
            <span>👁 {filter.views}</span>
            <span>⬇ {filter.downloads}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .filters-page {
    margin-top: 20px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border-radius: 12px;
    background-color: #fff;
  }

  .filters-page h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: #2d3748;
    font-weight: 600;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .filter-card {
    background: #fff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    cursor: pointer;
  }

  .filter-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }

  .filter-card img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    margin-right: 1rem;
    object-fit: cover;
  }

  .filter-info {
    flex: 1;
  }

  .filter-info h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: #2d3748;
  }

  .filter-info .date {
    font-size: 0.85rem;
    color: #718096;
    margin: 0.2rem 0 0.5rem 0;
  }

  .filter-info .stats {
    display: flex;
    gap: 1.5rem;
    font-size: 0.85rem;
    color: #4a5568;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .filters-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .filter-card {
      padding: 0.75rem;
    }
    
    .filter-card img {
      width: 50px;
      height: 50px;
    }
  }

  @media (max-width: 480px) {
    .filters-page {
      padding: 1rem;
    }
    
    .filters-grid {
      grid-template-columns: 1fr;
    }
  }
</style>