<script>
  import filter from "../../../lib/assets/Vintage filter preview (1).png";

  let clients = [
    {
      id: 1,
      name: "Shriram",
      org: "Shriram",
      img: filter,
      filterCreation: false,
    },
    { id: 2, name: "ASoB", org: "ASoB", img: filter, filterCreation: false },
    { id: 3, name: "DCM", org: "Sepia", img: filter, filterCreation: false },
  ];

  function toggleFilter(clientId) {
    clients = clients.map((client) =>
      client.id === clientId
        ? { ...client, filterCreation: !client.filterCreation }
        : client
    );
  }

  function saveChanges() {
    console.log("Saving changes:", clients);
  }
</script>

<div class="client-page">
  <h2>Clients</h2>

  <div class="client-table-container">
    <table class="client-table">
      <thead>
        <tr>
          <th>NAME</th>
          <th>ORG DETAILS</th>
          <th>Filter Creation</th>
        </tr>
      </thead>
      <tbody>
        {#each clients as client}
          <tr>
            <td class="client-name">
              <img src={client.img} alt={client.name} />
              <span>{client.name}</span>
            </td>
            <td>{client.org}</td>
            <td>
              <input
                type="checkbox"
                checked={client.filterCreation}
                on:change={() => toggleFilter(client.id)}
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="button-group">
    <button class="cancel-btn">Cancel</button>
    <button class="save-btn" on:click={saveChanges}>Save Changes</button>
  </div>
</div>

<style>
  .client-page {
    padding: 2rem;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 1.5rem;
  }

  .client-table-container {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    padding-bottom: 0.75rem;
  }

  td {
    border-top: 1px solid #f0f0f0;
    padding: 0.75rem 0;
    vertical-align: middle;
  }

  .client-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .client-name img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    object-fit: cover;
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #3b82f6;
    cursor: pointer;
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    gap: 1rem;
  }

  .cancel-btn {
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: #111827;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #e5e7eb;
  }

  .save-btn {
    background: #007bff;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .save-btn:hover {
    background: #005fcc;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .client-page {
      padding: 1rem;
    }

    table th,
    table td {
      font-size: 0.8rem;
    }

    .button-group {
      flex-direction: column;
      align-items: flex-end;
    }

    .save-btn,
    .cancel-btn {
      width: 100%;
    }
  }
</style>
