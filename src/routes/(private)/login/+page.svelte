<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		getUsers,
		loginUser,
		saveUser,
	} from "../../../services/actions/user.js";
	import { onMount } from "svelte";
	import { sendEmail, OTPEmailTemplate } from "$lib/email.ts";
	import { hashPassword, comparePassword } from "$lib/bcrypt.ts";
	import { getHost } from "$lib/utils.ts";

	let isLogin = $state(true); // Toggle between login and signup
	let showPassword = $state(false);
	let loading = $state(false);
	let error = $state("");
	let successMsg = $state("");

	let savedOtp = $state("");
	let inputOtp = $state("");
	let otpSent = $state(false);

	const init = {
		name: "",
		email: "",
		phone: "",
		password: "",
		role: "user",
	};

	let formData = { ...init };

	// Function to redirect to subdomain URL
	function redirectToSubdomain(user) {
		try {
			const host = getHost();
			const protocol = window.location.protocol;

			console.log("Current window.location.host:", window.location.host);
			console.log("getHost() result:", host);

			let targetPath = "";
			if (user.role === "super_admin") {
				targetPath = "/superadmin";
			} else if (user.role === "admin") {
				targetPath = "/admin";
			} else {
				targetPath = "/dashboard";
			}

			// If user has a subdomain, redirect to subdomain URL
			if (user.subdomain && host) {
				// Check if we're already on the correct subdomain
				const expectedSubdomainHost = `${user.subdomain}.${host}`;
				const currentHost = window.location.host;

				console.log("Expected subdomain host:", expectedSubdomainHost);
				console.log("Current host:", currentHost);

				if (currentHost !== expectedSubdomainHost) {
					// Store user data in sessionStorage before redirect
					sessionStorage.setItem("user", JSON.stringify(user));

					// Pass user data as URL parameter (base64 encoded)
					const userData = btoa(JSON.stringify(user));
					const subdomainUrl = `${protocol}//${expectedSubdomainHost}${targetPath}?auth=${userData}`;

					console.log("Redirecting to subdomain URL:", subdomainUrl);
					window.location.href = subdomainUrl;
				} else {
					console.log(
						"Already on correct subdomain, using regular navigation"
					);
					goto(targetPath);
				}
			} else {
				// If no subdomain or host detection failed, use regular navigation
				console.log(
					"No subdomain or host detection failed, using regular navigation to:",
					targetPath
				);
				goto(targetPath);
			}
		} catch (error) {
			console.error("Error in redirectToSubdomain:", error);
			// Fallback to regular navigation
			let targetPath = "";
			if (user.role === "super_admin") {
				targetPath = "/superadmin";
			} else if (user.role === "admin") {
				targetPath = "/admin";
			} else {
				targetPath = "/dashboard";
			}
			goto(targetPath);
		}
	}

	// Example: check if logged in (localStorage/session/cookie)
	onMount(() => {
		// Check for logout parameter (from subdomain logout)
		const urlParams = new URLSearchParams(window.location.search);
		const logoutParam = urlParams.get("logout");

		if (logoutParam === "true") {
			// Clear localStorage on main domain
			localStorage.removeItem("user");
			console.log("Logout completed on main domain");

			// Clean up URL by removing logout parameter
			const newUrl = window.location.pathname;
			window.history.replaceState({}, document.title, newUrl);

			return; // Don't redirect, stay on login page
		}

		// Check for auth parameter in URL (from subdomain redirect)
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

				return; // Don't redirect again
			} catch (error) {
				console.error("Error parsing auth parameter:", error);
			}
		}

		// Check localStorage for existing user data
		const userData = localStorage.getItem("user");
		if (userData) {
			const user = JSON.parse(userData);
			redirectToSubdomain(user);
		}
	});

	async function handleSubmit(e) {
		e.preventDefault();
		error = "";
		successMsg = "";
		loading = true;

		try {
			if (isLogin) {
				// First, get the user by email to retrieve the hashed password
				const userRes = await getUsers({
					search: `email:${formData.email}`,
				});
				if (userRes.err) {
					error = "User not found. Please register.";
					loading = false;
					return;
				}
				const existingUser = userRes.result[0];

				// Compare the provided password with the stored hash
				const isPasswordValid = await comparePassword({
					password: formData.password,
					hash: existingUser.password,
				});

				if (!isPasswordValid) {
					error = "Invalid email or password. Please try again.";
					loading = false;
					return;
				}

				// If password is valid, proceed with login using the hashed password
				const loginRes = await loginUser({
					body: {
						email: formData.email,
						password: existingUser.password,
					},
				});

				if (loginRes.err) {
					error = "Invalid email or password. Please try again.";
					loading = false;
					return;
				}

				const user = loginRes.result;
				console.log("User login data:", user);

				// Save login info, e.g. to localStorage
				localStorage.setItem("user", JSON.stringify(user));

				// Redirect to subdomain URL
				redirectToSubdomain(user);
			} else {
				const existingUsers = await getUsers({
					search: `email:${formData.email}`,
				});

				if (existingUsers.err) {
					error = "Error checking existing users. Please try again.";
					loading = false;
					return;
				}

				if (existingUsers.count > 0) {
					error =
						"Email already exists. Please use a different email.";
					loading = false;
					return;
				}

				const otpCode = Math.floor(
					1000 + Math.random() * 9000
				).toString();
				const htmlTemplate = OTPEmailTemplate(otpCode);
				savedOtp = otpCode; // Store OTP code for verification

				const sendEmailRes = await sendEmail({
					sendTo: [{ name: formData.name, email: formData.email }],
					subject: "Your MyAR Verification Code",
					htmlPart: htmlTemplate,
				});

				console.log("sendEmailRes", sendEmailRes);

				successMsg =
					"Verification code sent to your email. Please check your inbox.";
				otpSent = true;
			}
		} catch (err) {
			error = err.message || "Something went wrong";
		}
		loading = false;
	}

	const handleVerifyOtp = async () => {
		if (inputOtp === savedOtp) {
			// Hash the password before saving the user
			const hashedPassword = await hashPassword(formData.password);
			const userDataWithHashedPassword = {
				...formData,
				password: hashedPassword,
			};

			const saveRes = await saveUser(userDataWithHashedPassword);
			console.log("Save user response:", saveRes);

			if (saveRes.err) {
				error = "Error creating account. Please try again.";
			} else {
				// Store user data with ID from response temporarily and redirect to subdomain selection
				const userDataWithId = {
					...userDataWithHashedPassword,
					id: saveRes.result?.id || saveRes.id || saveRes.insertId, // Handle different response structures
				};

				console.log("User data to store:", userDataWithId);

				localStorage.setItem(
					"tempUser",
					JSON.stringify(userDataWithId)
				);
				successMsg =
					"Account created successfully! Redirecting to subdomain selection...";

				setTimeout(() => {
					goto("/subdomain");
				}, 2000);
			}
		} else {
			error = "Invalid OTP. Please try again.";
		}

		if (inputOtp !== savedOtp) {
			setTimeout(() => {
				otpSent = false;
				inputOtp = "";
				successMsg = "";
				isLogin = true;
				formData.password = "";
			}, 2000);
		}
	};
</script>

<div class="auth-container">
	<div class="auth-background">
		<div class="floating-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>
	</div>

	<div class="auth-card">
		<div class="auth-header">
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
				<span class="logo-text">MyAR</span>
			</div>
			<h1 class="auth-title">
				{isLogin ? "Welcome Back" : "Create Account"}
			</h1>
			<p class="auth-subtitle">
				{isLogin
					? "Enter your credentials to access your account"
					: "Join us today and start your journey"}
			</p>
		</div>

		<form on:submit={handleSubmit} class="auth-form">
			{#if otpSent}
				<div class="otp-section">
					<div class="otp-icon">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
								stroke="currentColor"
								stroke-width="2"
							/>
							<polyline
								points="22,6 12,13 2,6"
								stroke="currentColor"
								stroke-width="2"
							/>
						</svg>
					</div>
					<h3 class="otp-title">Check Your Email</h3>
					<p class="otp-subtitle">
						We've sent a verification code to {formData.email}
					</p>

					<div class="form-group">
						<input
							type="text"
							placeholder="Enter 4-digit code"
							bind:value={inputOtp}
							required
							class="form-input otp-input"
							maxlength="4"
						/>
					</div>

					<button
						type="button"
						class="btn btn-primary"
						on:click={handleVerifyOtp}
						disabled={loading}
					>
						{#if loading}
							<div class="btn-spinner"></div>
						{/if}
						Verify Code
					</button>
				</div>
			{:else}
				<div class="form-fields">
					{#if !isLogin}
						<div class="form-group">
							<label for="name" class="form-label"
								>Full Name</label
							>
							<div class="input-wrapper">
								<svg
									class="input-icon"
									viewBox="0 0 24 24"
									fill="none"
								>
									<path
										d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
										stroke="currentColor"
										stroke-width="2"
									/>
									<circle
										cx="12"
										cy="7"
										r="4"
										stroke="currentColor"
										stroke-width="2"
									/>
								</svg>
								<input
									id="name"
									type="text"
									placeholder="Enter your full name"
									bind:value={formData.name}
									required
									class="form-input"
								/>
							</div>
						</div>
					{/if}

					<div class="form-group">
						<label for="email" class="form-label"
							>Email Address</label
						>
						<div class="input-wrapper">
							<svg
								class="input-icon"
								viewBox="0 0 24 24"
								fill="none"
							>
								<path
									d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
									stroke="currentColor"
									stroke-width="2"
								/>
								<polyline
									points="22,6 12,13 2,6"
									stroke="currentColor"
									stroke-width="2"
								/>
							</svg>
							<input
								id="email"
								type="email"
								placeholder="Enter your email"
								bind:value={formData.email}
								required
								class="form-input"
							/>
						</div>
					</div>

					{#if !isLogin}
						<div class="form-group">
							<label for="phone" class="form-label"
								>Phone Number</label
							>
							<div class="input-wrapper">
								<svg
									class="input-icon"
									viewBox="0 0 24 24"
									fill="none"
								>
									<path
										d="M22 16.92V19.92C22 20.52 21.52 21 20.92 21C9.4 21 0 11.6 0 0.08C0 -0.52 0.48 -1 1.08 -1H4.08C4.68 -1 5.16 -0.52 5.16 0.08V3.08C5.16 3.68 4.68 4.16 4.08 4.16H2.08C2.08 11.08 7.92 16.92 14.84 16.92V14.92C14.84 14.32 15.32 13.84 15.92 13.84H18.92C19.52 13.84 20 14.32 20 14.92V16.92Z"
										stroke="currentColor"
										stroke-width="2"
									/>
								</svg>
								<input
									id="phone"
									type="tel"
									placeholder="Enter your phone number"
									bind:value={formData.phone}
									required
									class="form-input"
								/>
							</div>
						</div>
					{/if}

					<div class="form-group">
						<label for="password" class="form-label">Password</label
						>
						<div class="input-wrapper">
							<svg
								class="input-icon"
								viewBox="0 0 24 24"
								fill="none"
							>
								<rect
									x="3"
									y="11"
									width="18"
									height="11"
									rx="2"
									ry="2"
									stroke="currentColor"
									stroke-width="2"
								/>
								<circle
									cx="12"
									cy="16"
									r="1"
									stroke="currentColor"
									stroke-width="2"
								/>
								<path
									d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
									stroke="currentColor"
									stroke-width="2"
								/>
							</svg>
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Enter your password"
								bind:value={formData.password}
								required
								class="form-input"
							/>
							<button
								type="button"
								class="password-toggle"
								on:click={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<svg viewBox="0 0 24 24" fill="none">
										<path
											d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 4.02125 7.65663 6.17 6.06L17.94 17.94Z"
											stroke="currentColor"
											stroke-width="2"
										/>
										<path
											d="M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19L9.9 4.24Z"
											stroke="currentColor"
											stroke-width="2"
										/>
										<line
											x1="1"
											y1="1"
											x2="23"
											y2="23"
											stroke="currentColor"
											stroke-width="2"
										/>
									</svg>
								{:else}
									<svg viewBox="0 0 24 24" fill="none">
										<path
											d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
											stroke="currentColor"
											stroke-width="2"
										/>
										<circle
											cx="12"
											cy="12"
											r="3"
											stroke="currentColor"
											stroke-width="2"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>
				</div>

				{#if error}
					<div class="alert alert-error">
						<svg viewBox="0 0 24 24" fill="none">
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
						<svg viewBox="0 0 24 24" fill="none">
							<path
								d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86"
								stroke="currentColor"
								stroke-width="2"
							/>
							<polyline
								points="22,4 12,14.01 9,11.01"
								stroke="currentColor"
								stroke-width="2"
							/>
						</svg>
						{successMsg}
					</div>
				{/if}

				{#if loading}
					<div class="alert alert-info">
						<div class="spinner"></div>
						Please wait...
					</div>
				{/if}

				<button
					type="submit"
					class="btn btn-primary"
					disabled={loading}
				>
					{#if loading}
						<div class="btn-spinner"></div>
					{/if}
					{isLogin ? "Sign In" : "Create Account"}
				</button>

				<div class="auth-switch">
					<span
						>{isLogin
							? "Don't have an account?"
							: "Already have an account?"}</span
					>
					<button
						type="button"
						class="switch-btn"
						on:click={() => {
							isLogin = !isLogin;
							error = "";
							successMsg = "";
						}}
						disabled={loading}
					>
						{isLogin ? "Sign up" : "Sign in"}
					</button>
				</div>
			{/if}
		</form>
	</div>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem 1rem;
	}

	.auth-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
	}

	.floating-shapes {
		position: absolute;
		width: 100%;
		height: 100%;
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
		top: 10%;
		left: 10%;
		animation-delay: 0s;
	}

	.shape-2 {
		width: 120px;
		height: 120px;
		top: 70%;
		right: 10%;
		animation-delay: 2s;
	}

	.shape-3 {
		width: 60px;
		height: 60px;
		top: 40%;
		left: 80%;
		animation-delay: 4s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-20px) rotate(180deg);
		}
	}

	.auth-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 24px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		padding: 3rem 2.5rem;
		width: 100%;
		max-width: 480px;
		position: relative;
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.logo-icon {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.logo-icon svg {
		width: 24px;
		height: 24px;
	}

	.logo-text {
		font-size: 1.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.auth-title {
		font-size: 2rem;
		font-weight: 700;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.auth-subtitle {
		color: #6b7280;
		font-size: 1rem;
		line-height: 1.5;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		margin-left: 0.25rem;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		width: 20px;
		height: 20px;
		color: #9ca3af;
		z-index: 1;
	}

	.form-input {
		width: 100%;
		padding: 1rem 1rem 1rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: rgba(255, 255, 255, 0.8);
	}

	.form-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		background: rgba(255, 255, 255, 1);
	}

	.form-input::placeholder {
		color: #9ca3af;
	}

	.password-toggle {
		position: absolute;
		right: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 6px;
		transition: background-color 0.2s;
	}

	.password-toggle:hover {
		background-color: #f3f4f6;
	}

	.password-toggle svg {
		width: 20px;
		height: 20px;
		color: #6b7280;
	}

	.otp-section {
		text-align: center;
		padding: 1rem 0;
	}

	.otp-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.otp-icon svg {
		width: 32px;
		height: 32px;
	}

	.otp-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.otp-subtitle {
		color: #6b7280;
		margin-bottom: 2rem;
		font-size: 0.95rem;
	}

	.otp-input {
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: 0.5rem;
		padding-left: 1.5rem !important;
	}

	.btn {
		padding: 1rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1rem;
		border: none;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		position: relative;
		overflow: hidden;
	}

	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.btn-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.alert {
		padding: 1rem;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.alert svg {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.alert-success {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}

	.alert-info {
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #bfdbfe;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #e5e7eb;
		border-top-color: #2563eb;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.auth-switch {
		text-align: center;
		margin-top: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.switch-btn {
		background: none;
		border: none;
		color: #667eea;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		margin-left: 0.5rem;
		transition: color 0.2s;
	}

	.switch-btn:hover:not(:disabled) {
		color: #764ba2;
	}

	.switch-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.auth-container {
			padding: 1rem;
		}

		.auth-card {
			padding: 2rem 1.5rem;
			border-radius: 20px;
		}

		.auth-title {
			font-size: 1.75rem;
		}

		.logo-text {
			font-size: 1.25rem;
		}

		.form-input {
			padding: 0.875rem 0.875rem 0.875rem 2.75rem;
		}

		.btn {
			padding: 0.875rem 1.25rem;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.auth-card {
			background: rgba(31, 41, 55, 0.95);
			border: 1px solid rgba(55, 65, 81, 0.3);
		}

		.auth-title {
			color: #f9fafb;
		}

		.auth-subtitle {
			color: #d1d5db;
		}

		.form-label {
			color: #e5e7eb;
		}

		.form-input {
			background: rgba(55, 65, 81, 0.5);
			border-color: #4b5563;
			color: #f9fafb;
		}

		.form-input:focus {
			background: rgba(55, 65, 81, 0.8);
		}

		.form-input::placeholder {
			color: #9ca3af;
		}

		.password-toggle:hover {
			background-color: #374151;
		}

		.otp-title {
			color: #f9fafb;
		}

		.otp-subtitle {
			color: #d1d5db;
		}

		.auth-switch {
			border-top-color: #4b5563;
			color: #d1d5db;
		}
	}
</style>
