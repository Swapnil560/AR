// Utility script to hash the superadmin password
const bcrypt = require("bcryptjs");

async function hashAdminPassword() {
	const plainPassword = "Admin@123";
	const saltRounds = 10;

	const salt = bcrypt.genSaltSync(saltRounds);
	const hashedPassword = bcrypt.hashSync(plainPassword, salt);

	console.log("Plain password:", plainPassword);
	console.log("Hashed password:", hashedPassword);
	console.log(
		"\nYou can use this hashed password to update your database manually:"
	);
	console.log(
		`UPDATE users SET password = '${hashedPassword}' WHERE email = 'admin@gmail.com';`
	);

	// Test the hash
	const isValid = bcrypt.compareSync(plainPassword, hashedPassword);
	console.log(
		"\nPassword validation test:",
		isValid ? "✅ SUCCESS" : "❌ FAILED"
	);
}

hashAdminPassword().catch(console.error);
