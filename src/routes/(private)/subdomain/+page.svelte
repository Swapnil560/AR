<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import {
		getUsers,
		updateUser,
		updateUserByEmail,
	} from "../../../services/actions/user.js";

	let subdomainName = $state("");
	let isChecking = $state(false);
	let isSaving = $state(false);
	let error = $state("");
	let successMsg = $state("");
	let isAvailable = $state(null as boolean | null); // null = not checked, true = available, false = taken
	let hasChecked = $state(false);
	let tempUserData = $state(null as any);

	// Check if user is coming from registration
	onMount(() => {
		const userData = localStorage.getItem("tempUser");
		if (!userData) {
			// If no temp user data, redirect to login
			goto("/login");
		} else {
			tempUserData = JSON.parse(userData);
		}
	});

	async function checkSubdomainAvailability() {
		if (!subdomainName.trim()) {
			error = "Please enter a subdomain name";
			return;
		}

		// Validate subdomain name format
		const subdomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/;
		if (subdomainName.length < 3 || subdomainName.length > 63) {
			error = "Subdomain name must be between 3 and 63 characters";
			return;
		}
		if (!subdomainRegex.test(subdomainName)) {
			error =
				"Subdomain name can only contain letters, numbers, and hyphens (not at the beginning or end)";
			return;
		}

		isChecking = true;
		error = "";
		successMsg = "";

		try {
			// Check if subdomain exists in users table
			const response = await getUsers({
				search: `subdomain:${subdomainName.toLowerCase()}`,
			});

			if (response.err) {
				error =
					"Error checking subdomain availability. Please try again.";
				isAvailable = null;
			} else if (response.count > 0) {
				isAvailable = false;
				error =
					"This subdomain is already taken. Please choose another one.";
			} else {
				isAvailable = true;
				successMsg = "Great! This subdomain is available.";
			}
			hasChecked = true;
		} catch (err) {
			error = "Error checking subdomain availability. Please try again.";
			isAvailable = null;
		}

		isChecking = false;
	}

	async function saveSubdomain() {
		if (!isAvailable) {
			error = "Please check subdomain availability first";
			return;
		}

		if (!tempUserData) {
			error = "User data not found. Please register again.";
			return;
		}

		isSaving = true;
		error = "";

		try {
			console.log("Saving subdomain for user:", tempUserData);
			console.log("Subdomain name:", subdomainName.toLowerCase());

			let updateResponse;

			if (tempUserData.id) {
				console.log("Updating by ID:", tempUserData.id);
				updateResponse = await updateUser({
					id: tempUserData.id,
					subdomain: subdomainName.toLowerCase(),
				});
			} else if (tempUserData.email) {
				console.log("No ID found, trying to find user by email first");

				// First, find the user by email to get their ID
				const userSearchResponse = await getUsers({
					search: `email:${tempUserData.email}`,
				});

				console.log("User search response:", userSearchResponse);

				if (userSearchResponse.err || userSearchResponse.count === 0) {
					error = "User not found. Please register again.";
					isSaving = false;
					return;
				}

				// Get the user ID from search results
				const foundUser = userSearchResponse.result[0];
				console.log("Found user:", foundUser);

				// Now update by ID
				updateResponse = await updateUser({
					id: foundUser.id,
					subdomain: subdomainName.toLowerCase(),
				});
			} else {
				error = "Unable to identify user. Please register again.";
				isSaving = false;
				return;
			}

			console.log("Update response:", updateResponse);

			if (updateResponse.err) {
				error = "Error saving subdomain. Please try again.";
				console.error("Update error:", updateResponse);
				isSaving = false;
				return;
			}

			// Check if any rows were affected
			if (
				updateResponse.result &&
				updateResponse.result.rowsAffected === 0
			) {
				error = "User not found. Please register again.";
				console.error("No rows affected - user not found");
				isSaving = false;
				return;
			}

			successMsg =
				"Subdomain saved successfully! Redirecting to login...";

			// Remove temp user data and redirect to login
			localStorage.removeItem("tempUser");

			setTimeout(() => {
				goto("/login");
			}, 2000);
		} catch (err) {
			console.error("Save subdomain error:", err);
			error = "Error saving subdomain. Please try again.";
		}

		isSaving = false;
	}

	function handleInputChange() {
		// Reset availability check when input changes
		isAvailable = null;
		hasChecked = false;
		error = "";
		successMsg = "";
	}
</script>

<div class="subdomain-container">
	<div class="subdomain-background">
		<div class="floating-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>
	</div>

	<div class="subdomain-card">
		<div class="subdomain-header">
			<div class="logo">
				<div class="logo-icon">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12 2L2 7L12 12L22 7L12 2Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="round"
						/>
						<path
							d="M2 17L12 22L22 17"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="round"
						/>
						<path
							d="M2 12L12 17L22 12"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<span>RongCam</span>
			</div>
			<h1>Choose Your Subdomain</h1>
			<p>Select a unique subdomain for your account</p>
		</div>

		<div class="subdomain-form">
			{#if error}
				<div class="alert alert-error">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="2"
						/>
						<line
							x1="15"
							y1="9"
							x2="9"
							y2="15"
							stroke="currentColor"
							stroke-width="2"
						/>
						<line
							x1="9"
							y1="9"
							x2="15"
							y2="15"
							stroke="currentColor"
							stroke-width="2"
						/>
					</svg>
					{error}
				</div>
			{/if}

			{#if successMsg}
				<div class="alert alert-success">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9 12L11 14L15 10"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="2"
						/>
					</svg>
					{successMsg}
				</div>
			{/if}

			<div class="subdomain-input-group">
				<label for="subdomain">Subdomain Name</label>
				<div class="subdomain-input-wrapper">
					<input
						type="text"
						id="subdomain"
						bind:value={subdomainName}
						oninput={handleInputChange}
						placeholder="yoursubdomain"
						disabled={isSaving}
						class="subdomain-input"
						autocomplete="off"
					/>
					<span class="subdomain-suffix">.myar.in</span>
				</div>
				<small class="input-help">
					Use 3-63 characters. Letters, numbers, and hyphens only (no
					hyphens at start/end).
				</small>
			</div>

			<div class="button-group">
				<button
					type="button"
					onclick={checkSubdomainAvailability}
					disabled={!subdomainName.trim() || isChecking || isSaving}
					class="btn btn-secondary"
				>
					{#if isChecking}
						<div class="spinner"></div>
						Checking...
					{:else}
						Check Availability
					{/if}
				</button>

				<button
					type="button"
					onclick={saveSubdomain}
					disabled={!isAvailable || isSaving}
					class="btn btn-primary"
				>
					{#if isSaving}
						<div class="spinner"></div>
						Saving...
					{:else}
						Save Subdomain
					{/if}
				</button>
			</div>

			{#if hasChecked}
				<div class="availability-status">
					{#if isAvailable}
						<div class="status-available">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M9 12L11 14L15 10"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<circle
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="2"
								/>
							</svg>
							<span
								><strong>{subdomainName}</strong>.myar.in is
								available!</span
							>
						</div>
					{:else}
						<div class="status-taken">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="2"
								/>
								<line
									x1="15"
									y1="9"
									x2="9"
									y2="15"
									stroke="currentColor"
									stroke-width="2"
								/>
								<line
									x1="9"
									y1="9"
									x2="15"
									y2="15"
									stroke="currentColor"
									stroke-width="2"
								/>
							</svg>
							<span
								><strong>{subdomainName}</strong>.myar.in is
								already taken</span
							>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.subdomain-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		overflow: hidden;
	}

	.subdomain-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
	}

	.floating-shapes {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.shape {
		position: absolute;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		animation: float 6s ease-in-out infinite;
	}

	.shape-1 {
		width: 80px;
		height: 80px;
		top: 20%;
		left: 10%;
		animation-delay: 0s;
	}

	.shape-2 {
		width: 120px;
		height: 120px;
		top: 60%;
		right: 10%;
		animation-delay: 2s;
	}

	.shape-3 {
		width: 100px;
		height: 100px;
		bottom: 20%;
		left: 20%;
		animation-delay: 4s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	.subdomain-card {
		position: relative;
		z-index: 2;
		background: white;
		border-radius: 20px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		padding: 40px;
		width: 100%;
		max-width: 500px;
		backdrop-filter: blur(10px);
	}

	.subdomain-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 24px;
	}

	.logo-icon {
		width: 32px;
		height: 32px;
		color: #667eea;
	}

	.logo span {
		font-size: 24px;
		font-weight: 700;
		color: #2d3748;
	}

	.subdomain-header h1 {
		font-size: 28px;
		font-weight: 700;
		color: #2d3748;
		margin: 0 0 8px 0;
	}

	.subdomain-header p {
		color: #718096;
		font-size: 16px;
		margin: 0;
	}

	.subdomain-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.alert {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
	}

	.alert svg {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.alert-error {
		background: #fed7d7;
		color: #c53030;
		border: 1px solid #feb2b2;
	}

	.alert-success {
		background: #c6f6d5;
		color: #2f855a;
		border: 1px solid #9ae6b4;
	}

	.subdomain-input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.subdomain-input-group label {
		font-weight: 600;
		color: #2d3748;
		font-size: 14px;
	}

	.subdomain-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		background: white;
		transition: border-color 0.3s ease;
	}

	.subdomain-input-wrapper:focus-within {
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.subdomain-input {
		flex: 1;
		padding: 16px;
		border: none;
		outline: none;
		background: transparent;
		font-size: 16px;
		color: #2d3748;
	}

	.subdomain-suffix {
		padding: 16px;
		color: #718096;
		font-size: 16px;
		background: #f7fafc;
		border-left: 1px solid #e2e8f0;
	}

	.input-help {
		color: #718096;
		font-size: 12px;
	}

	.button-group {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 16px 24px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		min-height: 56px;
		flex: 1;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
	}

	.btn-secondary {
		background: white;
		color: #667eea;
		border: 2px solid #667eea;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #667eea;
		color: white;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.availability-status {
		margin-top: 16px;
	}

	.status-available,
	.status-taken {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
	}

	.status-available {
		background: #c6f6d5;
		color: #2f855a;
		border: 1px solid #9ae6b4;
	}

	.status-taken {
		background: #fed7d7;
		color: #c53030;
		border: 1px solid #feb2b2;
	}

	.status-available svg,
	.status-taken svg {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.subdomain-card {
			padding: 24px;
			margin: 16px;
		}

		.subdomain-header h1 {
			font-size: 24px;
		}

		.button-group {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}
</style>
