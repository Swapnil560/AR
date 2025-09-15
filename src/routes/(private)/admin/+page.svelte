<script lang="ts">
	import QRCode from "qrcode";
	import {
		uploadImage,
		compressImage,
		validateTransparency,
	} from "$lib/imageUpload";
	import { saveFilter } from "../../../services/actions/filter.js";
	import { RazorpayService } from "../../../lib/razorpay.js";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import Logo from "../../../components/logo.svelte";
	import { getHost } from "$lib/utils";
	import {
		ArrowDownToLine,
		Blend,
		CheckCircle,
		Cloud,
		CloudUpload,
		Copy,
		FileImage,
		Folder,
		HardDrive,
		Hourglass,
		LayoutGrid,
		Plus,
		Power,
		TriangleAlert,
	} from "@lucide/svelte";

	let file: File | null = null;
	let filterPreview: string | null = null;
	let errorMsg: string | null = null;
	let filterLink: string | null = null;
	let qrCodeUrl: string | null = null;
	let isUploading: boolean = false;
	let uploadSuccess: boolean = false;
	let user = null;
	let transparencyInfo: {
		isValid: boolean;
		transparencyPercentage: number;
		error?: string;
	} | null = null;
	let copySuccess: boolean = false;

	// Pricing plans state
	let showPricingPlans = false;
	let currentPlan = "free"; // This would typically come from user data
	let isProcessingPayment = false;

	// Filter details form
	let filterForm = {
		name: "",
		description: "",
		ai_need: false,
	};

	// Pricing plans data
	const pricingPlans = [
		{
			id: "free",
			name: "Free",
			filters: 1,
			storage: "Limited",
			features: "Branding + Link",
			price: "₹0",
			priceAmount: 0,
			period: "forever",
			popular: false,
		},
		{
			id: "starter",
			name: "Starter",
			filters: 5,
			storage: "Medium",
			features: "Free + Analytics + Share",
			price: "₹1",
			priceAmount: 1,
			period: "month",
			popular: false,
		},
		{
			id: "pro",
			name: "Pro",
			filters: 10,
			storage: "Large",
			features: "Starter + Full Branding + white label",
			price: "₹2",
			priceAmount: 2,
			period: "month",
			popular: true,
		},
		{
			id: "enterprise",
			name: "Enterprise",
			filters: 50,
			storage: "High",
			features: "Pro + API access",
			price: "₹3",
			priceAmount: 3,
			period: "month",
			popular: false,
		},
	];

	onMount(() => {
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

		// Load saved plan for this user
		const savedPlan = localStorage.getItem(`userPlan_${user.id}`);
		if (savedPlan) {
			currentPlan = savedPlan;
		}

		// Redirect super admin to super admin page
		if (user.role === "super_admin") {
			goto("/superadmin");
			return;
		}

		// Allow admin and regular users to access upload functionality
		// Regular users can upload filters, only super_admin gets redirected
	});

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

	function downloadQR(qrCodeUrl, filterName) {
		const link = document.createElement("a");
		link.download = `${filterName}-qr-code.png`;
		link.href = qrCodeUrl;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function togglePricingPlans() {
		showPricingPlans = !showPricingPlans;
	}

	function savePlanToStorage(planId) {
		if (user?.id) {
			localStorage.setItem(`userPlan_${user.id}`, planId);
		}
	}

	async function selectPlan(planId) {
		const selectedPlan = pricingPlans.find((p) => p.id === planId);

		if (!selectedPlan) {
			console.error("Plan not found");
			return;
		}

		if (planId === "free") {
			// Handle free plan - no payment needed
			currentPlan = planId;
			savePlanToStorage(planId);
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

		if (selectedPlan.priceAmount === 0) {
			// Free plan
			currentPlan = planId;
			savePlanToStorage(planId);
			alert("Plan selected successfully!");
			return;
		}

		// For paid plans, process payment
		await processPayment(selectedPlan);
	}

	async function processPayment(plan) {
		if (isProcessingPayment) return;

		isProcessingPayment = true;

		try {
			const basePrice = plan.priceAmount;
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
			const onPaymentSuccess = async () => {
				currentPlan = plan.id;
				savePlanToStorage(plan.id);
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

	function resetState() {
		filterPreview = null;
		errorMsg = null;
		filterLink = null;
		qrCodeUrl = null;
		isUploading = false;
		uploadSuccess = false;
		transparencyInfo = null;
		copySuccess = false;
		filterForm = {
			name: "",
			description: "",
			ai_need: false,
		};
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copySuccess = true;
			// Reset the copy success state after 2 seconds
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (error) {
			console.error("Failed to copy text:", error);
		}
	}

	async function handleUpload(event) {
		resetState();
		file = event.target.files[0];
		if (!file) return;

		// Check file type - allow PNG and GIF
		if (
			!file.type.startsWith("image/png") &&
			!file.type.startsWith("image/gif")
		) {
			errorMsg = "Only PNG and GIF images are allowed!";
			return;
		}

		// Updated file size limit to 30MB
		if (file.size > 30 * 1024 * 1024) {
			errorMsg = "File too large (max 30MB)";
			return;
		}

		// Show preview first
		filterPreview = URL.createObjectURL(file);

		// Validate transparency
		try {
			transparencyInfo = await validateTransparency(file);
			if (!transparencyInfo.isValid) {
				errorMsg =
					transparencyInfo.error ||
					"Image does not meet transparency requirements";
				return;
			}
		} catch (error) {
			console.error("Transparency validation error:", error);
			errorMsg =
				"Failed to validate image transparency. Please try again.";
			return;
		}
	}

	async function uploadFilter() {
		if (!file) return;

		// Validate form
		if (!filterForm.name.trim()) {
			errorMsg = "Please enter a filter name";
			return;
		}

		// Re-validate transparency before upload
		if (!transparencyInfo?.isValid) {
			errorMsg =
				"Image transparency validation failed. Please upload a valid transparent image.";
			return;
		}

		isUploading = true;
		errorMsg = null;

		try {
			// Compress the image (if PNG)
			let imageToUpload = file;
			if (file.type.startsWith("image/png")) {
				imageToUpload = await compressImage(file);
			}

			// Upload to server
			const uploadedImageUrl = await uploadImage(
				imageToUpload,
				"filters"
			);

			// Construct full image URL
			const fullImageUrl = `${import.meta.env.VITE_IMAGE_URL}/${uploadedImageUrl}`;

			if (!user?.id) {
				errorMsg = "User not found. Please login again.";
				return;
			}

			// Save filter to database with additional details
			const filterData = {
				user: user.id,
				filter_url: fullImageUrl,
				name: filterForm.name.trim(),
				description: filterForm.description.trim(),
				ai_need: filterForm.ai_need,
			};

			console.log("Saving filter with data:", filterData);
			const res = await saveFilter(filterData);
			console.log("Save filter response:", res);

			if (res.err) {
				console.error("Filter save error:", res.err);
				errorMsg = "Failed to upload filter. Please try again.";
				return;
			}

			// Extract filename from uploadedImageUrl (remove path prefix if exists)
			const filename = uploadedImageUrl
				.split("/")
				.pop()
				.replace(".png", "");
			// Generate shortened/obfuscated URL without .png and without user= prefix
			filterLink = `${window.location.origin}/filter/ar?filter=${filename}&${user.id}`;
			qrCodeUrl = await QRCode.toDataURL(filterLink);
			uploadSuccess = true;
		} catch (error) {
			console.error("Upload failed:", error);
			errorMsg = "Failed to upload image. Please try again.";
		} finally {
			isUploading = false;
		}
	}

	function handleDragOver(event) {
		event.preventDefault();
		event.currentTarget.classList.add("drag-over");
	}

	function handleDragLeave(event) {
		event.preventDefault();
		event.currentTarget.classList.remove("drag-over");
	}

	function handleDrop(event) {
		event.preventDefault();
		event.currentTarget.classList.remove("drag-over");

		const files = event.dataTransfer.files;
		if (files.length > 0) {
			const fakeEvent = { target: { files: [files[0]] } };
			handleUpload(fakeEvent);
		}
	}
</script>

<svelte:head>
	<title>MyAR Filter Upload</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</svelte:head>

<div class="app-container">
	<header class="header">
		<div class="header-content">
			<h1 class="logo">
				<span class="logo-icon"><Logo /></span>
				MyAR
			</h1>
			<div class="header-actions">
				<span class="welcome-text"
					>Welcome, {user?.name || "Admin"}</span
				>
				<div class="action-buttons-group">
					<a href="/dashboard" class="action-btn dashboard-btn">
						<span class="btn-text">Dashboard</span>
					</a>

					<button class="action-btn logout-btn" on:click={logout}>
						<Power />
					</button>
				</div>
			</div>
		</div>
	</header>

	<main class="main-content">
		<!-- Pricing Plans Section -->
		{#if showPricingPlans}
			<div class="pricing-section">
				<div class="pricing-header">
					<h3 class="pricing-title">Choose Your Plan</h3>
					<button class="close-btn" on:click={togglePricingPlans}
						>✕</button
					>
				</div>

				<div class="pricing-grid">
					{#each pricingPlans as plan}
						<div
							class="pricing-card {plan.popular
								? 'popular'
								: ''} {currentPlan === plan.id
								? 'current'
								: ''}"
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
									<span class="price">{plan.price}</span>
									{#if plan.period !== "forever"}
										<span class="period"
											>/{plan.period}</span
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
										disabled={isProcessingPayment}
									>
										{#if isProcessingPayment}
											<div class="payment-loading">
												<div class="spinner"></div>
												Processing...
											</div>
										{:else}
											{plan.id === "free"
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
		{/if}

		<div class="upload-section">
			<div class="upload-container">
				<h2 class="section-title">Upload AR Filter</h2>

				<div
					class="upload-area"
					on:dragover={handleDragOver}
					on:dragleave={handleDragLeave}
					on:drop={handleDrop}
					class:uploading={isUploading}
					class:upload-success={uploadSuccess}
				>
					{#if isUploading}
						<div class="upload-icon"><Hourglass /></div>
						<div class="upload-text">
							<p class="upload-primary">
								Uploading your filter...
							</p>
							<p class="upload-secondary">
								Please wait while we process your image
							</p>
						</div>
					{:else if uploadSuccess}
						<div class="upload-icon"><CheckCircle /></div>
						<div class="upload-text">
							<p class="upload-primary">Upload successful!</p>
							<p class="upload-secondary">
								Your AR filter is ready to share
							</p>
						</div>
					{:else}
						<div class="upload-icon"><Folder /></div>
						<div class="upload-text">
							<p class="upload-primary">
								Drag & drop your transparent PNG/GIF filter here
							</p>
							<p class="upload-secondary">
								or click to browse files • Must have transparent
								background
							</p>
						</div>
						<input
							type="file"
							accept="image/png,image/gif"
							on:change={handleUpload}
							class="file-input"
							id="file-upload"
							disabled={isUploading}
						/>
						<label for="file-upload" class="upload-btn">
							<span class="btn-icon"><CloudUpload /></span>
							Choose File
						</label>
					{/if}
				</div>

				<div class="upload-info">
					<div class="info-item">
						<span class="info-icon"><HardDrive /></span>
						<span class="info-text">Maximum file size: 30MB</span>
					</div>
					<div class="info-item">
						<span class="info-icon"><FileImage /></span>
						<span class="info-text"
							>Supported formats: PNG and GIF</span
						>
					</div>
					<div class="info-item">
						<span class="info-icon"><Blend /></span>
						<span class="info-text"
							>Must have transparent background (min 10%)</span
						>
					</div>
					<div class="info-item">
						<span class="info-icon"><Cloud /></span>
						<span class="info-text">Uploaded to cloud storage</span>
					</div>
				</div>

				{#if errorMsg}
					<div class="error-message">
						<span class="error-icon"><TriangleAlert /></span>
						{errorMsg}
					</div>
				{/if}

				{#if transparencyInfo && filterPreview}
					<div
						class="transparency-info {transparencyInfo.isValid
							? 'valid'
							: 'invalid'}"
					>
						<div class="transparency-header">
							<span class="transparency-icon"
								>{transparencyInfo.isValid ? "✅" : "❌"}</span
							>
							<span class="transparency-title"
								>Transparency Check</span
							>
						</div>
						<div class="transparency-details">
							<div class="transparency-percentage">
								{transparencyInfo.transparencyPercentage}%
								transparent
							</div>
							<div class="transparency-status">
								{transparencyInfo.isValid
									? "Valid for AR filters"
									: "Insufficient transparency"}
							</div>
							{#if transparencyInfo.error}
								<div class="transparency-error">
									{transparencyInfo.error}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if filterPreview}
			<div class="filter-details-section">
				<div class="details-container">
					<h3 class="section-title">Filter Details</h3>

					<form
						class="filter-form"
						on:submit|preventDefault={uploadFilter}
					>
						<div class="form-group">
							<label for="filter-name" class="form-label"
								>Filter Name *</label
							>
							<input
								id="filter-name"
								type="text"
								bind:value={filterForm.name}
								placeholder="Enter a unique name for your filter"
								required
								class="form-input"
								disabled={isUploading}
							/>
						</div>

						<div class="form-group">
							<label for="filter-description" class="form-label"
								>Description</label
							>
							<textarea
								id="filter-description"
								bind:value={filterForm.description}
								placeholder="Describe what makes this filter special..."
								rows="3"
								class="form-textarea"
								disabled={isUploading}
							></textarea>
						</div>

						<div class="form-group">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={filterForm.ai_need}
									class="checkbox-input"
									disabled={isUploading}
								/>
								<span class="checkbox-custom"></span>
								<span class="checkbox-text"
									>This filter requires AI enhancement</span
								>
							</label>
						</div>

						<button
							type="submit"
							class="submit-btn"
							disabled={isUploading ||
								!filterForm.name.trim() ||
								!transparencyInfo?.isValid}
						>
							{#if isUploading}
								<div class="btn-spinner"></div>
								Uploading...
							{:else}
								<span class="btn-icon"><CloudUpload /></span>
								Upload & Generate Link
							{/if}
						</button>
					</form>
				</div>
			</div>

			{#if filterLink}
				<div class="preview-section">
					<div class="preview-container">
						<h3 class="section-title">Filter Preview</h3>
						<div class="filter-preview">
							<img
								src={filterPreview}
								class="preview-image"
								alt="Filter preview"
							/>
							<div class="preview-info">
								<div class="file-info">
									<span class="info-label">Type:</span>
									<span class="info-value"
										>{file?.type.includes("gif")
											? "Animated GIF"
											: "PNG Image"}</span
									>
								</div>
								<div class="file-info">
									<span class="info-label">Size:</span>
									<span class="info-value"
										>{(file?.size / 1024 / 1024).toFixed(2)}
										MB</span
									>
								</div>
								{#if transparencyInfo}
									<div class="file-info">
										<span class="info-label"
											>Transparency:</span
										>
										<span
											class="info-value {transparencyInfo.isValid
												? 'valid-transparency'
												: 'invalid-transparency'}"
										>
											{transparencyInfo.transparencyPercentage}%
										</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}

		{#if filterLink}
			<div class="share-section">
				<div class="share-container">
					<h3 class="section-title">
						🎉 Filter Successfully Created!
					</h3>

					<div class="filter-summary">
						<div class="summary-item">
							<span class="summary-label">Filter Name:</span>
							<span class="summary-value">{filterForm.name}</span>
						</div>
						{#if filterForm.description}
							<div class="summary-item">
								<span class="summary-label">Description:</span>
								<span class="summary-value"
									>{filterForm.description}</span
								>
							</div>
						{/if}
						<div class="summary-item">
							<span class="summary-label">AI Enhanced:</span>
							<span
								class="summary-value {filterForm.ai_need
									? 'ai-yes'
									: 'ai-no'}"
							>
								{filterForm.ai_need ? "Yes" : "No"}
							</span>
						</div>
					</div>

					<div class="share-content">
						<div class="link-section">
							<label class="input-label">Share Link</label>
							<div class="input-group">
								<input
									type="text"
									value={filterLink}
									readonly
									class="share-input"
								/>
								<button
									class="copy-btn"
									class:copied={copySuccess}
									on:click={() => copyToClipboard(filterLink)}
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

						{#if qrCodeUrl}
							<div class="qr-section">
								<label class="input-label">QR Code</label>
								<div class="qr-container">
									<img
										src={qrCodeUrl}
										alt="QR Code"
										class="qr-image"
									/>
									<p class="qr-text">
										Scan to access AR camera
									</p>
									<button
										class="download-qr-btn"
										on:click={() =>
											downloadQR(
												qrCodeUrl,
												filterForm.name
											)}
										title="Download QR Code"
									>
										<ArrowDownToLine />
									</button>
								</div>
							</div>
						{/if}
					</div>

					<div class="action-buttons">
						<a href="/dashboard" class="dashboard-link-btn">
							<span class="btn-icon"><LayoutGrid /></span>
							View Dashboard
						</a>
						<button class="new-filter-btn" on:click={resetState}>
							<span class="btn-icon"><Plus /></span>
							Upload Another Filter
						</button>
					</div>

					<div class="demo-notice">
						<div class="notice-icon"><Cloud /></div>
						<div class="notice-content">
							<p class="notice-title">Successfully Saved</p>
							<p class="notice-text">
								Your AR filter "{filterForm.name}" has been
								uploaded to cloud storage and saved to the
								database. You can view all your filters and
								their analytics in your dashboard.
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

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
		flex-wrap: wrap;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.action-buttons-group {
		display: flex;
		gap: 0.75rem;
		align-items: center;
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

	.action-btn.dashboard-btn {
		background: #1a8ef1;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
	}

	.action-btn.dashboard-btn:hover {
		box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
	}

	.action-btn.plans-btn {
		background: #0511f3;
		box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
	}

	.action-btn.plans-btn:hover {
		box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
	}

	.action-btn.logout-btn {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
		border-radius: 999px;
		padding: 0.75rem 0.75rem;
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

	.welcome-text {
		color: #4a5568;
		font-weight: 500;
		margin-right: 3rem;
	}

	.tagline {
		color: #4a5568;
		margin: 0.5rem 0 0 0;
		font-size: 1.1rem;
		font-weight: 300;
		text-align: center;
	}

	.logo {
		color: #2d3748;
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.logo-icon {
		font-size: 3rem;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.main-content {
		flex: 1;
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1rem;
		width: 100%;
		box-sizing: border-box;
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
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

	.upload-section,
	.preview-section,
	.share-section,
	.filter-details-section {
		margin-bottom: 2rem;
	}

	.upload-container,
	.preview-container,
	.share-container,
	.details-container {
		background: white;
		border-radius: 20px;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		border: 1px solid #e2e8f0;
	}

	.section-title {
		color: #2d3748;
		font-size: 1.8rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		text-align: center;
	}

	.upload-area {
		position: relative;
		border: 3px dashed #cbd5e0;
		border-radius: 15px;
		padding: 3rem 2rem;
		text-align: center;
		transition: all 0.3s ease;
		cursor: pointer;
		background: #f7fafc;
	}

	.upload-area:hover,
	.upload-area.drag-over {
		border-color: #6366f1;
		background: #eef2ff;
		transform: scale(1.02);
	}

	.upload-area.uploading {
		border-color: #f59e0b;
		background: #fffbeb;
		pointer-events: none;
	}

	.upload-area.upload-success {
		border-color: #10b981;
		background: #ecfdf5;
	}

	.upload-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.8;
	}

	.upload-text {
		margin-bottom: 1.5rem;
	}

	.upload-primary {
		color: #2d3748;
		font-size: 1.3rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.upload-secondary {
		color: #718096;
		margin: 0;
		font-size: 1rem;
	}

	.file-input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	.upload-btn {
		background: #1a8ef1;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
		transition: all 0.3s ease;
		pointer-events: none;
	}

	.upload-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
	}

	.btn-icon {
		font-size: 1.3rem;
	}

	.upload-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #718096;
		font-size: 0.9rem;
	}

	.info-icon {
		font-size: 1.2rem;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 10px;
		padding: 1rem;
		margin-top: 1rem;
		color: #dc2626;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
	}

	.error-icon {
		font-size: 1.2rem;
	}

	.transparency-info {
		border-radius: 10px;
		padding: 1rem;
		margin-top: 1rem;
		transition: all 0.3s ease;
	}

	.transparency-info.valid {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	.transparency-info.invalid {
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.transparency-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.8rem;
	}

	.transparency-icon {
		font-size: 1.2rem;
	}

	.transparency-title {
		color: #2d3748;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.transparency-details {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.transparency-percentage {
		color: #2d3748;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.transparency-status {
		color: #4a5568;
		font-size: 0.9rem;
	}

	.transparency-error {
		color: #718096;
		font-size: 0.9rem;
		font-style: italic;
	}

	.filter-preview {
		text-align: center;
	}

	.preview-image {
		max-width: 100%;
		max-height: 400px;
		border-radius: 15px;
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
	}

	.share-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.link-section,
	.qr-section {
		text-align: center;
	}

	.input-label {
		display: block;
		color: #2d3748;
		font-weight: 600;
		margin-bottom: 0.8rem;
		font-size: 1.1rem;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.share-input {
		flex: 1;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		background: #f7fafc;
		color: #2d3748;
		font-size: 1rem;
	}

	.share-input::placeholder {
		color: #a0aec0;
	}

	.copy-btn {
		background: #f35f38;
		color: white;
		border: none;
		border-radius: 10px;
		padding: 1rem;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.3s ease;
		min-width: 60px;
		box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
	}

	.copy-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
	}

	.copy-btn.copied {
		background: #2563eb;
		animation: pulse 0.5s ease-in-out;
	}

	.copy-success {
		font-size: 0.9rem;
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
		display: inline-block;
		background: white;
		padding: 1.5rem;
		border-radius: 15px;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		text-align: center;
		border: 1px solid #e2e8f0;
	}

	.qr-image {
		display: block;
		max-width: 200px;
		margin: 0 auto;
	}

	.qr-text {
		margin: 1rem 0;
		color: #4a5568;
		font-weight: 500;
	}

	.download-qr-btn {
		background: #0511f3;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.8rem 1.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
		margin-top: 0.5rem;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.download-qr-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(6, 214, 160, 0.4);
	}

	.demo-notice {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: 15px;
		padding: 1.5rem;
		margin-top: 2rem;
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.notice-icon {
		font-size: 1.5rem;
		margin-top: 0.2rem;
	}

	.notice-title {
		color: #059669;
		font-weight: 600;
		font-size: 1.1rem;
		margin: 0 0 0.5rem 0;
	}

	.notice-text {
		color: #4a5568;
		margin: 0;
		line-height: 1.5;
	}

	/* Form Styles */
	.filter-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		color: #2d3748;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.form-input,
	.form-textarea {
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		background: #f7fafc;
		color: #2d3748;
		font-size: 1rem;
		transition: all 0.3s ease;
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: #6366f1;
		background: white;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.form-input::placeholder,
	.form-textarea::placeholder {
		color: #a0aec0;
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		cursor: pointer;
		color: #2d3748;
		font-weight: 500;
	}

	.checkbox-input {
		display: none;
	}

	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 2px solid #cbd5e0;
		border-radius: 4px;
		background: #f7fafc;
		position: relative;
		transition: all 0.3s ease;
	}

	.checkbox-input:checked + .checkbox-custom {
		background: linear-gradient(135deg, #06d6a0, #059669);
		border-color: #06d6a0;
	}

	.checkbox-input:checked + .checkbox-custom::after {
		content: "✓";
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-weight: bold;
		font-size: 12px;
	}

	.submit-btn {
		background: #1a8ef1;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1.2rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
		transition: all 0.3s ease;
		margin-top: 1rem;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.preview-info {
		margin-top: 1rem;
		display: flex;
		justify-content: center;
		gap: 2rem;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	.info-label {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.info-value {
		color: #2d3748;
		font-weight: 600;
	}

	.info-value.valid-transparency {
		color: #059669;
	}

	.info-value.invalid-transparency {
		color: #d97706;
	}

	.filter-summary {
		background: #f8fafc;
		border-radius: 15px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		border: 1px solid #e2e8f0;
	}

	.summary-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.8rem;
	}

	.summary-item:last-child {
		margin-bottom: 0;
	}

	.summary-label {
		color: #718096;
		font-weight: 500;
	}

	.summary-value {
		color: #2d3748;
		font-weight: 600;
	}

	.summary-value.ai-yes {
		color: #059669;
	}

	.summary-value.ai-no {
		color: #d97706;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin: 2rem 0;
		flex-wrap: wrap;
	}

	.dashboard-link-btn,
	.new-filter-btn {
		background: #979797;
		color: white;
		text-decoration: none;
		border: none;
		border-radius: 12px;
		padding: 1rem 2rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
	}

	.new-filter-btn {
		background: #1a8ef1;
		box-shadow: 0 4px 15px rgba(6, 214, 160, 0.3);
	}

	.dashboard-link-btn:hover,
	.new-filter-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
	}

	.new-filter-btn:hover {
		box-shadow: 0 8px 25px rgba(6, 214, 160, 0.4);
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Responsive Design */
	@media (min-width: 768px) {
		.share-content {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}

		.logo {
			justify-content: flex-start;
		}
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.header-actions {
			justify-content: center;
			flex-wrap: wrap;
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
		}

		.welcome-text {
			order: 3;
			width: 100%;
			text-align: center;
			margin: 0.5rem 0;
		}

		.action-btn {
			flex: 1;
			min-width: 100px;
			max-width: 120px;
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

		.logo {
			font-size: 2rem;
			justify-content: center;
		}

		.logo-icon {
			font-size: 2.5rem;
		}

		.tagline {
			font-size: 1rem;
		}

		.main-content {
			padding: 1rem;
		}

		.upload-container,
		.preview-container,
		.share-container,
		.details-container {
			padding: 1.5rem;
		}

		.upload-area {
			padding: 2rem 1rem;
		}

		.upload-icon {
			font-size: 3rem;
		}

		.upload-primary {
			font-size: 1.1rem;
		}

		.section-title {
			font-size: 1.5rem;
		}

		.input-group {
			flex-direction: column;
			gap: 0.75rem;
		}

		.copy-btn {
			align-self: center;
			max-width: 200px;
			padding: 1rem 1.5rem;
		}

		.demo-notice {
			flex-direction: column;
			text-align: center;
		}

		.action-buttons {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.dashboard-link-btn,
		.new-filter-btn {
			width: 100%;
			justify-content: center;
			padding: 1rem 1.5rem;
			font-size: 1rem;
		}

		.preview-info {
			flex-direction: column;
			gap: 1rem;
		}

		.upload-info {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.logo {
			font-size: 1.8rem;
		}

		.pricing-section {
			padding: 1rem;
		}

		.pricing-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
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

		.upload-container,
		.preview-container,
		.share-container,
		.details-container {
			padding: 1rem;
		}

		.upload-area {
			padding: 1.5rem 0.5rem;
		}

		.upload-btn {
			padding: 0.8rem 1.5rem;
			font-size: 1rem;
		}

		.upload-info {
			grid-template-columns: 1fr;
		}

		.header-actions {
			flex-direction: column;
			gap: 1rem;
			width: 100%;
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

		.welcome-text {
			padding: 0.5rem 1rem;
			font-size: 0.9rem;
			text-align: center;
			width: 100%;
		}

		.submit-btn {
			padding: 1rem 1.5rem;
			font-size: 1rem;
		}

		.section-title {
			font-size: 1.3rem;
		}

		.plan-btn {
			padding: 0.875rem 1.25rem;
			font-size: 0.95rem;
		}

		.copy-btn {
			padding: 0.875rem 1.25rem;
			max-width: none;
		}

		.dashboard-link-btn,
		.new-filter-btn {
			padding: 0.875rem 1.25rem;
			font-size: 0.95rem;
		}
	}
</style>
