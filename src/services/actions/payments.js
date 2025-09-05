import Api from "../Api";

export function getPayments(params) {
	const { search, page, sort, joins } = params;

	return Api.get("/payments", {
		search: search,
		page: page,
		sort: sort,
		joins: joins,
	});
}

export function savePayment(payment) {
	return Api.post("/payments", {
		body: payment,
	});
}
