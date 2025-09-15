import { genSaltSync, hashSync, compareSync } from "bcryptjs";
const saltRounds = 10;

export async function hashPassword(password: string) {
	const salt = genSaltSync(saltRounds);
	const hash = hashSync(password, salt);
	return hash;
}

export async function comparePassword(props: { password: string; hash: string }) {
	const { password, hash } = props;
	const result = compareSync(password, hash);
	return result;
}
