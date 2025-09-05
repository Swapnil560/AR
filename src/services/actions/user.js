import Api from "../Api";

export async function saveUser(body) {
	const response = await Api.post("/users", {
		body: body,
	});

	return response;
}

// Get Users with optional pagination
export const getUsers = ({ search = "", page = "", sort = "" }) => {
	const params = {};
	if (search) params.search = search;
	if (page) params.page = page;
	if (sort) params.sort = sort;

	const response = Api.get("/users", {
		search: params.search,
		page: params.page,
		sort: params.sort,
		filter: "is_deleted:0",
	});
	return response;
};

export const loginUser = async ({ body: { email, password } }) => {
	const response = await Api.post("/auth-users", {
		body: {
			email: email,
			password: password,
		},
		fields: "id,name,email,phone,role,subdomain",
	});
	// console.log(response);
	if (response?.error) throw new Error("Invalid phone or password");
	return response;
};
export async function updateUser(body) {
	const response = await Api.put("/users", { body });
	return response;
}

// Delete user (soft delete by setting is_deleted=1)
export async function deleteUser(userId) {
	const response = await Api.put("/users", {
		body: { id: userId, is_deleted: 1 },
	});
	return response;
}

// Get all admins for super admin management
export const getAdmins = () => {
	const response = Api.get("/users", {
		search: "role:admin",
	});
	return response;
};

// Get all users including admins (for super admin)
export const getAllUsers = ({ search = "", page = "", sort = "" } = {}) => {
	const params = {};
	if (search) params.search = search;
	if (page) params.page = page;
	if (sort) params.sort = sort;

	const response = Api.get("/users", {
		search: params.search,
		page: params.page,
		sort: params.sort,
		filter: "is_deleted:0",
	});
	return response;
};

// Create user account
export async function createUser(body) {
	const userData = { ...body, role: "user" };
	const response = await Api.post("/users", {
		body: userData,
	});
	return response;
}

// Update user role
export async function updateUserRole(userId, newRole) {
	const response = await Api.put("/users", {
		body: { id: userId, role: newRole },
	});
	return response;
}

// Update user by email (useful for subdomain linking)
export async function updateUserByEmail(body) {
	const response = await Api.put("/users", {
		body: body,
	});
	return response;
}
