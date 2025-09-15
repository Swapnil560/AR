<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import {
		getFilters,
		updateFilter,
	} from "../../../services/actions/filter.js";
	import { RazorpayService } from "../../../lib/razorpay.js";
	import QRCode from "qrcode";
	import { getPricePlans } from "../../../services/actions/price-plans.js";
	import { formatDate } from "date-fns";
	import {
		getPayments,
		savePayment,
	} from "../../../services/actions/payments.js";
	import {
		BadgeIndianRupee,
		CloudUpload,
		Copy,
		Pencil,
		Plus,
		Power,
		Trash,
	} from "@lucide/svelte";
	import Logo from "../../../components/logo.svelte";
	import { getHost } from "$lib/utils";

	let user = $state(null);
	let filters = $state([]);
	let loading = $state(true);
	let error = $state("");
	let editingFilter = $state(null);
	let editForm = $state({
		name: "",
		description: "",
		ai_need: false,
	});

	// Modal state
	let showModal = $state(false);
	let selectedFilter = $state(null);
	let copySuccess = $state(false);

	// Pricing plans state

	let showPricingPlans = $state(false);
	let currentPlan = $state(); // This would typically come from user data
	let isProcessingPayment = $state(false);

	let pricingPlans = $state([]);
	let displayRate = $state("monthly");

	function togglePricingPlans() {
		showPricingPlans = !showPricingPlans;
	}

	async function savePlanToStorage({
		plan,
		paymentData = {},
		isFree = false,
	}) {
		if (user?.id) {
			// localStorage.setItem(`userPlan_${user.id}`, planId);

			const renewalAt =
				displayRate === "monthly"
					? formatDate(
							new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
							"yyyy-MM-dd"
						)
					: formatDate(
							new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
							"yyyy-MM-dd"
						);

			const body = {
				user: user.id,
				plan: plan.id,
				payment_details: paymentData,
				is_success: isFree ? true : paymentData?.isSuccess || false,
				price:
					displayRate === "monthly"
						? plan.monthly_price
						: plan.yearly_price,
				renewal_at: isFree ? null : renewalAt,
			};

			const res = await savePayment(body);

			if (res.err) {
				console.error("Error saving payment:", res.err);
				return;
			}

			alert("Plan saved successfully!");
		}
	}

	async function selectPlan(planId) {
		const selectedPlan = pricingPlans.find((p) => p.id === planId);

		if (!selectedPlan) {
			console.error("Plan not found");
			return;
		}

		console.log("selectedPlan", selectedPlan);

		if (selectedPlan.monthly_price === "0") {
			// Handle free plan - no payment needed
			currentPlan = planId;
			savePlanToStorage({ plan: selectedPlan, isFree: true });
			alert("Downgraded to Free plan");
			return;
		}

		if (currentPlan === planId) {
			alert("You are already on this plan");
			return;
		}

		if (!user) {
			alert("Please login to continue");
			goto("/login");
			return;
		}

		// if (selectedPlan.priceAmount === 0) {
		//   // Free plan
		//   currentPlan = planId;
		//   savePlanToStorage(planId);
		//   alert('Plan selected successfully!');
		//   return;
		// }

		// For paid plans, process payment
		await processPayment(selectedPlan);
	}

	async function processPayment(plan) {
		if (isProcessingPayment) return;

		isProcessingPayment = true;

		try {
			const basePrice = Number(
				displayRate === "monthly"
					? plan.monthly_price
					: plan.yearly_price
			);
			const tax = 0; // No tax for now
			const total = basePrice + tax;

			const paymentData = {
				orderId: Date.now(), // Generate a unique order ID
				amount: total,
				currency: "INR",
				customerName: user.name || "Customer",
				customerEmail: user.email || "",
				customerPhone: user.phone || "",
				items: [
					{
						id: 1,
						name: `${plan.name} Plan`,
						description: `${plan.name} plan subscription - ${plan.features}`,
						price: basePrice,
						quantity: 1,
					},
				],
				subtotal: basePrice,
				tax: tax,
				total: total,
			};

			// Success callback to update plan after successful payment
			const onPaymentSuccess = async (data) => {
				console.log("Payment data-->>", data);
				currentPlan = plan.id;
				savePlanToStorage({
					plan: plan,
					paymentData: data,
					isFree: false,
				});
				console.log("Plan updated to:", plan.id);
			};

			// Create Razorpay service instance with success callback
			const razorpayService = new RazorpayService(
				paymentData,
				onPaymentSuccess
			);

			// Create order and initiate payment
			await razorpayService.createOrder();
		} catch (error) {
			console.error("Payment error:", error);
			alert("Payment failed. Please try again.");
		} finally {
			isProcessingPayment = false;
		}
	}

	function navigateToUpload() {
		console.log("Upload button clicked! User:", user);

		// Check if user is logged in
		if (!user) {
			console.log("No user found, redirecting to login");
			alert("Please login first");
			goto("/login");
			return;
		}

		try {
			console.log("Attempting to navigate to /admin");
			goto("/admin");
			console.log("Navigation initiated");
		} catch (error) {
			console.error("Navigation error:", error);
			alert("Navigation failed. Please try refreshing the page.");
		}
	}

	function openModal(filter) {
		selectedFilter = filter;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedFilter = null;
		editingFilter = null;
		editForm = {
			name: "",
			description: "",
			ai_need: false,
		};
	}

	onMount(async () => {
		// Check for auth parameter in URL (from subdomain redirect)
		const urlParams = new URLSearchParams(window.location.search);
		const authParam = urlParams.get("auth");

		if (authParam) {
			try {
				// Decode user data from URL parameter
				const userData = JSON.parse(atob(authParam));
				console.log("User data from URL:", userData);

				// Store in localStorage for the current domain/subdomain
				localStorage.setItem("user", JSON.stringify(userData));

				// Clean up URL by removing auth parameter
				const newUrl = window.location.pathname;
				window.history.replaceState({}, document.title, newUrl);

				user = userData;
			} catch (error) {
				console.error("Error parsing auth parameter:", error);
				goto("/login");
				return;
			}
		} else {
			// Check if user is logged in
			const userData = localStorage.getItem("user");
			if (!userData) {
				goto("/login");
				return;
			}
			user = JSON.parse(userData);
		}

		const pricePlansRes = await getPricePlans({});

		if (!pricePlansRes.err) {
			const plans = pricePlansRes.result || [];
			pricingPlans = plans;
		}
		const usersPlanRes = await getPayments({
			search: `user:${user.id}`,
			sort: "-created_at",
		});

		if (usersPlanRes.err) {
			console.error("Error fetching user plan:", usersPlanRes.err);
		} else {
			if (usersPlanRes.count < 1) {
				console.warn("No active plan found for user");
				currentPlan = pricingPlans.find(
					(p) => p.monthly_price === "0"
				).id;
			} else {
				currentPlan = usersPlanRes.result[0].plan;
			}
		}
		// Redirect based on user role
		if (user.role === "super_admin") {
			goto("/superadmin");
			return;
		}
		// Remove the admin redirect - allow admins to access dashboard too
		// } else if (user.role === 'admin') {
		//   goto('/admin');
		//   return;
		// }

		await loadUserFilters();
	});

	async function loadUserFilters() {
		try {
			loading = true;
			console.log("Loading filters for user:", user);

			// Try multiple search methods
			let response;
			let filters_found = [];

			// Method 1: Search by user field
			try {
				console.log("Trying search: user:" + user.id);
				response = await getFilters({ search: `user:${user.id}` });
				console.log("Method 1 response:", response);

				if (!response.err) {
					filters_found = response.result || [];
					console.log("Method 1 found filters:", filters_found);
				}
			} catch (e) {
				console.log("Method 1 failed:", e);
			}

			if (response && response.err) {
				error = "Failed to load filters";
				console.error("API Error:", response.err);
				return;
			}

			filters = filters_found;
			console.log("Final filters to display:", filters);

			// Generate QR codes for each filter
			for (let filter of filters) {
				// Extract filename from filter_url and remove .png extension
				const filename = filter.filter_url
					.split("/")
					.pop()
					.replace(".png", "");
				// Generate shortened/obfuscated URL without .png and without user= prefix
				const filterLink = `${window.location.origin}/filter/ar?filter=${filename}&${filter.user}`;
				filter.qr_code = await QRCode.toDataURL(filterLink);
				filter.share_link = filterLink;
			}
		} catch (err) {
			error = "Failed to load filters";
			console.error("Error loading filters:", err);
		} finally {
			loading = false;
		}
	}

	function logout() {
		localStorage.removeItem("user");

		// Check if we're on a subdomain
		const currentHost = window.location.host;
		const mainHost = getHost();

		if (currentHost !== mainHost) {
			// We're on a subdomain, redirect to main domain with logout parameter
			const protocol = window.location.protocol;
			const logoutUrl = `${protocol}//${mainHost}/login?logout=true`;
			console.log("Redirecting to main domain for logout:", logoutUrl);
			window.location.href = logoutUrl;
		} else {
			// We're on main domain, just go to login
			goto("/login");
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
		copySuccess = true;
		// Reset the copy success state after 2 seconds
		setTimeout(() => {
			copySuccess = false;
		}, 2000);
	}

	function downloadQR(qrCodeUrl, filterName) {
		const link = document.createElement("a");
		link.download = `${filterName}-qr-code.png`;
		link.href = qrCodeUrl;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function startEdit(filter) {
		editingFilter = filter.id;
		editForm = {
			name: filter.name || "",
			description: filter.description || "",
			ai_need: filter.ai_need || false,
		};
	}

	function cancelEdit() {
		editingFilter = null;
		editForm = {
			name: "",
			description: "",
			ai_need: false,
		};
	}

	async function saveEdit(filterId) {
		try {
			const response = await updateFilter({
				id: filterId,
				name: editForm.name,
				description: editForm.description,
				ai_need: editForm.ai_need,
			});

			if (!response.err) {
				// Update the filter in the local array
				const filterIndex = filters.findIndex((f) => f.id === filterId);
				if (filterIndex !== -1) {
					filters[filterIndex] = {
						...filters[filterIndex],
						name: editForm.name,
						description: editForm.description,
						ai_need: editForm.ai_need,
					};
					filters = [...filters]; // Trigger reactivity
				}
				cancelEdit();
			} else {
				console.error("Error updating filter:", response.err);
				error = "Failed to update filter";
			}
		} catch (err) {
			console.error("Error updating filter:", err);
			error = "Failed to update filter";
		}
	}

	async function deleteFilter(filterId) {
		if (!confirm("Are you sure you want to delete this filter?")) {
			return;
		}

		try {
			const response = await updateFilter({
				id: filterId,
				is_deleted: 1,
			});

			if (!response.err) {
				// Remove the filter from the local array
				filters = filters.filter((f) => f.id !== filterId);
				// Close the modal after successful deletion
				closeModal();
			} else {
				console.error("Error deleting filter:", response.err);
				error = "Failed to delete filter";
			}
		} catch (err) {
			console.error("Error deleting filter:", err);
			error = "Failed to delete filter";
		}
	}
</script>

<svelte:head>
	<title>MyAR Dashboard</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</svelte:head>

<div class="app-container">
	<header class="header">
		<div class="header-content">
			<div class="logo-icon">
				<Logo />

				<h1 class="logo">MyAR</h1>
			</div>
			<div class="header-actions">
				<span class="welcome-text">Welcome- {user?.name || "User"}</span
				>
				<button class="logout-btn" on:click={logout}>
					<Power />
				</button>
			</div>
		</div>
	</header>

	<main class="main-content">
		<div class="dashboard-header">
			<h2 class="dashboard-title">My Filters</h2>
			<div class="header-actions-group">
				<div class="action-buttons-group">
					<button
						class="action-btn plans-btn"
						on:click={togglePricingPlans}
					>
						<span class="btn-icon"><BadgeIndianRupee /></span>
						<span class="btn-text">Plans</span>
					</button>
					<button
						type="button"
						class="action-btn upload-btn"
						on:click={() => navigateToUpload()}
					>
						<span class="btn-icon"><Plus /></span>
						<span class="btn-text">Upload Filter</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Pricing Plans Section -->
		{#if showPricingPlans}
			<div class="pricing-section">
				<div class="pricing-header">
					<h3 class="pricing-title">Choose Your Plan</h3>
					<button class="close-btn" on:click={togglePricingPlans}
						>✕</button
					>
				</div>
				<div>
					<div class="billing-switch">
						<span class="switch-label">Billing:</span>
						<label
							class="switch-option {displayRate === 'monthly'
								? 'active'
								: ''}"
						>
							<input
								type="radio"
								bind:group={displayRate}
								value="monthly"
							/>
							Monthly
						</label>
						<label
							class="switch-option {displayRate === 'yearly'
								? 'active'
								: ''}"
						>
							<input
								type="radio"
								bind:group={displayRate}
								value="yearly"
							/>
							Yearly
						</label>
					</div>
				</div>
				<div class="pricing-grid">
					{#each pricingPlans as plan}
						<div
							class="pricing-card {plan.popular
								? 'popular'
								: ''} {currentPlan == plan.id ? 'current' : ''}"
						>
							{#if plan.popular}
								<div class="popular-badge">Most Popular</div>
							{/if}
							{#if currentPlan === plan.id}
								<div class="current-badge">Current Plan</div>
							{/if}

							<div class="plan-header">
								<h4 class="plan-name">{plan.name}</h4>
								<div class="plan-price">
									<span class="price"
										>₹{displayRate === "monthly"
											? plan.monthly_price
											: plan.yearly_price}</span
									>
									{#if plan.period !== "forever"}
										<span class="period"
											>/{displayRate === "monthly"
												? "mo"
												: "yr"}</span
										>
									{/if}
								</div>
							</div>

							<div class="plan-features">
								<div class="feature-item">
									<span class="feature-label">Filters:</span>
									<span class="feature-value"
										>{plan.filters}</span
									>
								</div>
								<div class="feature-item">
									<span class="feature-label">Storage:</span>
									<span class="feature-value"
										>{plan.storage}</span
									>
								</div>
								<div class="feature-item">
									<span class="feature-label">Features:</span>
									<span class="feature-value"
										>{plan.features}</span
									>
								</div>
							</div>

							<div class="plan-action">
								{#if currentPlan === plan.id}
									<button class="plan-btn current" disabled
										>Current Plan</button
									>
								{:else}
									<button
										class="plan-btn"
										on:click={() => selectPlan(plan.id)}
										disabled={isProcessingPayment ||
											currentPlan == plan.id}
									>
										{#if isProcessingPayment}
											<div class="payment-loading">
												<div class="spinner"></div>
												Processing...
											</div>
										{:else if currentPlan == plan.id}
											Subscribed
										{:else}
											{plan.monthly_price == 0
												? "Downgrade"
												: "Upgrade"} to {plan.name}
										{/if}
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Filters Content -->
			{#if loading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<p class="loading-text">Loading your filters...</p>
				</div>
			{:else if error}
				<div class="error-container">
					<span class="error-icon">⚠️</span>
					<p class="error-text">{error}</p>
					<button class="retry-btn" on:click={loadUserFilters}
						>Try Again</button
					>
				</div>
			{:else if filters.length === 0}
				<div class="empty-state">
					<div class="empty-icon">
						<svg
							width="88"
							height="88"
							viewBox="0 0 88 88"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M17.875 5.5H6.875C6.51033 5.5 6.16059 5.64487 5.90273 5.90273C5.64487 6.16059 5.5 6.51033 5.5 6.875V17.875C5.5 18.2397 5.64487 18.5894 5.90273 18.8473C6.16059 19.1051 6.51033 19.25 6.875 19.25H12.375C12.7397 19.25 13.0894 19.1051 13.3473 18.8473C13.6051 18.5894 13.75 18.2397 13.75 17.875V13.75H17.875C18.2397 13.75 18.5894 13.6051 18.8473 13.3473C19.1051 13.0894 19.25 12.7397 19.25 12.375V6.875C19.25 6.51033 19.1051 6.16059 18.8473 5.90273C18.5894 5.64487 18.2397 5.5 17.875 5.5ZM16.5 11H12.375C12.0103 11 11.6606 11.1449 11.4027 11.4027C11.1449 11.6606 11 12.0103 11 12.375V16.5H8.25V8.25H16.5V11ZM81.125 5.5H70.125C69.9444 5.49995 69.7656 5.53549 69.5988 5.60457C69.4319 5.67365 69.2803 5.77493 69.1526 5.90262C69.0249 6.03031 68.9237 6.18191 68.8546 6.34875C68.7855 6.5156 68.75 6.69442 68.75 6.875V12.375C68.75 12.5556 68.7855 12.7344 68.8546 12.9012C68.9237 13.0681 69.0249 13.2197 69.1526 13.3474C69.2803 13.4751 69.4319 13.5763 69.5988 13.6454C69.7656 13.7145 69.9444 13.75 70.125 13.75H74.25V17.875C74.25 18.0556 74.2855 18.2344 74.3546 18.4012C74.4237 18.5681 74.5249 18.7197 74.6526 18.8474C74.7803 18.9751 74.9319 19.0763 75.0988 19.1454C75.2656 19.2145 75.4444 19.25 75.625 19.25H81.125C81.3056 19.25 81.4844 19.2145 81.6512 19.1454C81.8181 19.0763 81.9697 18.9751 82.0974 18.8474C82.2251 18.7197 82.3263 18.5681 82.3954 18.4012C82.4645 18.2344 82.5 18.0556 82.5 17.875V6.875C82.5 6.69442 82.4645 6.5156 82.3954 6.34875C82.3263 6.18191 82.2251 6.03031 82.0974 5.90262C81.9697 5.77493 81.8181 5.67365 81.6512 5.60457C81.4844 5.53549 81.3056 5.49995 81.125 5.5ZM79.75 16.5H77V12.375C77 12.1944 76.9645 12.0156 76.8954 11.8488C76.8263 11.6819 76.7251 11.5303 76.5974 11.4026C76.4697 11.2749 76.3181 11.1737 76.1512 11.1046C75.9844 11.0355 75.8056 11 75.625 11H71.5V8.25H79.75V16.5ZM17.875 74.25H13.75V70.125C13.75 69.7603 13.6051 69.4106 13.3473 69.1527C13.0894 68.8949 12.7397 68.75 12.375 68.75H6.875C6.51033 68.75 6.16059 68.8949 5.90273 69.1527C5.64487 69.4106 5.5 69.7603 5.5 70.125V81.125C5.5 81.4897 5.64487 81.8394 5.90273 82.0973C6.16059 82.3551 6.51033 82.5 6.875 82.5H17.875C18.2397 82.5 18.5894 82.3551 18.8473 82.0973C19.1051 81.8394 19.25 81.4897 19.25 81.125V75.625C19.25 75.2603 19.1051 74.9106 18.8473 74.6527C18.5894 74.3949 18.2397 74.25 17.875 74.25ZM16.5 79.75H8.25V71.5H11V75.625C11 75.9897 11.1449 76.3394 11.4027 76.5973C11.6606 76.8551 12.0103 77 12.375 77H16.5V79.75ZM81.125 68.75H75.625C75.4444 68.75 75.2656 68.7855 75.0988 68.8546C74.9319 68.9237 74.7803 69.0249 74.6526 69.1526C74.5249 69.2803 74.4237 69.4319 74.3546 69.5988C74.2855 69.7656 74.25 69.9444 74.25 70.125V74.25H70.125C69.9444 74.25 69.7656 74.2855 69.5988 74.3546C69.4319 74.4237 69.2803 74.5249 69.1526 74.6526C69.0249 74.7803 68.9237 74.9319 68.8546 75.0988C68.7855 75.2656 68.75 75.4444 68.75 75.625V81.125C68.75 81.3056 68.7855 81.4844 68.8546 81.6512C68.9237 81.8181 69.0249 81.9697 69.1526 82.0974C69.2803 82.2251 69.4319 82.3263 69.5988 82.3954C69.7656 82.4645 69.9444 82.5 70.125 82.5H81.125C81.3056 82.5 81.4844 82.4645 81.6512 82.3954C81.8181 82.3263 81.9697 82.2251 82.0974 82.0974C82.2251 81.9697 82.3263 81.8181 82.3954 81.6512C82.4645 81.4844 82.5 81.3056 82.5 81.125V70.125C82.5 69.9444 82.4645 69.7656 82.3954 69.5988C82.3263 69.4319 82.2251 69.2803 82.0974 69.1526C81.9697 69.0249 81.8181 68.9237 81.6512 68.8546C81.4844 68.7855 81.3056 68.75 81.125 68.75ZM79.75 79.75H71.5V77H75.625C75.8056 77 75.9844 76.9645 76.1512 76.8954C76.3181 76.8263 76.4697 76.7251 76.5974 76.5974C76.7251 76.4697 76.8263 76.3181 76.8954 76.1512C76.9645 75.9844 77 75.8056 77 75.625V71.5H79.75V79.75ZM41.8885 40.2779C41.7608 40.1502 41.6093 40.0489 41.4425 39.9797C41.2757 39.9106 41.0969 39.875 40.9163 39.875C40.7358 39.875 40.557 39.9106 40.3902 39.9797C40.2234 40.0489 40.0718 40.1502 39.9442 40.2779L20.4988 59.7232C20.3711 59.8508 20.2698 60.0024 20.2006 60.1692C20.1315 60.336 20.0959 60.5148 20.0959 60.6954C20.0959 60.8759 20.1315 61.0547 20.2006 61.2215C20.2698 61.3883 20.3711 61.5399 20.4988 61.6675L26.3325 67.5012C26.4601 67.6289 26.6117 67.7302 26.7785 67.7994C26.9453 67.8685 27.1241 67.9041 27.3046 67.9041C27.4852 67.9041 27.664 67.8685 27.8308 67.7994C27.9976 67.7302 28.1491 67.6289 28.2768 67.5012L47.7221 48.0559C47.8498 47.9282 47.9511 47.7767 48.0203 47.6098C48.0894 47.443 48.125 47.2642 48.125 47.0837C48.125 46.9031 48.0894 46.7243 48.0203 46.5575C47.9511 46.3907 47.8498 46.2392 47.7221 46.1115L41.8885 40.2779ZM27.3046 64.5847L23.4153 60.6954L35.0826 49.028L38.972 52.9174L27.3046 64.5847ZM40.9163 50.973L37.027 47.0837L40.9163 43.1943L44.8057 47.0837L40.9163 50.973ZM66.6593 38.6685L63.4581 36.9175L61.7059 33.715C61.5765 33.5125 61.3983 33.3458 61.1875 33.2303C60.9768 33.1149 60.7404 33.0543 60.5001 33.0543C60.2598 33.0543 60.0233 33.1149 59.8126 33.2303C59.6019 33.3458 59.4236 33.5125 59.2942 33.715L57.5419 36.9175L54.3408 38.6685C54.1242 38.7868 53.9434 38.9613 53.8175 39.1736C53.6915 39.3859 53.6251 39.6281 53.6251 39.875C53.6251 40.1218 53.6915 40.3641 53.8175 40.5764C53.9434 40.7887 54.1242 40.9631 54.3408 41.0815L57.542 42.8324L59.2941 46.035C59.4124 46.2514 59.5868 46.432 59.799 46.5578C60.0112 46.6836 60.2533 46.75 60.4999 46.75C60.7466 46.75 60.9887 46.6836 61.2009 46.5578C61.413 46.432 61.5874 46.2514 61.7058 46.035L63.4581 42.8325L66.6592 41.0815C66.8759 40.9632 67.0566 40.7887 67.1826 40.5764C67.3085 40.3641 67.3749 40.1219 67.3749 39.875C67.3749 39.6282 67.3085 39.3859 67.1826 39.1736C67.0566 38.9613 66.8759 38.7868 66.6593 38.6685ZM61.785 40.6129C61.5544 40.7391 61.3648 40.9287 61.2385 41.1594L60.5 42.5089L59.7615 41.1594C59.6352 40.9287 59.4456 40.7391 59.215 40.6129L57.8655 39.875L59.215 39.1371C59.4456 39.0109 59.6353 38.8213 59.7615 38.5906L60.5 37.2411L61.2385 38.5906C61.3648 38.8213 61.5544 39.0109 61.785 39.1371L63.1345 39.875L61.785 40.6129ZM55 27.5C55.0001 27.2531 54.9337 27.0108 54.8078 26.7985C54.6818 26.5862 54.501 26.4118 54.2843 26.2935L51.0831 24.5425L49.3309 21.34C49.2015 21.1375 49.0233 20.9708 48.8125 20.8553C48.6018 20.7399 48.3654 20.6793 48.1251 20.6793C47.8848 20.6793 47.6483 20.7399 47.4376 20.8553C47.2269 20.9708 47.0486 21.1375 46.9192 21.34L45.1676 24.5425L41.965 26.2935C41.7486 26.412 41.568 26.5865 41.4422 26.7988C41.3163 27.011 41.25 27.2533 41.25 27.5C41.25 27.7467 41.3163 27.989 41.4422 28.2012C41.568 28.4135 41.7486 28.588 41.965 28.7065L45.1675 30.4575L46.9191 33.66C47.0374 33.8764 47.2118 34.057 47.424 34.1828C47.6362 34.3086 47.8783 34.375 48.1249 34.375C48.3716 34.375 48.6137 34.3086 48.8259 34.1828C49.038 34.057 49.2124 33.8764 49.3308 33.66L51.0831 30.4575L54.2842 28.7065C54.501 28.5883 54.6818 28.4138 54.8078 28.2015C54.9337 27.9892 55.0001 27.7469 55 27.5ZM49.41 28.2379C49.1794 28.3641 48.9898 28.5537 48.8635 28.7844L48.125 30.1339L47.3865 28.7844C47.2602 28.5537 47.0706 28.3641 46.84 28.2379L45.4905 27.5L46.84 26.7621C47.0706 26.6359 47.2603 26.4463 47.3865 26.2156L48.125 24.8661L48.8635 26.2156C48.9898 26.4463 49.1794 26.6359 49.41 26.7621L50.7595 27.5L49.41 28.2379Z"
								fill="black"
							/>
						</svg>
					</div>
					<h3 class="empty-title">No AR Filters Yet</h3>
					<p class="empty-text">
						Start creating amazing AR experiences by uploading your
						first filter.
					</p>
					<button
						type="button"
						class="upload-btn primary"
						on:click={() => navigateToUpload()}
					>
						<span class="btn-icon"><CloudUpload /></span>
						Upload Your First Filter
					</button>
				</div>
			{:else}
				<div class="filters-grid">
					{#each filters as filter (filter.id)}
						<div
							class="filter-card"
							on:click={() => openModal(filter)}
						>
							<div class="filter-image">
								<img
									src={filter.filter_url}
									alt={filter.name || "AR Filter"}
								/>
								<div class="filter-type-badge">
									{filter.filter_url.includes(".gif")
										? "GIF"
										: "PNG"}
								</div>
							</div>

							<div class="filter-content">
								<h3 class="filter-name">
									{filter.name || "Untitled Filter"}
								</h3>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</main>
</div>

<!-- Modal -->
{#if showModal && selectedFilter}
	<div class="modal-overlay" on:click={closeModal}>
		<div class="modal-content" on:click={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3 class="modal-title">
					{selectedFilter.name || "Untitled Filter"}
				</h3>
				<button class="modal-close-btn" on:click={closeModal}>✕</button>
			</div>

			<div class="modal-body">
				{#if editingFilter === selectedFilter.id}
					<!-- Edit Mode -->
					<div class="edit-form">
						<div class="form-group">
							<label class="input-label">Filter Name:</label>
							<input
								type="text"
								bind:value={editForm.name}
								class="edit-input"
								placeholder="Enter filter name"
							/>
						</div>

						<div class="form-group">
							<label class="input-label">Description:</label>
							<textarea
								bind:value={editForm.description}
								class="edit-textarea"
								placeholder="Enter filter description"
								rows="3"
							></textarea>
						</div>

						<div class="form-group">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={editForm.ai_need}
									class="edit-checkbox"
								/>
								AI Enhanced
							</label>
						</div>

						<div class="edit-actions">
							<button
								class="save-btn"
								on:click={() => saveEdit(selectedFilter.id)}
							>
								✅ Save
							</button>
							<button class="cancel-btn" on:click={cancelEdit}>
								❌ Cancel
							</button>
						</div>
					</div>
				{:else}
					<!-- View Mode -->
					<div class="modal-filter-details">
						<div class="modal-filter-image">
							<img
								src={selectedFilter.filter_url}
								alt={selectedFilter.name || "AR Filter"}
							/>
							<div class="filter-type-badge">
								{selectedFilter.filter_url.includes(".gif")
									? "GIF"
									: "PNG"}
							</div>
						</div>

						<div class="modal-actions-header">
							<button
								class="edit-btn"
								on:click={() => startEdit(selectedFilter)}
								title="Edit filter"
							>
								<Pencil /> Edit
							</button>
							<button
								class="delete-btn"
								on:click={() => deleteFilter(selectedFilter.id)}
								title="Delete filter"
							>
								<Trash /> Delete
							</button>
						</div>

						<p class="filter-description">
							{selectedFilter.description ||
								"No description provided"}
						</p>

						<div class="filter-meta">
							<div class="meta-item">
								<span class="meta-label">AI Enhanced:</span>
								<span
									class="meta-value {selectedFilter.ai_need
										? 'yes'
										: 'no'}"
								>
									{selectedFilter.ai_need ? "Yes" : "No"}
								</span>
							</div>
							<div class="meta-item">
								<span class="meta-label">Created:</span>
								<span class="meta-value">
									{new Date(
										selectedFilter.created_at
									).toLocaleDateString()}
								</span>
							</div>
						</div>

						<div class="filter-actions">
							<div class="share-section">
								<label class="input-label">Share Link:</label>
								<div class="input-group">
									<input
										type="text"
										value={selectedFilter.share_link}
										readonly
										class="share-input"
									/>
									<button
										class="copy-btn"
										class:copied={copySuccess}
										on:click={() =>
											copyToClipboard(
												selectedFilter.share_link
											)}
										title="Copy link"
									>
										{#if copySuccess}
											<span class="copy-success"
												>✓ Copied!</span
											>
										{:else}
											<Copy />
										{/if}
									</button>
								</div>
							</div>

							<div class="qr-section">
								<label class="input-label">QR Code:</label>
								<div class="qr-container">
									<img
										src={selectedFilter.qr_code}
										alt="QR Code"
										class="qr-image"
									/>
									<button
										class="download-qr-btn"
										on:click={() =>
											downloadQR(
												selectedFilter.qr_code,
												selectedFilter.name
											)}
										title="Download QR Code"
									>
										📥 Download QR
									</button>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		min-height: 100vh;
	}

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background: white;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border-bottom: 1px solid #e2e8f0;
		padding: 1rem 0;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		color: #2d3748;
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-icon {
		font-size: 2.5rem;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.welcome-text {
		color: #4a5568;
		font-weight: 500;
		margin-right: 3rem;
	}

	.logout-btn {
		background: linear-gradient(135deg, #ff6b6b, #ee5a24);
		color: white;
		border: none;
		border-radius: 999px;
		padding: 0.8rem 0.8rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
	}

	.logout-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
	}

	.logout-icon {
		font-size: 1.2rem;
	}

	.main-content {
		flex: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
		width: 100%;
		box-sizing: border-box;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-actions-group {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.action-buttons-group {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 16px;
		padding: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.action-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.75rem 1.25rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
		text-decoration: none;
		font-size: 0.9rem;
		position: relative;
		overflow: hidden;
	}

	.action-btn::before {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent
		);
		transition: left 0.5s;
	}

	.action-btn:hover::before {
		left: 100%;
	}

	.action-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
	}

	.action-btn.plans-btn {
		background: #0511f3;
		box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
	}

	.action-btn.plans-btn:hover {
		box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
	}

	.action-btn.upload-btn {
		background: #1a8ef1;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
	}

	.action-btn.upload-btn:hover {
		box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
	}

	.action-btn.logout-btn {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
	}

	.action-btn.logout-btn:hover {
		box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
	}

	.btn-icon {
		font-size: 1.1rem;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
	}

	.btn-text {
		font-weight: 600;
		font-size: 0.9rem;
	}

	/* Pricing Plans Styles */
	.pricing-section {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		border-radius: 20px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
	}

	.pricing-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.pricing-title {
		font-size: 1.8rem;
		font-weight: 700;
		color: #2d3748;
		margin: 0;
	}

	.close-btn {
		background: rgba(255, 255, 255, 0.8);
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		cursor: pointer;
		font-size: 1.2rem;
		color: #666;
		transition: all 0.3s ease;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 1);
		transform: scale(1.1);
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.pricing-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		position: relative;
		border: 2px solid transparent;
	}

	.pricing-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
	}

	.pricing-card.popular {
		border-color: #ffd700;
		transform: scale(1.05);
	}

	.pricing-card.current {
		border-color: #48bb78;
		background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
	}

	.popular-badge {
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%);
		color: #744210;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
	}

	.current-badge {
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);
	}

	.plan-header {
		text-align: center;
		margin-bottom: 1.5rem;
		padding-top: 1rem;
	}

	.plan-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d3748;
		margin: 0 0 0.5rem 0;
	}

	.plan-price {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 0.25rem;
	}

	.price {
		font-size: 2.5rem;
		font-weight: 800;
		color: #4a5568;
	}

	.period {
		font-size: 1rem;
		color: #718096;
		font-weight: 500;
	}

	.plan-features {
		margin-bottom: 1.5rem;
	}

	.feature-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e2e8f0;
	}

	.feature-item:last-child {
		border-bottom: none;
	}

	.feature-label {
		font-weight: 600;
		color: #4a5568;
	}

	.feature-value {
		color: #2d3748;
		font-weight: 500;
	}

	.plan-action {
		text-align: center;
	}

	.plan-btn {
		width: 100%;
		background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
		color: white;
		border: none;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.95rem;
	}

	.plan-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(66, 153, 225, 0.4);
	}

	.plan-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.plan-btn:disabled:hover {
		transform: none;
		box-shadow: none;
	}

	.payment-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.plan-btn.current {
		background: #48bb78;
		cursor: not-allowed;
		opacity: 0.7;
	}

	.plan-btn.current:hover {
		transform: none;
		box-shadow: none;
	}

	.dashboard-title {
		color: #2d3748;
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0;
	}

	.upload-btn {
		background: #1a8ef1;
		color: white;
		text-decoration: none;
		border-radius: 12px;
		padding: 0.8rem 1.5rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
		border: none;
		cursor: pointer;
		font-size: 0.95rem;
		position: relative;
		z-index: 1;
		pointer-events: auto;
	}

	.upload-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
	}

	.upload-btn.primary {
		font-size: 1.1rem;
		padding: 1rem 2rem;
		border-radius: 12px;
	}

	.btn-icon {
		font-size: 1.2rem;
	}

	.loading-container,
	.error-container,
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 20px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}

	.loading-spinner {
		width: 50px;
		height: 50px;
		border: 3px solid #e2e8f0;
		border-top: 3px solid #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	.loading-text,
	.error-text {
		color: #4a5568;
		font-size: 1.2rem;
		margin: 0;
	}

	.error-icon,
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.8;
	}

	.empty-title {
		color: #2d3748;
		font-size: 2rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
	}

	.empty-text {
		color: #718096;
		font-size: 1.1rem;
		margin: 0 0 2rem 0;
		line-height: 1.5;
	}

	.retry-btn {
		background: linear-gradient(135deg, #06d6a0, #059669);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.8rem 1.5rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 1rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
	}

	.retry-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.filter-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #e2e8f0;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.filter-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		border-color: #6366f1;
	}

	.filter-image {
		position: relative;
		margin-bottom: 1rem;
	}

	.filter-image img {
		width: 100%;
		height: 200px;
		object-fit: contain;
		border-radius: 10px;
		background: #f7fafc;
	}

	.filter-type-badge {
		position: absolute;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.3rem 0.8rem;
		border-radius: 15px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.filter-content {
		color: #2d3748;
	}

	.filter-name {
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0;
		text-align: center;
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.filter-actions-header {
		display: flex;
		gap: 0.5rem;
	}

	.edit-btn,
	.delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0.3rem;
		border-radius: 5px;
		transition: all 0.3s ease;
	}

	.edit-btn:hover {
		background: rgba(76, 175, 80, 0.2);
		transform: scale(1.1);
	}

	.delete-btn:hover {
		background: rgba(244, 67, 54, 0.2);
		transform: scale(1.1);
	}

	.edit-form {
		background: rgba(255, 255, 255, 0.05);
		padding: 1rem;
		border-radius: 10px;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.edit-input,
	.edit-textarea {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 1rem;
		backdrop-filter: blur(10px);
		box-sizing: border-box;
	}

	.edit-input::placeholder,
	.edit-textarea::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.edit-textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: white;
		font-weight: 500;
	}

	.edit-checkbox {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.save-btn,
	.cancel-btn {
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.save-btn {
		background: linear-gradient(135deg, #4caf50, #45a049);
		color: white;
	}

	.save-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
	}

	.cancel-btn {
		background: linear-gradient(135deg, #f44336, #d32f2f);
		color: white;
	}

	.cancel-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(244, 67, 54, 0.4);
	}

	.filter-name {
		font-size: 1.4rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.filter-description {
		color: rgba(255, 255, 255, 0.8);
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	.filter-meta {
		margin-bottom: 1.5rem;
	}

	.meta-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.meta-label {
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.meta-value {
		font-weight: 600;
	}

	.meta-value.yes {
		color: #4caf50;
	}

	.meta-value.no {
		color: #ff9800;
	}

	.filter-actions {
		display: grid;
		gap: 1rem;
	}

	.share-section,
	.qr-section {
		background: rgba(255, 255, 255, 0.05);
		padding: 1rem;
		border-radius: 10px;
	}

	.input-label {
		display: block;
		color: white;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
	}

	.share-input {
		flex: 1;
		padding: 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 0.9rem;
		backdrop-filter: blur(10px);
	}

	.copy-btn {
		background: linear-gradient(135deg, #ff6b6b, #ee5a24);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.8rem;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.3s ease;
		min-width: 50px;
	}

	.copy-btn:hover {
		transform: scale(1.05);
	}

	.copy-btn.copied {
		background: #2563eb;
		animation: pulse 0.5s ease-in-out;
	}

	.copy-success {
		font-size: 0.8rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}

	.qr-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
	}

	.qr-image {
		width: 80px;
		height: 80px;
		background: white;
		padding: 5px;
		border-radius: 8px;
	}

	.download-qr-btn {
		background: #1a8ef1;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.6rem 1rem;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		box-shadow: 0 4px 10px rgba(68, 160, 141, 0.3);
	}

	.download-qr-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(68, 160, 141, 0.4);
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		backdrop-filter: blur(5px);
	}

	.modal-content {
		background: white;
		border-radius: 20px;
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		border: 1px solid #e2e8f0;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
		border-radius: 20px 20px 0 0;
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d3748;
		margin: 0;
	}

	.modal-close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #718096;
		padding: 0.5rem;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.modal-close-btn:hover {
		background: #e2e8f0;
		color: #2d3748;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-filter-details {
		color: #2d3748;
	}

	.modal-filter-image {
		position: relative;
		margin-bottom: 1rem;
	}

	.modal-filter-image img {
		width: 100%;
		height: 300px;
		object-fit: contain;
		border-radius: 10px;
		background: #f7fafc;
	}

	.modal-actions-header {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		justify-content: center;
	}

	.edit-btn,
	.delete-btn {
		background: none;
		border: 1px solid #e2e8f0;
		cursor: pointer;
		padding: 0.8rem 1.5rem;
		border-radius: 8px;
		transition: all 0.3s ease;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.edit-btn {
		color: #4299e1;
		border-color: #4299e1;
	}

	.edit-btn:hover {
		background: #4299e1;
		color: white;
		transform: translateY(-2px);
	}

	.delete-btn {
		color: #f56565;
		border-color: #f56565;
	}

	.delete-btn:hover {
		background: #f56565;
		color: white;
		transform: translateY(-2px);
	}

	.filter-description {
		color: #718096;
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
		font-size: 1rem;
	}

	.filter-meta {
		margin-bottom: 1.5rem;
		background: #f8fafc;
		padding: 1rem;
		border-radius: 10px;
	}

	.meta-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.meta-item:last-child {
		margin-bottom: 0;
	}

	.meta-label {
		color: #718096;
		font-weight: 500;
	}

	.meta-value {
		font-weight: 600;
		color: #2d3748;
	}

	.meta-value.yes {
		color: #48bb78;
	}

	.meta-value.no {
		color: #ed8936;
	}

	.filter-actions {
		display: grid;
		gap: 1rem;
	}

	.share-section,
	.qr-section {
		background: #f8fafc;
		padding: 1rem;
		border-radius: 10px;
	}

	.input-label {
		display: block;
		color: #4a5568;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
	}

	.share-input {
		flex: 1;
		padding: 0.8rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		background: white;
		color: #2d3748;
		font-size: 0.9rem;
	}

	.copy-btn {
		background: #1a8ef1;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.8rem;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.3s ease;
		min-width: 50px;
		box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
	}

	.copy-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 15px rgba(99, 102, 241, 0.4);
	}

	.copy-btn.copied {
		background: #2563eb;
		animation: pulse 0.5s ease-in-out;
	}

	.copy-success {
		font-size: 0.8rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.qr-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
	}

	.qr-image {
		width: 120px;
		height: 120px;
		background: white;
		padding: 5px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.download-qr-btn {
		background: #1a8ef1;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.6rem 1rem;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		box-shadow: 0 4px 10px rgba(6, 214, 160, 0.3);
	}

	.download-qr-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(6, 214, 160, 0.4);
	}

	/* Edit Form Styles in Modal */
	.edit-form {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 10px;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.edit-input,
	.edit-textarea {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		background: white;
		color: #2d3748;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.edit-input:focus,
	.edit-textarea:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.edit-input::placeholder,
	.edit-textarea::placeholder {
		color: #a0aec0;
	}

	.edit-textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: #2d3748;
		font-weight: 500;
	}

	.edit-checkbox {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.save-btn,
	.cancel-btn {
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.save-btn {
		background: linear-gradient(135deg, #10b981, #059669);
		color: white;
	}

	.save-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
	}

	.cancel-btn {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		color: white;
	}

	.cancel-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.header-actions {
			width: 100%;
			justify-content: center;
		}

		.logout-btn {
			padding: 0.75rem 1.5rem;
			font-size: 0.9rem;
		}

		.dashboard-header {
			flex-direction: column;
			text-align: center;
			gap: 1.5rem;
		}

		.header-actions-group {
			flex-direction: column;
			width: 100%;
			gap: 1rem;
		}

		.action-buttons-group {
			background: rgba(255, 255, 255, 0.95);
			padding: 0.75rem;
			gap: 0.5rem;
			width: 100%;
			max-width: 400px;
			justify-content: center;
			margin: 0 auto;
		}

		.action-btn {
			flex: 1;
			min-width: 100px;
			max-width: 130px;
			padding: 0.75rem 0.75rem;
			font-size: 0.85rem;
			justify-content: center;
		}

		.btn-text {
			font-size: 0.85rem;
		}

		.btn-icon {
			font-size: 1rem;
		}

		.pricing-section {
			padding: 1.5rem;
		}

		.pricing-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.pricing-card {
			margin: 0;
		}

		.pricing-card.popular {
			transform: none;
			scale: 1;
		}

		.pricing-title {
			font-size: 1.5rem;
		}

		.plan-name {
			font-size: 1.3rem;
		}

		.price {
			font-size: 2rem;
		}

		.plan-btn {
			padding: 1rem 1.5rem;
			font-size: 1rem;
		}

		.dashboard-title {
			font-size: 2rem;
		}

		.filters-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.logo {
			font-size: 1.5rem;
		}

		.logo-icon {
			font-size: 2rem;
		}

		.modal-content {
			width: 95%;
			margin: 1rem;
		}

		.modal-header {
			padding: 1rem;
		}

		.modal-body {
			padding: 1rem;
		}

		.modal-actions-header {
			flex-direction: column;
			gap: 0.5rem;
		}

		.edit-btn,
		.delete-btn {
			width: 100%;
			justify-content: center;
			padding: 0.875rem 1.25rem;
		}

		.edit-actions {
			flex-direction: column;
			gap: 0.75rem;
		}

		.save-btn,
		.cancel-btn {
			width: 100%;
			justify-content: center;
			padding: 0.875rem 1.25rem;
		}

		.input-group {
			flex-direction: column;
			gap: 0.75rem;
		}

		.copy-btn {
			width: 100%;
			padding: 1rem;
			justify-content: center;
		}

		.copy-btn.copied {
			background: #2563eb;
			animation: pulse 0.5s ease-in-out;
		}

		.copy-success {
			font-size: 0.8rem;
			font-weight: 600;
			display: flex;
			align-items: center;
			gap: 0.25rem;
		}

		.billing-switch {
			flex-direction: column;
			gap: 0.5rem;
			align-items: center;
		}

		.switch-option {
			width: 120px;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.main-content {
			padding: 1rem;
		}

		.filter-card {
			padding: 1rem;
		}

		.pricing-section {
			padding: 1rem;
		}

		.pricing-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.dashboard-title {
			font-size: 1.8rem;
		}

		.pricing-title {
			font-size: 1.3rem;
		}

		.pricing-card {
			padding: 1.25rem;
		}

		.plan-header {
			padding-top: 0.75rem;
		}

		.plan-btn {
			padding: 0.875rem 1.25rem;
			font-size: 0.95rem;
		}

		.modal-content {
			width: 100%;
			height: 100%;
			border-radius: 0;
			max-height: 100vh;
		}

		.modal-header {
			border-radius: 0;
			padding: 0.875rem 1rem;
		}

		.modal-body {
			padding: 0.875rem 1rem;
		}

		.modal-filter-image img {
			height: 250px;
		}

		.filters-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.filter-image img {
			height: 180px;
		}

		.dashboard-header {
			gap: 1rem;
		}

		.header-actions-group {
			gap: 1rem;
		}

		.action-buttons-group {
			flex-direction: row;
			width: 100%;
			max-width: none;
			padding: 0.5rem;
			gap: 0.4rem;
		}

		.action-btn {
			flex: 1;
			max-width: none;
			padding: 0.75rem 0.5rem;
			font-size: 0.8rem;
			justify-content: center;
		}

		.btn-text {
			font-size: 0.8rem;
		}

		.btn-icon {
			font-size: 0.9rem;
		}

		.billing-switch {
			margin-bottom: 1rem;
		}

		.switch-option {
			padding: 0.4rem 1rem;
			font-size: 0.9rem;
			width: 100px;
		}
	}
	.billing-switch {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}
	.switch-label {
		font-weight: 600;
		color: #4a5568;
		margin-right: 0.5rem;
	}
	.switch-option {
		background: #e2e8f0;
		border-radius: 20px;
		padding: 0.5rem 1.2rem;
		cursor: pointer;
		font-weight: 500;
		color: #2d3748;
		transition: background 0.2s;
		border: 1px solid transparent;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.switch-option.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-color: #667eea;
	}
	.switch-option input[type="radio"] {
		accent-color: #667eea;
		margin-right: 0.3rem;
	}
</style>
