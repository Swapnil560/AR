import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getHost(): string {
	let host = window.location.host;

	if (host.includes("netlify")) {
		return host;
	}

	if (host.includes("localhost")) {
		if (host.includes(".")) {
			host = host.split(".").slice(1).join(".");
		}

		return host;
	}

	if (host.includes(".")) {
		const parts = host.split(".");

		if (parts.length > 2) {
			host = parts.slice(-2).join(".");
		}

		return host;
	}

	return host;
}

export function getVisitUrl(domain: string) {
	const host = getHost();

	const protocol = window.location.protocol;

	const url = `${protocol}//${domain}.${host}`;

	return url;
}

export function isSubdomain() {
	const host = window.location.host;

	if (host.includes("localhost") && host.includes(".")) {
		return true;
	}

	return host.split(".").length > 2;
}

export const goToAdmin = () => {
	const host = getHost();

	const protocol = window.location.protocol;
	const url = `${protocol}//${host}/admin`;

	window.location.href = url;
};
