<script>
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  
  let selectedFilter = 'Vintage';
  let lineChart, pieChart, barChart, deviceChart;
  
  const filters = [
    { name: 'Vintage', created: '1/12/2024', uses: 1250, users: 850 },
    { name: 'Black & White', created: '2/15/2024', uses: 890, users: 620 },
    { name: 'Sepia', created: '3/10/2024', uses: 450, users: 320 }
  ];
  
  // Adjustable data
  let deviceData = { mobile: 65, desktop: 25, tablet: 10 };
  let peakUsageData = [20, 10, 30, 60, 80, 90, 100, 70];
  let locationData = [
    { name: 'Mumbai', percentage: 35, color: '#4285F4' },
    { name: 'Delhi', percentage: 28, color: '#AECBFA' },
    { name: 'Bangalore', percentage: 22, color: '#7BAAF7' },
    { name: 'Others', percentage: 15, color: '#E8F0FE' }
  ];
  
  onMount(() => {
    Chart.register(...registerables);
    
    // Line Chart
    const lineCtx = document.getElementById('lineChart');
    lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Usage',
          data: [20, 35, 45, 60, 75, 85, 90],
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
    
    // Pie Chart
    const pieCtx = document.getElementById('pieChart');
    pieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['Facebook', 'WhatsApp', 'Instagram', 'Others'],
        datasets: [{
          data: [35, 40, 15, 10],
          backgroundColor: ['#2196f3', '#4caf50', '#f44336', '#9c27b0']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
    
    // Bar Chart
    const barCtx = document.getElementById('barChart');
    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
        datasets: [{
          data: peakUsageData,
          backgroundColor: '#4285F4',
          borderRadius: 20,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
          x: { beginAtZero: true, max: 100, grid: { display: false } },
          y: { grid: { display: false } }
        }
      }
    });
    
    // Device Chart
    const deviceCtx = document.getElementById('deviceChart');
    deviceChart = new Chart(deviceCtx, {
      type: 'bar',
      data: {
        labels: ['Mobile', 'Desktop', 'Tablet'],
        datasets: [{
          data: [deviceData.mobile, deviceData.desktop, deviceData.tablet],
          backgroundColor: ['#4285F4', '#AECBFA', '#7BAAF7']
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
          x: { beginAtZero: true, max: 100 },
          y: { grid: { display: false } }
        }
      }
    });
  });
</script>

<div class="container">
  <!-- Sidebar -->
  <div class="sidebar">
    <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">Filter Reports</h2>
    
    <!-- Search -->
    <input 
      type="text" 
      placeholder="Search filters..." 
      style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 12px; font-size: 12px;"
    />
    
    <!-- Filter List -->
    {#each filters as filter}
      <div 
        class="filter-card {selectedFilter === filter.name ? 'active' : ''}"
        on:click={() => selectedFilter = filter.name}
      >
        <div class="filter-thumbnail">
          <div class="thumbnail-icon" style="background: {filter.name === 'Vintage' ? 'linear-gradient(135deg, #ff9800, #f57c00)' : filter.name === 'Black & White' ? '#424242' : '#8d6e63'};"></div>
        </div>
        <div class="filter-content">
          <h3 class="filter-title">{filter.name}</h3>
          <p class="filter-date">Created {filter.created}</p>
          <div class="filter-stats">
            <span>📈 {filter.uses}</span>
            <span>👥 {filter.users}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="main">
    <div style="padding: 12px;">
      <!-- Header Card -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h2 style="font-size: 18px; font-weight: bold;">{selectedFilter}</h2>
              <span style="background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 8px; font-size: 10px;">Rank #1</span>
            </div>
            <div style="font-size: 12px; color: #666;">
              <p>Created by: Client Admin • Created: 1/12/2024</p>
              <div style="margin-top: 2px;">
                <span>⭐⭐⭐⭐☆</span>
                <span style="color: #999;">(4.5/5.0)</span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-secondary">Export</button>
            <button class="btn btn-secondary">Edit</button>
            <button class="btn" style="background: #ffebee; color: #c62828;">Delete</button>
          </div>
        </div>
        
        <!-- User Activity Metrics -->
        <div class="metrics">
          <div>
            <div class="metric-value">2,450</div>
            <div class="metric-label">Link Opens</div>
          </div>
          <div>
            <div class="metric-value">1,850</div>
            <div class="metric-label">Camera Access</div>
          </div>
          <div>
            <div class="metric-value">1,250</div>
            <div class="metric-label">Photos Taken</div>
          </div>
          <div>
            <div class="metric-value">680</div>
            <div class="metric-label">Videos Taken</div>
          </div>
          <div>
            <div class="metric-value">420</div>
            <div class="metric-label">Media Shared</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts">
        <!-- Usage Trend -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="font-size: 14px; font-weight: 600;">Usage Trend</h3>
            <select style="padding: 2px 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px;">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <canvas id="lineChart"></canvas>
        </div>

        <!-- Sharing Breakdown -->
        <div class="card">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Sharing Breakdown</h3>
          <canvas id="pieChart"></canvas>
        </div>
      </div>

      <!-- User Activity Analytics -->
      <div class="analytics">
        <!-- Device Type -->
        <div class="small-card">
          <h3 style="font-size: 12px; font-weight: 600; margin-bottom: 6px;">Device Type</h3>
          <canvas id="deviceChart" style="height: 120px !important; max-height: 120px;"></canvas>
          <div style="display: flex; justify-content: space-around; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e0e0e0;">
            <div style="text-align: center;">
              <div style="font-size: 14px; margin-bottom: 2px;">📱</div>
              <div style="font-weight: 600; font-size: 12px; color: #4285F4;">{deviceData.mobile}%</div>
              <div style="font-size: 10px; color: #666;">Mobile</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 14px; margin-bottom: 2px;">💻</div>
              <div style="font-weight: 600; font-size: 12px; color: #AECBFA;">{deviceData.desktop}%</div>
              <div style="font-size: 10px; color: #666;">Desktop</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 14px; margin-bottom: 2px;">📲</div>
              <div style="font-weight: 600; font-size: 12px; color: #7BAAF7;">{deviceData.tablet}%</div>
              <div style="font-size: 10px; color: #666;">Tablet</div>
            </div>
          </div>
        </div>

        <!-- Peak Usage Time -->
        <div class="small-card">
          <h3 style="font-size: 12px; font-weight: 600; margin-bottom: 6px;">Peak Usage Time</h3>
          <canvas id="barChart" style="height: 140px !important; max-height: 140px;"></canvas>
        </div>

        <!-- Top Locations -->
        <div class="small-card">
          <h3 style="font-size: 12px; font-weight: 600; margin-bottom: 6px;">Top Locations</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            {#each locationData as location}
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 8px; height: 8px; background: {location.color}; border-radius: 50%;"></div>
                  <span style="font-size: 11px; color: #666;">{location.name}</span>
                </div>
                <span style="font-size: 11px; font-weight: 600; color: #333;">{location.percentage}%</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Export Section -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 14px; font-weight: 600;">Export & Share</h3>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary">Export PDF</button>
            <button class="btn btn-secondary">Export CSV</button>
            <button class="btn" style="background: none; color: #2196f3;">🔗 Share Link</button>
          </div>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 8px;">powered by MYAR</p>
      </div>
    </div>
  </div>
</div>

<style>
  .container { display: flex; height: 100vh; background: #f8f9fb; }
  .sidebar { width: 200px; background: white; border-right: 1px solid #e0e0e0; padding: 12px; }
  .main { flex: 1; overflow: auto; }
  .card { background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 12px; margin-bottom: 12px; }
  .small-card { background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 8px; margin-bottom: 8px; }
  .metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center; }
  .metric-value { font-size: 18px; font-weight: bold; color: #333; }
  .metric-label { font-size: 12px; color: #666; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .analytics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .filter-card { 
    width: 100%; 
    height: 60px; 
    padding: 8px; 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    border-radius: 8px; 
    border: 1px solid #e5e7eb; 
    background: #ffffff; 
    cursor: pointer; 
    margin-bottom: 8px; 
    transition: all 0.3s ease;
  }
  .filter-card:hover { background: #f9fafb; }
  .filter-card.active { border: 2px solid #3b82f6; box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.1); }
  .filter-thumbnail { width: 32px; height: 32px; }
  .thumbnail-icon { width: 100%; height: 100%; border-radius: 6px; }
  .filter-content { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .filter-title { font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 2px 0; }
  .filter-date { font-size: 11px; color: #6b7280; margin: 0 0 2px 0; }
  .filter-stats { display: flex; gap: 12px; font-size: 11px; color: #111827; }
  .filter-stats span { display: flex; align-items: center; gap: 2px; }
  .btn { padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; font-size: 12px; }
  .btn-primary { background: #2196f3; color: white; }
  .btn-secondary { background: #f5f5f5; color: #333; }
  canvas { height: 200px !important; max-height: 200px; }
  
  @media (max-width: 1200px) {
    .analytics { grid-template-columns: repeat(2, 1fr); }
  }
  
  @media (max-width: 768px) {
    .container { flex-direction: column; }
    .sidebar { width: 100%; height: auto; max-height: 200px; }
    .charts { grid-template-columns: 1fr; }
    .analytics { grid-template-columns: 1fr; }
    .metrics { grid-template-columns: repeat(3, 1fr); }
  }
</style>