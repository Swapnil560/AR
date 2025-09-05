import Api from "../Api";

export function getPricePlans(params = {}) {
	const { search, page, sort } = params;

	return Api.get("/price-plans", {
		params: {
			search,
			page,
			sort,
		},
		filter: "is_deleted:0",
	});
}

// Get all price plans for super admin (including deleted ones)
export function getAllPricePlans({
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

	return Api.get("/price-plans", params);
}

// Create new price plan
export function savePricePlan(pricePlan) {
	return Api.post("/price-plans", {
		body: pricePlan,
	});
}

// Update existing price plan
export function updatePricePlan(pricePlan) {
	return Api.put("/price-plans", {
		body: pricePlan,
	});
}

// Get a single price plan by ID
export function getPricePlanById({ planId }) {
	return Api.get("/price-plans", {
		search: `id:${planId}`,
	});
}

// Soft delete price plan (set is_deleted to 1)
export function deletePricePlan(id) {
	return Api.put(`/price-plans/${id}`, {
		body: {
			is_deleted: 1,
		},
	});
}
