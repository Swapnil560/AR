import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getHost(): string {
	try {
		let host = window.location.host;
		
		console.log("Original host:", host);

		// Handle localhost (development)
		if (host.includes("localhost")) {
			if (host.includes(".")) {
				// For subdomains like "subdomain.localhost:5173"
				host = host.split(".").slice(1).join(".");
			}
			console.log("Localhost processed host:", host);
			return host;
		}

		// Handle Netlify deployments (keep full domain)
		if (host.includes("netlify")) {
			console.log("Netlify host:", host);
			return host;
		}

		// Handle Vercel deployments (keep full domain)
		if (host.includes("vercel")) {
			console.log("Vercel host:", host);
			return host;
		}

		// Handle other production domains
		if (host.includes(".")) {
			const parts = host.split(".");
			
			// For domains like "subdomain.example.com" -> return "example.com"
			// For domains like "example.com" -> return "example.com" 
			// For domains like "www.example.com" -> return "example.com"
			if (parts.length >= 2) {
				// Always take last 2 parts (domain.tld) for production
				host = parts.slice(-2).join(".");
			}
			
			console.log("Production processed host:", host);
			return host;
		}

		console.log("Fallback host:", host);
		return host;
	} catch (error) {
		console.error("Error in getHost():", error);
		// Fallback to current host without processing
		return window.location.host;
	}
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
