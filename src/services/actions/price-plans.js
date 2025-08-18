import Api from "../Api";

export function getPricePlans(params) {
	const { search, page, sort } = params;

	return Api.get("/price-plans", {
		params: {
			search,
			page,
			sort,
		},
	});
}

export function savePricePlan(pricePlan) {
	return Api.post("/price-plans", {
		body: pricePlan,
	});
}

export function deletePricePlan(id) {
	return Api.put(`/price-plans/${id}`, {
		is_deleted: true,
	});
}
