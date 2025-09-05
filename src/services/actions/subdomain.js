import Api from "../Api";

export async function saveFilter(body) {
	const response = await Api.post("/subdomain", {
		body: body,
	});

	return response;
}
export async function getFilterByName({ name }) {
	const response = await Api.get(`/subdomain`, {
		search: `name:${name}`,
	});
	return response;
}
