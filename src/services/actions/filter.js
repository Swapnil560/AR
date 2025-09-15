import Api from "../Api";

export async function saveFilter(body) {
	const response = await Api.post("/filters", {
		body: body,
	});

	return response;
}

// Get filters with optional pagination and search
export async function getFilters({ search = "", page = "", sort = "" } = {}) {
	const params = {};
	if (search) params.search = search;

	// Only add pagination params if provided (for future backend implementation)
	if (page) params.page = page;
	if (sort) params.sort = sort;

	const response = await Api.get("/filters", {
		search: params.search,
		page: params.page,
		sort: params.sort,
		filter: "is_deleted:0",
	});
	console.log("Filters response:", response); // Debugging line
	return response;
}

// Update filter
export async function updateFilter(body) {
	const response = await Api.put("/filters", {
		body: body,
	});

	return response;
}

// Get a single filter by ID
export async function getFilterById({ filterId }) {
	const response = await Api.get("/filters", {
		search: `id:${filterId}`,
		filter: "is_deleted:0",
	});
	return response;
}

// Get filters by user ID
export async function getFiltersByUser({ userId }) {
	const response = await Api.get("/filters", {
		search: `user:${userId}`,
		filter: "is_deleted:0",
	});
	return response;
}

// Get all filters for super admin (including deleted ones)
export async function getAllFilters({
	search = "",
	page = "",
	sort = "",
	includeDeleted = false,
} = {}) {
	const params = {};
	if (search) params.search = search;
	if (page) params.page = page;
	if (sort) params.sort = sort;

	// If includeDeleted is false, filter out deleted items, otherwise include all
	if (!includeDeleted) {
		params.filter = "is_deleted:0";
	}

	const response = await Api.get("/filters", params);
	return response;
}

// Delete filter (for super admin)
export async function deleteFilter(filterId) {
	const response = await Api.delete("/filters", {
		body: { id: filterId },
	});
	return response;
}

// Get activity logs/stats for super admin
export async function getFilterStats() {
	const response = await Api.get("/filters", {
		// This might need to be a different endpoint for stats
		fields: "count,user,created_at",
	});
	return response;
}
