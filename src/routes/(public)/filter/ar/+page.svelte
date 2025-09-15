<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import {
		Camera,
		Import,
		RefreshCcw,
		RefreshCw,
		Share2,
		Sparkles,
		Video,
		Zap,
	} from "@lucide/svelte";
	import { getFiltersByUser } from "../../../../services/actions/filter.js";

	// Base URL for filter images
	const FILTER_BASE_URL =
		"https://uploads.backendservices.in/storage/arodos/rong-digital/filters/";

	let videoRef;
	let canvasRef;
	let overlayCanvasRef; // Canvas for face tracking overlays
	let filterUrl: string | null = null;
	let capturedImg: string | null = null;
	let recordedVideo: string | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let isRecording = false;
	let recordedChunks: Blob[] = [];
	let filterLoadError = false;
	let currentStream: MediaStream | null = null;

	// Filter optimization variables
	let preloadedFilterImage: HTMLImageElement | null = null;
	let isFilterLoading = false;
	let isCapturing = false; // Track capture state for UI feedback

	// Canvas optimization
	let offscreenCanvas: HTMLCanvasElement | null = null;
	let offscreenCtx: CanvasRenderingContext2D | null = null;
	let isPhotoMode = true; // Toggle between photo and video mode
	let currentCamera = "environment"; // 'user' for front camera, 'environment' for back camera
	let showPreview = false; // Show preview after capture
	let isCameraActive = true; // Track camera state
	let showFiltersModal = false; // Show filters modal
	let userFilters = []; // Store user's filters
	let currentUserId = null; // Store current user ID
	let isFlashOn = false; // Track flash state
	let isProcessingVideo = false; // Track video processing state

	// Video recording countdown
	let recordingCountdown = 0; // Countdown timer for video recording
	let countdownInterval: number | null = null; // Store interval ID

	// Face tracking variables
	let faceMesh = null;
	let mediaPipeCamera = null;
	let showAdditionalFiltersModal = false;
	let selectedAdditionalFilter = null;
	let faceDetections = [];
	let animationFrameId = null;
	let isFaceTrackingRunning = false; // ensure only one RAF loop
	let isFaceMeshBusy = false; // prevent concurrent faceMesh.send

	// Pin MediaPipe CDN version to avoid asset mismatches
	const MEDIAPIPE_FACE_MESH_VERSION = "0.4.1633559619";

	// Additional filters available
	const additionalFilters = [
		{
			id: "himachal-cap",
			name: "Himachal Cap",
			image: "/Himachal cap.png",
			type: "cap",
			smoothing: null as any,
			imageElement: null as any,
		},
		// Add more filters here as needed
	];

	// Debug reactive statement
	$: if (showAdditionalFiltersModal) {
		console.log("Additional filters modal should be visible now");
	}

	onMount(async () => {
		// Fire-and-forget filter load so camera doesn't wait on network/image decode
		loadFilter();
		await startCamera();

		// Initialize offscreen canvas for better performance
		initializeOffscreenCanvas();

		// Only initialize face tracking in browser
		if (typeof window !== "undefined") {
			await initializeFaceTracking();
			// Start face tracking after initialization with a delay
			setTimeout(() => {
				if (faceMesh && isCameraActive) {
					startFaceTracking();
					console.log("Face tracking started after initial setup");
				}
			}, 1500);
		}
	});

	// Initialize offscreen canvas for compositing operations
	function initializeOffscreenCanvas() {
		if (typeof window !== "undefined") {
			offscreenCanvas = document.createElement("canvas");
			offscreenCtx = offscreenCanvas.getContext("2d");
			console.log("Offscreen canvas initialized");
		}
	}

	async function loadFilter() {
		try {
			// First, check if filter URL is provided in query parameters
			const filterParam = $page.url.searchParams.get("filter");
			let userParam = $page.url.searchParams.get("user");

			// Handle new URL format: ?filter=filename&userid (without user= prefix)
			if (filterParam && !userParam) {
				// Parse the URL manually to get the second parameter without a key
				const urlParams = window.location.search
					.substring(1)
					.split("&");
				if (urlParams.length >= 2) {
					const secondParam = urlParams[1];
					// If second param doesn't contain '=', it's the user ID
					if (!secondParam.includes("=")) {
						userParam = secondParam;
						console.log(
							"Parsed user ID from new format:",
							userParam
						);
					}
				}
			}

			if (filterParam) {
				// Check if it's a shortened URL (filename only) or full URL
				if (filterParam.startsWith("http")) {
					// Full URL - use as is
					filterUrl = decodeURIComponent(filterParam);
				} else {
					// Shortened URL - reconstruct full URL and add .png if missing
					const filename = filterParam.endsWith(".png")
						? filterParam
						: filterParam + ".png";
					filterUrl = FILTER_BASE_URL + filename;
				}
				console.log("Filter URL:", filterUrl);

				// Pre-load the filter image in background for faster captures
				preloadFilterImage(filterUrl);

				if (userParam) {
					currentUserId = userParam;
					console.log("User ID:", userParam);
				}
				return;
			}
		} catch (error) {
			console.error(
				"Failed to load filter from server, trying localStorage:",
				error
			);
			// Fallback to localStorage
			filterUrl = localStorage.getItem("rongcam_demo_filter");
			if (filterUrl) {
				preloadFilterImage(filterUrl);
			} else {
				filterLoadError = true;
			}
		}

		// If no query param and no exception, try localStorage as a non-error fallback
		if (!filterUrl) {
			const ls = localStorage.getItem("rongcam_demo_filter");
			if (ls) {
				filterUrl = ls;
				preloadFilterImage(filterUrl);
			}
		}
	}

	// Pre-load filter image for faster captures
	// Uses in-memory cache, preconnects to CDN, and decodes image for consistent readiness
	const imageCache: Map<string, HTMLImageElement> = new Map();
	let imageLoadController: AbortController | null = null;

	function ensurePreconnect(resourceUrl: string) {
		try {
			if (typeof document === "undefined") return;
			const a = document.createElement("a");
			a.href = resourceUrl;
			const origin = `${a.protocol}//${a.host}`;
			const existing = document.head.querySelector(
				`link[rel="preconnect"][href="${origin}"]`
			);
			if (!existing) {
				const preconnect = document.createElement("link");
				preconnect.rel = "preconnect";
				preconnect.href = origin;
				preconnect.crossOrigin = "anonymous";
				document.head.appendChild(preconnect);
				// Also add dns-prefetch as a lightweight hint
				const dns = document.createElement("link");
				dns.rel = "dns-prefetch";
				dns.href = origin;
				document.head.appendChild(dns);
			}
		} catch (_) {
			// best-effort only
		}
	}

	async function preloadFilterImage(url: string) {
		if (!url) return;

		try {
			isFilterLoading = true;

			// Reuse from cache if available
			const cached = imageCache.get(url);
			if (cached && cached.complete && cached.naturalWidth > 0) {
				preloadedFilterImage = cached;
				console.log("Filter image served from in-memory cache");
				return;
			}

			// Warm up DNS/TLS for the CDN to reduce latency spikes
			ensurePreconnect(url);

			// Cancel any previous in-flight image load
			try {
				imageLoadController?.abort();
			} catch (_) {}
			imageLoadController =
				typeof AbortController !== "undefined"
					? new AbortController()
					: null;

			const img = new Image();
			img.crossOrigin = "anonymous";
			// Hint the browser to prioritize this fetch and decode off the main thread
			(img as any).fetchPriority = "high";
			img.decoding = "async" as any;

			await new Promise<void>((resolve, reject) => {
				let settled = false;
				img.onload = async () => {
					try {
						// Ensure pixels are decoded before we mark it ready
						if (typeof img.decode === "function") {
							await img.decode().catch(() => {});
						}
						settled = true;
						resolve();
					} catch (e) {
						console.warn("Image decode warning:", e);
						settled = true;
						resolve();
					}
				};
				img.onerror = (error) => {
					if (!settled) reject(error);
				};
				// Kick off request last to avoid any race
				img.src = url;
			});

			imageCache.set(url, img);
			preloadedFilterImage = img;
		} catch (error) {
			console.error("Error preloading filter image:", error);
			preloadedFilterImage = null;
		} finally {
			isFilterLoading = false;
		}
	}

	async function startCamera() {
		try {
			// Stop existing stream if any
			if (currentStream) {
				currentStream.getTracks().forEach((track) => track.stop());
			}

			const constraints = {
				video: {
					facingMode: currentCamera,
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			};

			currentStream =
				await navigator.mediaDevices.getUserMedia(constraints);
			videoRef.srcObject = currentStream;
			await videoRef.play();
			isCameraActive = true;

			// Wait for video metadata to be loaded
			await new Promise((resolve) => {
				if (videoRef.readyState >= 1) {
					resolve(null);
				} else {
					videoRef.addEventListener("loadedmetadata", resolve, {
						once: true,
					});
				}
			});

			// Apply flash state if supported
			await applyFlashState();

			// Only start face tracking if this is the initial camera start (not from switchCamera)
			// switchCamera will handle restarting face tracking with proper settings
		} catch (error) {
			console.error("Error starting camera:", error);
		}
	}

	async function applyFlashState() {
		try {
			if (currentStream) {
				const videoTrack = currentStream.getVideoTracks()[0];
				if (videoTrack) {
					const capabilities = videoTrack.getCapabilities();
					if (capabilities.torch) {
						await videoTrack.applyConstraints({
							advanced: [{ torch: isFlashOn }],
						});
					}
				}
			}
		} catch (error) {
			console.error("Error applying flash state:", error);
		}
	}

	async function toggleFlash() {
		// Change the flash button behavior to show additional filters modal
		console.log("toggleFlash called - showing additional filters modal");
		// Ensure state change happens immediately
		setTimeout(() => {
			showAdditionalFiltersModal = true;
		}, 0);
	}

	// Initialize MediaPipe Face Mesh
	async function initializeFaceTracking() {
		try {
			// Skip face tracking on server side
			if (typeof window === "undefined") return;

			// Dynamically import MediaPipe modules in browser
			const faceMeshModule = await import("@mediapipe/face_mesh");
			const FaceMesh = faceMeshModule.FaceMesh;

			faceMesh = new FaceMesh({
				locateFile: (file) =>
					`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${MEDIAPIPE_FACE_MESH_VERSION}/${file}`,
			});

			faceMesh.setOptions({
				maxNumFaces: 1,
				refineLandmarks: true,
				minDetectionConfidence: 0.8, // Higher confidence for better cap tracking
				minTrackingConfidence: 0.8, // Higher confidence for smoother cap movement
				selfieMode: currentCamera === "user", // Optimize for selfie mode
			});

			faceMesh.onResults(onFaceResults);

			console.log("Face tracking initialized");

			// Start face tracking if camera is already active
			if (
				isCameraActive &&
				videoRef &&
				videoRef.readyState >= 2 &&
				!isFaceTrackingRunning
			) {
				setTimeout(() => {
					startFaceTracking();
					console.log(
						"Face tracking started immediately after initialization"
					);
				}, 500);
			}
		} catch (error) {
			console.error("Error initializing face tracking:", error);
		}
	}

	// Handle face detection results
	function onFaceResults(results) {
		if (!overlayCanvasRef || !videoRef) return;

		const overlayCtx = overlayCanvasRef.getContext("2d");
		const displayWidth = videoRef.clientWidth;
		const displayHeight = videoRef.clientHeight;

		// Set canvas size to match video display
		overlayCanvasRef.width = displayWidth;
		overlayCanvasRef.height = displayHeight;

		// Clear previous drawings
		overlayCtx.clearRect(0, 0, displayWidth, displayHeight);

		if (
			results.multiFaceLandmarks &&
			results.multiFaceLandmarks.length > 0 &&
			selectedAdditionalFilter
		) {
			const landmarks = results.multiFaceLandmarks[0];
			drawAdditionalFilter(
				overlayCtx,
				landmarks,
				displayWidth,
				displayHeight
			);
		}
	}

	// Draw additional filter based on face landmarks with advanced tracking
	function drawAdditionalFilter(ctx, landmarks, width, height) {
		if (!selectedAdditionalFilter) return;

		const filter = additionalFilters.find(
			(f) => f.image === selectedAdditionalFilter
		);
		if (!filter) return;

		// Key facial landmarks for comprehensive cap tracking (MediaPipe face mesh landmarks)
		const forehead = landmarks[10]; // Top of forehead
		const leftTemple = landmarks[234]; // Left temple
		const rightTemple = landmarks[454]; // Right temple
		const noseTip = landmarks[1]; // Nose tip
		const noseRoot = landmarks[9]; // Nose root/bridge
		const chin = landmarks[175]; // Chin
		const leftEye = landmarks[33]; // Left eye outer corner
		const rightEye = landmarks[362]; // Right eye outer corner
		const leftEyeCenter = landmarks[468]; // Left eye center
		const rightEyeCenter = landmarks[473]; // Right eye center
		const leftCheek = landmarks[116]; // Left cheek
		const rightCheek = landmarks[345]; // Right cheek

		// Additional landmarks for better cap fitting
		const topHead = landmarks[10]; // Top of head
		const leftHairline = landmarks[103]; // Left hairline
		const rightHairline = landmarks[332]; // Right hairline
		const leftEarTop = landmarks[234]; // Left ear area
		const rightEarTop = landmarks[454]; // Right ear area
		const centerForehead = landmarks[9]; // Center forehead

		// Calculate improved face pose and dimensions for cap fitting
		const faceCenter = {
			x: (leftTemple.x + rightTemple.x) / 2,
			y: (forehead.y + chin.y) / 2,
		};

		// Calculate face rotation with enhanced accuracy
		const eyeCenter = {
			x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
			y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
		};

		// Enhanced roll calculation (head tilt) using multiple reference points
		const eyeAngle = Math.atan2(
			(rightEyeCenter.y - leftEyeCenter.y) * height,
			(rightEyeCenter.x - leftEyeCenter.x) * width
		);

		// Improve roll calculation using temple points for better accuracy
		const templeAngle = Math.atan2(
			(rightTemple.y - leftTemple.y) * height,
			(rightTemple.x - leftTemple.x) * width
		);

		// Average the angles for more stable rotation
		const avgRollAngle = (eyeAngle + templeAngle) / 2;

		// Enhanced yaw calculation (head turn) using nose and face center
		const noseOffset = noseTip.x - eyeCenter.x;
		const templateFaceWidth = Math.abs(rightTemple.x - leftTemple.x);
		const yawAngle = (noseOffset / templateFaceWidth) * Math.PI * 1.5; // Improved sensitivity

		// Enhanced pitch calculation (head up/down) using forehead and nose
		const foreheadToNoseAngle = Math.atan2(
			(noseTip.y - centerForehead.y) * height,
			Math.abs(noseTip.x - centerForehead.x) * width + 1 // Avoid division by zero
		);
		const pitchAngle = foreheadToNoseAngle * 0.8; // Reduced sensitivity for smoother movement

		// Calculate face size for adaptive cap scaling
		const eyeDistance = Math.sqrt(
			Math.pow((rightEyeCenter.x - leftEyeCenter.x) * width, 2) +
				Math.pow((rightEyeCenter.y - leftEyeCenter.y) * height, 2)
		);

		const faceWidth = Math.abs((rightTemple.x - leftTemple.x) * width);
		const faceHeight = Math.abs((forehead.y - chin.y) * height);

		// Enhanced adaptive scaling system for better cap fitting at all distances
		const baseEyeDistance = 65; // Optimized reference eye distance
		const baseFaceWidth = 180; // Reference face width
		const baseFaceHeight = 240; // Reference face height

		// Multi-metric scaling for more accurate size adaptation
		const eyeScaleFactor = eyeDistance / baseEyeDistance;
		const widthScaleFactor = faceWidth / baseFaceWidth;
		const heightScaleFactor = faceHeight / baseFaceHeight;

		// Weighted average of scaling factors for optimal cap sizing
		const combinedScale =
			eyeScaleFactor * 0.5 +
			widthScaleFactor * 0.3 +
			heightScaleFactor * 0.2;
		const clampedScale = Math.max(0.4, Math.min(2.8, combinedScale)); // Better range for cap fitting

		// Calculate filter dimensions with dynamic scaling
		let filterWidth = 0,
			filterHeight = 0,
			filterX = 0,
			filterY = 0;
		let rotationCenterX = 0,
			rotationCenterY = 0;

		if (filter.type === "cap") {
			// Enhanced cap positioning and sizing for better head fitting

			// Calculate more accurate head measurements
			const headTop = landmarks[10]; // Top of head/forehead
			const headLeft = landmarks[234]; // Left temple
			const headRight = landmarks[454]; // Right temple
			const hairlineLeft = landmarks[103]; // Left hairline
			const hairlineRight = landmarks[332]; // Right hairline
			const foreheadCenter = landmarks[9]; // Center of forehead
			const leftEarArea = landmarks[172]; // Left ear area
			const rightEarArea = landmarks[397]; // Right ear area

			// Calculate head width using multiple reference points for better accuracy
			const templeWidth = Math.abs((headRight.x - headLeft.x) * width);
			const hairlineWidth = Math.abs(
				(hairlineRight.x - hairlineLeft.x) * width
			);
			const earWidth = Math.abs((rightEarArea.x - leftEarArea.x) * width);
			// Stable head width from temples blended slightly with eye-distance
			const eyeToHeadRatio = 2.2; // empirical conversion
			const eyeBasedWidth = eyeDistance * eyeToHeadRatio;
			const headWidth = templeWidth * 0.8 + eyeBasedWidth * 0.2;

			// Calculate actual head height for better proportioning
			const actualHeadHeight = Math.abs(
				(foreheadCenter.y - chin.y) * height
			);

			// Responsive sizing across device classes
			const minDim = Math.min(window.innerWidth, window.innerHeight);
			// Use temple/hairline width as primary base for fitting
			const baseHeadFitWidth = Math.max(templeWidth, hairlineWidth);
			let sizeFactor = 1.22; // conservative, close fit
			if (minDim <= 400) {
				sizeFactor = 1.18; // small phones
			} else if (minDim <= 700) {
				sizeFactor = 1.24; // medium screens
			} else {
				sizeFactor = 1.28; // large screens
			}

			// Base size from head-fit width (adapts with distance)
			filterWidth = baseHeadFitWidth * sizeFactor;
			filterHeight = filterWidth * 0.55; // slightly slimmer cap height

			// Tight clamps around base head width to avoid oversized results
			const minCapWidth = baseHeadFitWidth * 1.1;
			const maxCapWidth = baseHeadFitWidth * 1.45;
			filterWidth = Math.min(
				Math.max(filterWidth, minCapWidth),
				maxCapWidth
			);
			filterHeight = filterWidth * 0.55;

			// Limit per-frame size change to avoid sudden growth/shrink when moving
			if (filter.smoothing && filter.smoothing.width) {
				const prevW = filter.smoothing.width;
				const maxUp = prevW * 1.1; // +10% per frame
				const minDown = prevW * 0.9; // -10% per frame
				filterWidth = Math.min(Math.max(filterWidth, minDown), maxUp);
				filterHeight = filterWidth * 0.55;
			}

			// Position cap to sit on top of head
			const foreheadAdjustment = pitchAngle * 8; // subtle
			const yawAdjustment = yawAngle * 12; // subtle

			// Calculate head center more accurately using multiple points
			const headCenterX =
				(headLeft.x + headRight.x + hairlineLeft.x + hairlineRight.x) /
				4;

			// Use the very top of the head/forehead as reference
			const headTopY = Math.min(
				headTop.y,
				foreheadCenter.y,
				(hairlineLeft.y + hairlineRight.y) / 2
			);

			// Position cap to sit naturally above hairline (slightly higher on bigger screens)
			const baseYOffset = minDim <= 400 ? 0.8 : 0.82;
			const pitchYAdjustment = pitchAngle > 0 ? 0.04 : -0.04;

			filterX = headCenterX * width - filterWidth / 2 + yawAdjustment;
			filterY =
				headTopY * height -
				filterHeight * (baseYOffset + pitchYAdjustment) +
				foreheadAdjustment;

			// Debug log for cap positioning (comment out in production)
			// console.log("Cap positioning:", { headWidth, filterWidth, filterHeight, filterX, filterY });

			// Rotation center at the natural pivot point of the cap
			rotationCenterX = filterX + filterWidth / 2;
			rotationCenterY = filterY + filterHeight * 0.85;
		}

		// Enhanced smoothing for better cap stability
		if (!filter.smoothing) {
			filter.smoothing = {
				x: filterX,
				y: filterY,
				width: filterWidth,
				height: filterHeight,
				rotation: avgRollAngle,
				velocityX: 0,
				velocityY: 0,
				velocityRotation: 0,
			};
		}

		// Advanced smoothing with velocity-based stabilization - optimized for better cap fitting
		const smoothingFactor = 0.4; // Less smoothing for more responsive sizing
		const sizeSmoothingFactor = 0.6; // Even less smoothing for size changes
		const velocityDamping = 0.7; // Less damping for better responsiveness

		// Calculate velocity
		const deltaX = filterX - filter.smoothing.x;
		const deltaY = filterY - filter.smoothing.y;
		const deltaWidth = filterWidth - filter.smoothing.width;
		const deltaHeight = filterHeight - filter.smoothing.height;
		const deltaRotation = avgRollAngle - filter.smoothing.rotation;

		// Update velocity with damping
		filter.smoothing.velocityX =
			filter.smoothing.velocityX * velocityDamping +
			deltaX * (1 - velocityDamping);
		filter.smoothing.velocityY =
			filter.smoothing.velocityY * velocityDamping +
			deltaY * (1 - velocityDamping);
		filter.smoothing.velocityRotation =
			filter.smoothing.velocityRotation * velocityDamping +
			deltaRotation * (1 - velocityDamping);

		// Apply smoothing with velocity compensation
		filter.smoothing.x += filter.smoothing.velocityX * smoothingFactor;
		filter.smoothing.y += filter.smoothing.velocityY * smoothingFactor;

		// Use less smoothing for size to make cap more responsive to distance changes
		filter.smoothing.width =
			filter.smoothing.width * (1 - sizeSmoothingFactor) +
			filterWidth * sizeSmoothingFactor;
		filter.smoothing.height =
			filter.smoothing.height * (1 - sizeSmoothingFactor) +
			filterHeight * sizeSmoothingFactor;
		filter.smoothing.rotation +=
			filter.smoothing.velocityRotation * smoothingFactor;

		// Use smoothed values
		filterX = filter.smoothing.x;
		filterY = filter.smoothing.y;
		filterWidth = filter.smoothing.width;
		filterHeight = filter.smoothing.height;
		const finalRotation = filter.smoothing.rotation;

		// Pre-load the filter image
		if (!filter.imageElement) {
			filter.imageElement = new Image();
			filter.imageElement.crossOrigin = "anonymous";
			filter.imageElement.onload = () => {
				console.log("Filter image loaded:", filter.name);
			};
			filter.imageElement.src = filter.image;
		}

		// Only draw if image is loaded
		if (
			filter.imageElement &&
			filter.imageElement.complete &&
			filter.imageElement.naturalWidth > 0
		) {
			ctx.save();

			// Apply rotation around the filter center for all cameras
			// The overlay canvas will be mirrored via CSS for front camera
			ctx.translate(rotationCenterX, rotationCenterY);
			ctx.rotate(finalRotation);
			ctx.translate(-rotationCenterX, -rotationCenterY);

			// Draw the filter using the same coordinates for both cameras
			ctx.drawImage(
				filter.imageElement,
				filterX,
				filterY,
				filterWidth,
				filterHeight
			);

			ctx.restore();

			// Debug visualization (uncomment to see face landmarks)
			/*
			ctx.save();
			ctx.fillStyle = 'red';
			ctx.strokeStyle = 'blue';
			ctx.lineWidth = 2;
			
			// Draw key landmarks
			const landmarks_to_draw = [forehead, leftTemple, rightTemple, noseTip, chin, leftEye, rightEye];
			landmarks_to_draw.forEach(landmark => {
				ctx.beginPath();
				ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
				ctx.fill();
			});
			
			// Draw face center
			ctx.fillStyle = 'green';
			ctx.beginPath();
			ctx.arc(faceCenter.x * width, faceCenter.y * height, 5, 0, 2 * Math.PI);
			ctx.fill();
			
			ctx.restore();
			*/
		}
	}

	// Start face tracking with optimized performance
	function startFaceTracking() {
		if (!faceMesh || !videoRef || typeof window === "undefined") {
			console.log("Face tracking not ready:", {
				faceMesh: !!faceMesh,
				videoRef: !!videoRef,
				window: typeof window !== "undefined",
			});
			return;
		}

		if (isFaceTrackingRunning) {
			console.log("Face tracking already running, skip start");
			return;
		}
		isFaceTrackingRunning = true;
		console.log("Starting enhanced face tracking...");

		let lastProcessTime = 0;
		const targetFPS = 30; // Target 30 FPS for smooth tracking
		const frameInterval = 1000 / targetFPS;

		const processFrame = async () => {
			const currentTime = performance.now();

			if (
				!isCameraActive ||
				!videoRef ||
				videoRef.videoWidth === 0 ||
				videoRef.readyState < 2
			) {
				if (isCameraActive) {
					animationFrameId = requestAnimationFrame(processFrame);
				}
				return;
			}

			// Throttle processing to maintain consistent FPS
			if (currentTime - lastProcessTime >= frameInterval) {
				try {
					// Only process if we have a selected filter to avoid unnecessary computation
					if (
						selectedAdditionalFilter &&
						faceMesh &&
						!isFaceMeshBusy
					) {
						isFaceMeshBusy = true;
						try {
							await faceMesh.send({ image: videoRef });
						} finally {
							isFaceMeshBusy = false;
						}
					}
				} catch (error) {
					console.error("Error processing frame:", error);
				}

				lastProcessTime = currentTime;
			}

			if (isCameraActive && isFaceTrackingRunning) {
				animationFrameId = requestAnimationFrame(processFrame);
			}
		};

		processFrame();
	}

	// Stop face tracking
	function stopFaceTracking() {
		isFaceTrackingRunning = false;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	function stopCamera() {
		stopFaceTracking(); // Stop face tracking first
		if (currentStream) {
			currentStream.getTracks().forEach((track) => track.stop());
			currentStream = null;
		}
		if (videoRef) {
			videoRef.srcObject = null;
		}
		isCameraActive = false;
	}

	async function switchCamera() {
		// Stop face tracking before switching cameras
		stopFaceTracking();

		currentCamera = currentCamera === "user" ? "environment" : "user";

		// Reset smoothing data for all additional filters since camera orientation changes
		additionalFilters.forEach((filter) => {
			filter.smoothing = null;
		});

		// Update MediaPipe face mesh settings for new camera orientation
		if (faceMesh) {
			faceMesh.setOptions({
				maxNumFaces: 1,
				refineLandmarks: true,
				minDetectionConfidence: 0.8,
				minTrackingConfidence: 0.8,
				selfieMode: currentCamera === "user", // Update selfie mode for new camera
			});
		}

		await startCamera();

		// Restart face tracking after camera is ready with a delay
		setTimeout(() => {
			if (faceMesh && isCameraActive && !isFaceTrackingRunning) {
				startFaceTracking();
				console.log("Face tracking restarted after camera switch");
			}
		}, 1500);
	}

	function toggleMode() {
		isPhotoMode = !isPhotoMode;
		if (isRecording) {
			stopVideoRecording();
		}
	}

	function goBackToCamera() {
		// Clean up video blob URL if it exists
		if (recordedVideo) {
			URL.revokeObjectURL(recordedVideo);
		}

		capturedImg = null;
		recordedVideo = null;
		showPreview = false;
		isProcessingVideo = false; // Reset processing state

		// Reset recording state
		isRecording = false;
		recordedChunks = [];
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
		recordingCountdown = 0;

		startCamera();

		// Restart face tracking after camera is active with a delay
		setTimeout(() => {
			if (faceMesh && isCameraActive) {
				startFaceTracking();
				console.log(
					"Face tracking restarted after going back to camera"
				);
			}
		}, 1500);
	}

	function downloadImage() {
		if (capturedImg) {
			const link = document.createElement("a");
			link.href = capturedImg;
			link.download = `rongcam-photo-${Date.now()}.png`;
			link.click();
		}
	}

	function downloadVideo() {
		if (recordedVideo) {
			const link = document.createElement("a");
			link.href = recordedVideo;
			link.download = `rongcam-video-${Date.now()}.webm`;
			link.click();
		}
	}

	async function capturePhoto() {
		if (isCapturing) return; // Prevent multiple simultaneous captures

		// Add haptic feedback on supported devices for better UX
		if (navigator.vibrate) {
			navigator.vibrate(50); // Short vibration feedback
		}

		try {
			isCapturing = true;

			const ctx = canvasRef.getContext("2d");
			if (!ctx) {
				throw new Error("Canvas context not available");
			}

			// Get the actual video dimensions
			const videoWidth = videoRef.videoWidth;
			const videoHeight = videoRef.videoHeight;
			const displayWidth = videoRef.clientWidth;
			const displayHeight = videoRef.clientHeight;

			// Calculate the scaling and cropping to match object-fit: cover behavior
			const videoAspect = videoWidth / videoHeight;
			const displayAspect = displayWidth / displayHeight;

			let sourceX = 0,
				sourceY = 0,
				sourceWidth = videoWidth,
				sourceHeight = videoHeight;

			if (videoAspect > displayAspect) {
				// Video is wider than display, crop horizontally
				sourceWidth = videoHeight * displayAspect;
				sourceX = (videoWidth - sourceWidth) / 2;
			} else {
				// Video is taller than display, crop vertically
				sourceHeight = videoWidth / displayAspect;
				sourceY = (videoHeight - sourceHeight) / 2;
			}

			// Set canvas to the native cropped video resolution for maximum quality
			// This preserves original camera pixel detail instead of downscaling to display size
			const destWidth = Math.round(sourceWidth);
			const destHeight = Math.round(sourceHeight);
			canvasRef.width = destWidth;
			canvasRef.height = destHeight;

			// Use offscreen canvas for compositing if available (better performance)
			const useOffscreen =
				offscreenCanvas &&
				offscreenCtx &&
				(filterUrl || selectedAdditionalFilter);
			let workingCtx = ctx;
			let workingCanvas = canvasRef;

			if (useOffscreen) {
				offscreenCanvas.width = destWidth;
				offscreenCanvas.height = destHeight;
				workingCtx = offscreenCtx;
				workingCanvas = offscreenCanvas;
			}

			// Only flip the canvas horizontally for front camera to match the mirrored display
			if (currentCamera === "user") {
				workingCtx.scale(-1, 1);
				workingCtx.translate(-destWidth, 0);
			}

			// Draw the cropped video portion that matches what's visible
			workingCtx.drawImage(
				videoRef,
				sourceX,
				sourceY,
				sourceWidth,
				sourceHeight, // Source rectangle (what's visible)
				0,
				0,
				destWidth,
				destHeight // Destination rectangle at native resolution
			);

			console.log("filterUrl:", filterUrl);

			// Use preloaded filter image for instant capture
			if (filterUrl && preloadedFilterImage) {
				try {
					// Reset canvas transform and draw the filter in original orientation
					workingCtx.setTransform(1, 0, 0, 1, 0, 0);
					workingCtx.drawImage(
						preloadedFilterImage,
						0,
						0,
						destWidth,
						destHeight
					);
				} catch (error) {
					console.error("Error drawing preloaded filter:", error);
				}
			} else if (filterUrl && !preloadedFilterImage) {
				// Fallback: Load image on demand (slower but still works)
				console.warn("Filter not preloaded, loading on demand...");
				try {
					const img = new window.Image();
					img.crossOrigin = "anonymous";
					img.src = filterUrl;

					// Wait for the image to load before drawing (this is the slow part)
					await new Promise((resolve, reject) => {
						img.onload = resolve;
						img.onerror = reject;
					});

					// Reset canvas transform and draw the filter in original orientation
					workingCtx.setTransform(1, 0, 0, 1, 0, 0);
					workingCtx.drawImage(img, 0, 0, destWidth, destHeight);
				} catch (error) {
					console.error(
						"Error loading filter image on demand:",
						error
					);
				}
			}

			// Draw the face tracking overlay if it exists
			if (overlayCanvasRef && selectedAdditionalFilter) {
				workingCtx.setTransform(1, 0, 0, 1, 0, 0);
				// Scale overlay (created at display size) up to destination/native size
				// Use high quality smoothing for better visual fidelity
				workingCtx.imageSmoothingEnabled = true;
				workingCtx.imageSmoothingQuality = "high" as any;
				workingCtx.drawImage(
					overlayCanvasRef,
					0,
					0,
					displayWidth,
					displayHeight,
					0,
					0,
					destWidth,
					destHeight
				);
			}

			// If we used offscreen canvas, copy to main canvas
			if (useOffscreen) {
				ctx.clearRect(0, 0, destWidth, destHeight);
				ctx.drawImage(offscreenCanvas, 0, 0);
			}

			// Generate image data URL using lossless PNG to preserve original quality
			const outputFormat = "image/png";
			capturedImg = canvasRef.toDataURL(outputFormat);
			recordedVideo = null;

			console.log(
				`Captured image as ${outputFormat} at ${destWidth}x${destHeight}`
			);

			// Stop camera and show preview
			stopCamera();
			showPreview = true;
		} catch (error) {
			console.error("Error capturing photo:", error);
			// Show user-friendly error message
			alert("Failed to capture photo. Please try again.");
		} finally {
			isCapturing = false;
		}
	}

	async function startVideoRecording() {
		// Check if canvas.captureStream is supported
		const testCanvas = document.createElement("canvas");
		if (typeof testCanvas.captureStream !== "function") {
			alert("Video recording is not supported on this device/browser.");
			return;
		}

		try {
			recordedChunks = [];
			const stream = videoRef.srcObject as MediaStream;

			// Ensure video is playing and ready
			if (videoRef.readyState < 2) {
				console.log("Video not ready, waiting for metadata...");
				await new Promise((resolve) => {
					videoRef.addEventListener("loadedmetadata", resolve, {
						once: true,
					});
				});
			}

			// Get display dimensions for consistent recording
			const displayWidth = videoRef.clientWidth;
			const displayHeight = videoRef.clientHeight;

			console.log(
				"Video dimensions:",
				videoRef.videoWidth,
				"x",
				videoRef.videoHeight
			);
			console.log(
				"Display dimensions:",
				displayWidth,
				"x",
				displayHeight
			);

			// Create a new canvas to composite video with filter
			const recordCanvas = document.createElement("canvas");
			recordCanvas.width = displayWidth;
			recordCanvas.height = displayHeight;
			const recordCtx = recordCanvas.getContext("2d");

			if (!recordCtx) {
				throw new Error("Failed to get canvas context");
			}

			// Get video dimensions for cropping calculation
			const videoWidth = videoRef.videoWidth;
			const videoHeight = videoRef.videoHeight;

			if (videoWidth === 0 || videoHeight === 0) {
				throw new Error("Video dimensions are invalid");
			}

			const videoAspect = videoWidth / videoHeight;
			const displayAspect = displayWidth / displayHeight;

			let sourceX = 0,
				sourceY = 0,
				sourceWidth = videoWidth,
				sourceHeight = videoHeight;

			if (videoAspect > displayAspect) {
				// Video is wider than display, crop horizontally
				sourceWidth = videoHeight * displayAspect;
				sourceX = (videoWidth - sourceWidth) / 2;
			} else {
				// Video is taller than display, crop vertically
				sourceHeight = videoWidth / displayAspect;
				sourceY = (videoHeight - sourceHeight) / 2;
			}

			// Pre-load the filter image if it exists (use cached version if available)
			let filterImage = null;
			if (filterUrl) {
				if (preloadedFilterImage) {
					// Use the preloaded image for instant access
					filterImage = preloadedFilterImage;
					console.log(
						"Using preloaded filter image for video recording"
					);
				} else {
					// Fallback: load on demand
					console.warn(
						"Filter not preloaded, loading for video recording..."
					);
					filterImage = new Image();
					filterImage.crossOrigin = "anonymous";
					filterImage.src = filterUrl;
					await new Promise((resolve) => {
						filterImage.onload = resolve;
						filterImage.onerror = resolve; // Continue even if image fails to load
					});
				}
			}

			// Create a stream from the canvas with mobile-optimized settings
			let canvasStream;
			try {
				// Try different frame rates for better mobile compatibility
				const isMobile =
					/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
						navigator.userAgent
					);
				const frameRate = isMobile ? 15 : 30; // Lower frame rate for mobile

				canvasStream = recordCanvas.captureStream(frameRate);
				console.log(`Canvas stream created with ${frameRate} FPS`);

				// Verify the stream has video tracks
				const videoTracks = canvasStream.getVideoTracks();
				if (videoTracks.length === 0) {
					throw new Error("Canvas stream has no video tracks");
				}
				console.log("Canvas stream video tracks:", videoTracks.length);
			} catch (error) {
				console.error("Failed to create canvas stream:", error);
				// Fallback: try without frame rate specification
				canvasStream = recordCanvas.captureStream();
				console.log("Fallback canvas stream created");
			}

			// Start drawing video + filter to canvas continuously
			const drawFrame = () => {
				if (!isRecording) return;

				try {
					// Ensure video is still playing and has valid dimensions
					if (videoRef.readyState < 2 || videoRef.videoWidth === 0) {
						console.warn("Video not ready for frame capture");
						requestAnimationFrame(drawFrame);
						return;
					}

					// Clear the canvas first
					recordCtx.clearRect(0, 0, displayWidth, displayHeight);

					// Only flip the canvas horizontally for front camera to match the mirrored display
					recordCtx.save();
					if (currentCamera === "user") {
						recordCtx.scale(-1, 1);
						recordCtx.translate(-displayWidth, 0);
					}

					// Draw the cropped video portion that matches what's visible
					recordCtx.drawImage(
						videoRef,
						sourceX,
						sourceY,
						sourceWidth,
						sourceHeight, // Source rectangle (what's visible)
						0,
						0,
						displayWidth,
						displayHeight // Destination rectangle
					);

					recordCtx.restore();

					// Draw filter in original orientation (not flipped)
					if (filterImage && filterImage.complete) {
						recordCtx.drawImage(
							filterImage,
							0,
							0,
							displayWidth,
							displayHeight
						);
					}

					// Draw the face tracking overlay if it exists
					if (overlayCanvasRef && selectedAdditionalFilter) {
						recordCtx.drawImage(
							overlayCanvasRef,
							0,
							0,
							displayWidth,
							displayHeight
						);
					}

					requestAnimationFrame(drawFrame);
				} catch (error) {
					console.error("Error drawing frame:", error);
					// Continue trying to draw frames even if there's an error
					requestAnimationFrame(drawFrame);
				}
			};

			// Configure MediaRecorder with better settings and more compatible format
			let options = {
				videoBitsPerSecond: 1500000, // Lower bitrate for mobile
			};

			// Try different formats in order of preference for better mobile support
			const supportedTypes = [
				"video/webm;codecs=vp8", // Most widely supported
				"video/webm;codecs=vp9",
				"video/webm",
				"video/mp4;codecs=avc1.42E01E", // H.264 Baseline Profile
				"video/mp4;codecs=h264",
				"video/mp4",
			];

			let selectedMimeType = "video/webm"; // Fallback
			for (const type of supportedTypes) {
				if (MediaRecorder.isTypeSupported(type)) {
					selectedMimeType = type;
					break;
				}
			}

			options.mimeType = selectedMimeType;
			console.log("Using MediaRecorder with mimeType:", options.mimeType);
			console.log("MediaRecorder options:", options);

			// Verify canvas stream before creating MediaRecorder
			if (!canvasStream || canvasStream.getVideoTracks().length === 0) {
				throw new Error("Invalid canvas stream for MediaRecorder");
			}

			mediaRecorder = new MediaRecorder(canvasStream, options);
			console.log("MediaRecorder created successfully");

			mediaRecorder.ondataavailable = (event) => {
				console.log("Data available:", event.data?.size || 0, "bytes");
				if (event.data && event.data.size > 0) {
					recordedChunks.push(event.data);
					console.log("Total chunks:", recordedChunks.length);
				} else {
					console.warn("Received empty data chunk");
				}
			};

			mediaRecorder.onstop = () => {
				try {
					if (recordedChunks.length > 0) {
						const blob = new Blob(recordedChunks, {
							type: mediaRecorder.mimeType || "video/webm",
						});

						// Validate blob size before proceeding
						if (blob.size === 0) {
							console.error("Created blob is empty");
							isProcessingVideo = false;
							alert("Failed to record video. Please try again.");
							return;
						}

						// Clean up any existing video URL
						if (recordedVideo) {
							URL.revokeObjectURL(recordedVideo);
						}

						recordedVideo = URL.createObjectURL(blob);
						capturedImg = null; // Clear photo when video is recorded
						console.log(
							"Video recording stopped, blob created:",
							recordedVideo
						);
						console.log("Blob size:", blob.size, "bytes");
						console.log("Blob type:", blob.type);

						// Wait a bit longer on mobile devices for better processing
						const isMobile =
							/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
								navigator.userAgent
							);
						const delay = isMobile ? 300 : 100;

						// Use a timeout to ensure the video blob is fully processed before showing preview
						setTimeout(() => {
							// Validate that the blob URL is still valid before showing preview
							if (recordedVideo) {
								isProcessingVideo = false; // Clear processing state
								// Stop camera and show preview after delay
								stopCamera();
								showPreview = true;
								console.log("Preview shown for recorded video");
							} else {
								console.error("Video blob URL became invalid");
								isProcessingVideo = false;
								alert(
									"Failed to process video. Please try again."
								);
							}
						}, delay);
					} else {
						console.error("No video data recorded");
						isProcessingVideo = false;
						// Show error and don't stop camera
						alert("No video data was recorded. Please try again.");
					}
				} catch (error) {
					console.error("Error creating video blob:", error);
					isProcessingVideo = false;
					// Show error and don't stop camera
					alert("Failed to process video. Please try again.");
				}
			};

			mediaRecorder.onerror = (event) => {
				console.error("MediaRecorder error:", event.error);
				isRecording = false;
				isProcessingVideo = false;
				alert("Recording error occurred. Please try again.");
			};

			mediaRecorder.onstart = () => {
				console.log("MediaRecorder started successfully");
			};

			// Start recording with better mobile support
			isRecording = true;
			recordingCountdown = 15; // Start countdown at 15 seconds

			// Start countdown timer
			countdownInterval = setInterval(() => {
				recordingCountdown--;
				if (recordingCountdown <= 0) {
					if (countdownInterval) {
						clearInterval(countdownInterval);
						countdownInterval = null;
					}
					stopVideoRecording();
				}
			}, 1000);

			// Start drawing frames before starting recorder
			drawFrame();

			// Wait a brief moment to ensure canvas has content before starting recorder
			setTimeout(() => {
				try {
					console.log("Starting MediaRecorder...");
					mediaRecorder.start(100); // Smaller timeslices for better mobile compatibility
					console.log(
						"MediaRecorder started with state:",
						mediaRecorder.state
					);
				} catch (error) {
					console.error("Failed to start MediaRecorder:", error);
					isRecording = false;
					if (countdownInterval) {
						clearInterval(countdownInterval);
						countdownInterval = null;
					}
					alert("Failed to start recording. Please try again.");
				}
			}, 100);
		} catch (error) {
			console.error("Error starting video recording:", error);
		}
	}

	function stopVideoRecording() {
		if (mediaRecorder && isRecording) {
			console.log("Stopping video recording...");
			console.log("Current MediaRecorder state:", mediaRecorder.state);
			console.log("Recorded chunks so far:", recordedChunks.length);

			isRecording = false;
			isProcessingVideo = true; // Show processing state

			// Clear countdown interval
			if (countdownInterval) {
				clearInterval(countdownInterval);
				countdownInterval = null;
			}
			recordingCountdown = 0;

			// Stop the media recorder with proper state checking
			try {
				if (mediaRecorder.state === "recording") {
					console.log("Stopping MediaRecorder...");
					mediaRecorder.stop();
				} else if (mediaRecorder.state === "paused") {
					console.log("Resuming and stopping MediaRecorder...");
					mediaRecorder.resume();
					setTimeout(() => {
						if (mediaRecorder.state === "recording") {
							mediaRecorder.stop();
						}
					}, 100);
				} else {
					console.warn(
						"MediaRecorder is in unexpected state:",
						mediaRecorder.state
					);
					// Force trigger onstop if we have chunks
					if (recordedChunks.length > 0) {
						setTimeout(() => {
							if (mediaRecorder.onstop) {
								mediaRecorder.onstop();
							}
						}, 100);
					} else {
						isProcessingVideo = false;
						alert("No video data was recorded. Please try again.");
					}
				}
			} catch (error) {
				console.error("Error stopping MediaRecorder:", error);
				isProcessingVideo = false;
				alert("Error stopping recording. Please try again.");
			}

			// Stop all tracks in the canvas stream to free up resources
			const canvasStream = mediaRecorder.stream;
			if (canvasStream) {
				canvasStream.getTracks().forEach((track) => {
					console.log("Stopping track:", track.kind, track.label);
					track.stop();
				});
			}
		}
	}

	async function shareContent() {
		console.log("shareContent called");
		console.log("capturedImg:", !!capturedImg);
		console.log("recordedVideo:", !!recordedVideo);

		// Consistent caption across platforms (many apps ignore text when files are attached)
		const CAPTION = "Festive mood: ON 🔥 Can't wait for #ASoBPuja";

		// Best-effort: copy caption to clipboard before invoking share (so users can paste if app ignores it)
		let captionCopied = false;
		const copyCaption = async (text) => {
			try {
				if (navigator.clipboard && window.isSecureContext) {
					await navigator.clipboard.writeText(text);
					return true;
				}
				// Fallback for older iOS/Android
				const textarea = document.createElement("textarea");
				textarea.value = text;
				textarea.setAttribute("readonly", "");
				textarea.style.position = "absolute";
				textarea.style.left = "-9999px";
				document.body.appendChild(textarea);
				textarea.select();
				const ok = document.execCommand("copy");
				document.body.removeChild(textarea);
				return ok;
			} catch (_) {
				return false;
			}
		};

		captionCopied = await copyCaption(CAPTION);

		// Enhanced platform detection with better mobile device recognition
		const ua = navigator.userAgent.toLowerCase();
		const isAndroid =
			/android/.test(ua) || (/mobile/.test(ua) && /android/.test(ua));
		const isIOS =
			/iphone|ipad|ipod/.test(ua) ||
			(/mac/.test(ua) && "ontouchend" in document);
		const isMobile =
			isAndroid ||
			isIOS ||
			/mobile|tablet|phone|android|iphone|ipad|ipod|blackberry|opera mini|iemobile/.test(
				ua
			);
		const isChrome = /chrome/.test(ua) && !/edg/.test(ua);
		const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
		const isFirefox = /firefox/.test(ua);

		// Check file size limits (mobile browsers have different limits)
		const maxFileSize = isMobile ? 25 * 1024 * 1024 : 100 * 1024 * 1024; // 25MB mobile, 100MB desktop

		try {
			if (capturedImg) {
				// Convert data URL to blob
				const response = await fetch(capturedImg);
				const blob = await response.blob();

				// For mobile, ensure proper file format and size
				let finalBlob = blob;
				let fileName = "rongcam-photo.png";

				if (isMobile) {
					// Mobile-specific optimizations
					try {
						// Convert to JPEG for better mobile compatibility if image is large
						if (blob.size > 2 * 1024 * 1024) {
							// If larger than 2MB
							const canvas = document.createElement("canvas");
							const ctx = canvas.getContext("2d");
							const img = new Image();

							await new Promise((resolve, reject) => {
								img.onload = () => {
									// Resize for mobile if needed
									const maxDimension = 1920;
									let { width, height } = img;

									if (
										width > maxDimension ||
										height > maxDimension
									) {
										if (width > height) {
											height =
												(height * maxDimension) / width;
											width = maxDimension;
										} else {
											width =
												(width * maxDimension) / height;
											height = maxDimension;
										}
									}

									canvas.width = width;
									canvas.height = height;
									ctx.drawImage(img, 0, 0, width, height);

									canvas.toBlob(
										(optimizedBlob) => {
											if (optimizedBlob) {
												finalBlob = optimizedBlob;
												fileName = "rongcam-photo.jpg";
											}
											resolve();
										},
										"image/jpeg",
										0.85
									);
								};
								img.onerror = reject;
								img.src = capturedImg;
							});
						}
					} catch (optimizationError) {
						console.log(
							"Image optimization failed, using original:",
							optimizationError
						);
					}
				}

				const file = new File([finalBlob], fileName, {
					type: finalBlob.type,
				});

				// Try Web Share API first, but with mobile-specific handling
				if (
					navigator.share &&
					navigator.canShare &&
					navigator.canShare({ files: [file] })
				) {
					try {
						await navigator.share({
							title: "RongCam AR Photo",
							text: CAPTION,
							files: [file],
						});
						console.log(
							"Successfully shared photo via Web Share API"
						);
						return; // Exit if successful
					} catch (shareError) {
						console.log("Web Share API failed:", shareError);
						// Continue to fallback method
					}
				} else {
					// Fallback: download the image and open WhatsApp
					const link = document.createElement("a");
					link.href = capturedImg;
					link.download = "rongcam-photo.png";
					link.click();

					// Enhanced WhatsApp opening for photos
					setTimeout(() => {
						try {
							if (isMobile) {
								if (isAndroid) {
									// Android: Use intent-based approach
									const whatsappIntentUrl = `intent://send?text=${encodeURIComponent(CAPTION)}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
									try {
										window.location.href =
											whatsappIntentUrl;
									} catch (intentError) {
										window.open(
											`whatsapp://send?text=${encodeURIComponent(CAPTION)}`,
											"_blank"
										);
									}
								} else if (isIOS) {
									// iOS: Use universal link
									window.location.href = `whatsapp://send?text=${encodeURIComponent(CAPTION)}`;
								}

								// Fallback to web version after delay
								setTimeout(() => {
									if (document.hasFocus()) {
										window.open(
											`https://wa.me/?text=${encodeURIComponent(CAPTION)}`,
											"_blank"
										);
									}
								}, 2000);
							} else {
								// Desktop: Direct to web version
								window.open(
									`https://wa.me/?text=${encodeURIComponent(CAPTION)}`,
									"_blank"
								);
							}
						} catch (error) {
							console.log(
								"WhatsApp open failed for photo:",
								error
							);
							// Final fallback
							window.open(
								`https://wa.me/?text=${encodeURIComponent(CAPTION)}`,
								"_blank"
							);
						}
					}, 300);
				}
			} else if (recordedVideo) {
				console.log("Attempting to share video");

				// Convert video blob to proper format for mobile sharing
				const response = await fetch(recordedVideo);
				const originalBlob = await response.blob();
				console.log(
					"Original video blob size:",
					originalBlob.size,
					"type:",
					originalBlob.type
				);

				// Check file size before proceeding
				if (originalBlob.size > maxFileSize) {
					console.warn(
						"Video file too large for sharing:",
						originalBlob.size
					);
					// Force download for large files
					const link = document.createElement("a");
					link.href = recordedVideo;
					link.download = "rongcam-video.webm";
					link.click();

					// Still try to open WhatsApp for manual sharing with improved error handling
					setTimeout(() => {
						try {
							if (isMobile) {
								if (isAndroid) {
									// Android: Use multiple approaches for better reliability
									const whatsappIntentUrl = `intent://send?text=${encodeURIComponent(CAPTION)}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
									const whatsappAppUrl = `whatsapp://send?text=${encodeURIComponent(CAPTION)}`;
									const whatsappWebUrl = `https://wa.me/?text=${encodeURIComponent(CAPTION)}`;

									try {
										window.location.href =
											whatsappIntentUrl;
									} catch (intentError) {
										try {
											window.open(
												whatsappAppUrl,
												"_blank"
											);
										} catch (appError) {
											window.open(
												whatsappWebUrl,
												"_blank"
											);
										}
									}

									// Fallback to web version after delay if needed
									setTimeout(() => {
										if (document.hasFocus()) {
											window.open(
												whatsappWebUrl,
												"_blank"
											);
										}
									}, 1500);
								} else if (isIOS) {
									// iOS: Better universal link handling
									const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(CAPTION)}`;
									const whatsappWebUrl = `https://wa.me/?text=${encodeURIComponent(CAPTION)}`;

									try {
										window.location.href = whatsappUrl;

										// iOS fallback with visibility detection
										setTimeout(() => {
											if (document.hasFocus()) {
												window.open(
													whatsappWebUrl,
													"_blank"
												);
											}
										}, 2000);
									} catch (iosError) {
										window.open(whatsappWebUrl, "_blank");
									}
								}
							} else {
								// Desktop: WhatsApp Web
								window.open(
									`https://web.whatsapp.com/send?text=${encodeURIComponent(CAPTION)}`,
									"_blank"
								);
							}
						} catch (e) {
							console.log("WhatsApp open failed:", e);
							// Final fallback: web version
							try {
								window.open(
									`https://wa.me/?text=${encodeURIComponent(CAPTION)}`,
									"_blank"
								);
							} catch (finalError) {
								console.error(
									"All WhatsApp methods failed:",
									finalError
								);
							}
						}
					}, 500);
					return;
				}

				// Keep original format and MIME type - with mobile optimization
				let fileName = "rongcam-video.webm";
				let mimeType = originalBlob.type || "video/webm";
				let finalBlob = originalBlob;

				// Mobile-specific video handling
				if (isMobile) {
					// For mobile, prefer MP4 format as it's more widely supported
					if (originalBlob.type.includes("webm")) {
						fileName = "rongcam-video.webm";
						mimeType = "video/webm";

						// Note: We keep the original blob but change the filename and mimetype
						// Most mobile apps can handle WebM data with MP4 extension
						finalBlob = new Blob([originalBlob], {
							type: "video/webm",
						});
					} else if (originalBlob.type.includes("webm")) {
						fileName = "rongcam-video.webm";
						mimeType = "video/webm";
					}

					// Ensure file size is mobile-friendly
					if (finalBlob.size > 15 * 1024 * 1024) {
						// 15MB limit for mobile
						console.warn(
							"Video file large for mobile sharing:",
							finalBlob.size
						);
					}
				} else {
					// Desktop: keep original format
					if (originalBlob.type.includes("webm")) {
						fileName = "rongcam-video.webm";
						mimeType = "video/webm";
					} else if (originalBlob.type.includes("webm")) {
						fileName = "rongcam-video.webm";
						mimeType = "video/webm";
					}
				}

				console.log(
					"Final file name:",
					fileName,
					"MIME type:",
					mimeType
				);
				console.log("Final blob size:", finalBlob.size);

				const file = new File([finalBlob], fileName, {
					type: mimeType,
				});

				console.log("File created:", file.name, file.size, file.type);

				// Enhanced sharing logic with mobile-specific handling
				if (navigator.share) {
					console.log("Web Share API is available");

					// Check if device can share files with special mobile handling
					let canShareFiles = false;
					try {
						if (isMobile) {
							// On mobile, be more conservative with file sharing
							canShareFiles =
								navigator.canShare &&
								navigator.canShare({ files: [file] });

							// Additional check for mobile file size limits
							if (canShareFiles && file.size > 10 * 1024 * 1024) {
								// 10MB mobile limit
								console.log(
									"File too large for mobile Web Share API"
								);
								canShareFiles = false;
							}
						} else {
							canShareFiles =
								navigator.canShare &&
								navigator.canShare({ files: [file] });
						}
					} catch (e) {
						console.log("Error checking canShare:", e);
						canShareFiles = false;
					}

					if (canShareFiles) {
						console.log(
							"Device can share files with Web Share API"
						);
						try {
							await navigator.share({
								title: "RongCam AR Video",
								text: CAPTION,
								files: [file],
							});
							console.log(
								"Successfully shared via Web Share API"
							);
							return; // Exit function if sharing was successful
						} catch (shareError) {
							console.log(
								"Share API failed, trying fallbacks:",
								shareError
							);

							// On mobile, if Web Share API fails, skip to download + WhatsApp
							if (isMobile) {
								console.log(
									"Mobile Web Share failed, using download + WhatsApp method"
								);
							}
						}
					} else {
						console.log(
							"Cannot share files with Web Share API - using fallback"
						);
					}
				}

				// Primary fallback: download the video and open WhatsApp
				console.log(
					"Using primary fallback: download + WhatsApp sharing"
				);

				// Download the video first
				const link = document.createElement("a");
				link.href = recordedVideo;
				link.download = fileName;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				// For mobile, try text-only sharing first if available
				if (isMobile && navigator.share) {
					try {
						console.log(
							"Trying mobile text-only share before WhatsApp"
						);
						await navigator.share({
							title: "RongCam AR Video",
							text: `${CAPTION}\n\nVideo downloaded to your device. You can now share it manually through WhatsApp or other apps.`,
						});
						console.log("Text-only share successful");
						return; // Exit if text sharing worked
					} catch (textShareError) {
						console.log(
							"Text-only share failed, proceeding to WhatsApp:",
							textShareError
						);
						// Continue to WhatsApp method
					}
				}

				// Enhanced WhatsApp sharing with better mobile support and error handling
				setTimeout(() => {
					try {
						if (isMobile) {
							if (isAndroid) {
								// Android: Use intent-based approach for better reliability
								console.log(
									"Attempting Android WhatsApp sharing"
								);

								// Try multiple WhatsApp URL schemes for Android
								const whatsappIntentUrl = `intent://send?text=${encodeURIComponent(CAPTION)}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
								const whatsappAppUrl = `whatsapp://send?text=${encodeURIComponent(CAPTION)}`;
								const whatsappWebUrl = `https://wa.me/?text=${encodeURIComponent(CAPTION)}`;

								// First try intent URL (most reliable on Android)
								try {
									window.location.href = whatsappIntentUrl;

									// Fallback to app URL after short delay
									setTimeout(() => {
										try {
											const appWindow = window.open(
												whatsappAppUrl,
												"_blank"
											);

											// If that fails, try web version
											setTimeout(() => {
												if (
													!appWindow ||
													appWindow.closed
												) {
													console.log(
														"WhatsApp app not available, opening web version"
													);
													window.open(
														whatsappWebUrl,
														"_blank"
													);
												}
											}, 1500);
										} catch (e) {
											console.log(
												"App URL failed, trying web version"
											);
											window.open(
												whatsappWebUrl,
												"_blank"
											);
										}
									}, 1000);
								} catch (intentError) {
									console.log(
										"Intent URL failed, trying app URL"
									);
									try {
										window.open(whatsappAppUrl, "_blank");
									} catch (appError) {
										console.log(
											"App URL failed, opening web version"
										);
										window.open(whatsappWebUrl, "_blank");
									}
								}
							} else if (isIOS) {
								// iOS: Use universal links with better error handling
								console.log("Attempting iOS WhatsApp sharing");

								const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(CAPTION)}`;
								const whatsappWebUrl = `https://wa.me/?text=${encodeURIComponent(CAPTION)}`;

								// Try to open WhatsApp app
								try {
									window.location.href = whatsappUrl;

									// Set up fallback mechanism
									let fallbackTriggered = false;
									const fallbackTimer = setTimeout(() => {
										if (
											!fallbackTriggered &&
											document.hasFocus()
										) {
											fallbackTriggered = true;
											console.log(
												"WhatsApp app not available, opening web version"
											);
											window.open(
												whatsappWebUrl,
												"_blank"
											);
										}
									}, 2500);

									// Clear fallback if page loses focus (app opened)
									const visibilityHandler = () => {
										if (
											document.hidden &&
											!fallbackTriggered
										) {
											fallbackTriggered = true;
											clearTimeout(fallbackTimer);
											console.log(
												"WhatsApp app opened successfully"
											);
										}
									};

									document.addEventListener(
										"visibilitychange",
										visibilityHandler,
										{ once: true }
									);

									// Cleanup listener after timeout
									setTimeout(() => {
										document.removeEventListener(
											"visibilitychange",
											visibilityHandler
										);
									}, 3000);
								} catch (iosError) {
									console.log(
										"iOS WhatsApp URL failed, opening web version"
									);
									window.open(whatsappWebUrl, "_blank");
								}
							}
						} else {
							// Desktop: WhatsApp Web
							console.log("Opening WhatsApp Web for desktop");
							window.open(
								`https://web.whatsapp.com/send?text=${encodeURIComponent(CAPTION)}`,
								"_blank"
							);
						}
					} catch (whatsappError) {
						console.error("WhatsApp sharing error:", whatsappError);
						// Final fallback: always try web version
						try {
							console.log("Using final fallback: WhatsApp Web");
							window.open(
								`https://wa.me/?text=${encodeURIComponent(CAPTION)}`,
								"_blank"
							);
						} catch (finalError) {
							console.error(
								"Final WhatsApp fallback failed:",
								finalError
							);
							// Silent fail - file was already downloaded
						}
					}
				}, 800); // Delay to ensure download starts first
			} else {
				console.log("No content available to share");
				alert(
					"No photo or video to share. Please capture something first!"
				);
			}
		} catch (error) {
			console.error("Error sharing:", error);
			// Ultimate fallback: download the file and provide WhatsApp instructions
			try {
				if (capturedImg) {
					const link = document.createElement("a");
					link.href = capturedImg;
					link.download = "rongcam-photo.png";
					link.click();
				} else if (recordedVideo) {
					const response = await fetch(recordedVideo);
					const blob = await response.blob();

					// Determine file name based on blob type
					let fileName = "rongcam-video.webm";
					if (blob.type && blob.type.includes("webm")) {
						fileName = "rongcam-video.webm";
					}

					const link = document.createElement("a");
					link.href = recordedVideo;
					link.download = fileName;
					link.click();
				}
			} catch (downloadError) {
				console.error("Download fallback failed:", downloadError);
			}
		}
	}

	// Function to show all user filters
	async function showUserFilters() {
		if (!currentUserId) {
			alert(
				"User ID not found. Please access this page with a valid user parameter."
			);
			return;
		}

		try {
			const response = await getFiltersByUser({ userId: currentUserId });
			console.log("API Response:", response); // Debug log

			// Handle different response structures
			let filters = null;
			if (response?.result && Array.isArray(response.result)) {
				filters = response.result;
			} else if (
				response?.data?.data &&
				Array.isArray(response.data.data)
			) {
				filters = response.data.data;
			} else if (response?.data && Array.isArray(response.data)) {
				filters = response.data;
			}

			if (filters && filters.length > 0) {
				userFilters = filters;
				showFiltersModal = true;
				console.log("User filters loaded:", userFilters);
				console.log("First filter structure:", userFilters[0]); // Debug: see the actual structure

				// Preload filter images in the background for smoother switching
				preloadUserFilters(filters);
			} else {
				alert("No filters found for this user.");
			}
		} catch (error) {
			console.error("Error fetching user filters:", error);
			alert("Failed to load user filters. Please try again.");
		}
	}

	// Preload user filter images for faster switching
	async function preloadUserFilters(filters) {
		for (const filter of filters) {
			try {
				const imageUrl = getFilterImageUrl(filter);
				if (imageUrl) {
					const img = new Image();
					img.crossOrigin = "anonymous";
					img.src = imageUrl;
					// Don't await - let them load in background
					console.log("Preloading filter:", imageUrl);
				}
			} catch (error) {
				console.error("Error preloading filter:", filter, error);
			}
		}
	}

	// Function to try a specific filter
	async function tryFilter(filter) {
		console.log("Trying filter:", filter); // Debug log
		console.log("Available filter fields:", Object.keys(filter)); // Debug: show all available fields

		// Handle different possible field names for the file URL
		let fileUrl = null;
		let possibleFields = [
			"file_url",
			"filename",
			"image_url",
			"url",
			"image",
			"filter_image",
			"filter_url",
			"path",
			"src",
			"filter_path",
			"file_path",
		];

		// Try to find a valid URL field
		for (let field of possibleFields) {
			if (filter[field]) {
				fileUrl = filter[field];
				console.log(`Found URL in field '${field}':`, fileUrl);
				break;
			}
		}

		// If no URL found in expected fields, log all fields for debugging
		if (!fileUrl) {
			console.log(
				"No URL found in expected fields. All filter data:",
				filter
			);
			alert(
				`No image URL found. Available fields: ${Object.keys(filter).join(", ")}`
			);
			return;
		}

		// Update the current filter URL
		if (fileUrl.startsWith("http")) {
			filterUrl = fileUrl;
		} else {
			filterUrl = FILTER_BASE_URL + fileUrl;
		}

		console.log("New filter URL:", filterUrl); // Debug log

		// Preload the new filter image for instant captures
		await preloadFilterImage(filterUrl);

		// Close the modal
		showFiltersModal = false;

		// Go back to camera mode to try the new filter
		goBackToCamera();
	}

	// Function to close filters modal
	function closeFiltersModal() {
		showFiltersModal = false;
	}

	// Function to close additional filters modal
	function closeAdditionalFiltersModal() {
		console.log("closeAdditionalFiltersModal called");
		showAdditionalFiltersModal = false;
	}

	// Function to select an additional filter
	function selectAdditionalFilter(filterImage) {
		console.log("selectAdditionalFilter called with:", filterImage);
		selectedAdditionalFilter = filterImage;
		showAdditionalFiltersModal = false;

		// Reset smoothing for the new filter
		const filter = additionalFilters.find((f) => f.image === filterImage);
		if (filter && filter.smoothing) {
			delete filter.smoothing;
		}

		// Clear any existing filter smoothing
		additionalFilters.forEach((f) => {
			if (f.smoothing) {
				delete f.smoothing;
			}
		});

		// Ensure face tracking is running without spawning duplicate loops
		if (faceMesh && isCameraActive && !isFaceTrackingRunning) {
			startFaceTracking();
			console.log("Face tracking started for new filter");
		}

		console.log("Selected additional filter:", filterImage);
	}

	// Function to remove additional filter
	function removeAdditionalFilter() {
		selectedAdditionalFilter = null;
		// Clear the overlay canvas
		if (overlayCanvasRef) {
			const ctx = overlayCanvasRef.getContext("2d");
			ctx.clearRect(
				0,
				0,
				overlayCanvasRef.width,
				overlayCanvasRef.height
			);
		}
	}

	// Cleanup when leaving the page/component
	onDestroy(() => {
		try {
			stopFaceTracking();
			stopCamera();
			if (faceMesh && typeof faceMesh.close === "function") {
				faceMesh.close();
			}
		} catch (err) {
			console.warn("Error during cleanup:", err);
		} finally {
			faceMesh = null;
		}
	});

	// Helper function to get filter image URL
	function getFilterImageUrl(filter) {
		const possibleFields = [
			"file_url",
			"filename",
			"image_url",
			"url",
			"image",
			"filter_image",
			"filter_url",
			"path",
			"src",
			"filter_path",
			"file_path",
		];

		for (let field of possibleFields) {
			if (filter[field]) {
				const url = filter[field];
				return url.startsWith("http") ? url : FILTER_BASE_URL + url;
			}
		}
		return null;
	}

	// Helper function to get filter name
	function getFilterName(filter) {
		return (
			filter.name ||
			filter.filter_name ||
			filter.title ||
			filter.filename ||
			`Filter ${filter.id}`
		);
	}

	// Handle image loading errors
	function handleImageError(event, filter) {
		console.log("Image failed to load for filter:", filter);
		event.target.style.display = "none";
		const nextElement = event.target.nextElementSibling;
		if (nextElement) {
			nextElement.style.display = "flex";
		}
	}
</script>

<svelte:head>
	<title>RongCam AR - Professional AR Camera Experience</title>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, user-scalable=no"
	/>
</svelte:head>

<div class="app-container">
	{#if filterLoadError}
		<div class="error-section">
			<div class="error-container">
				<div class="error-icon">⚠️</div>
				<div class="error-content">
					<h3 class="error-title">No AR Filter Found</h3>
					<p class="error-text">
						No AR filter has been uploaded yet. Please go to the
						admin panel to upload a filter first.
					</p>
					<a href="/admin" class="admin-link">
						<span class="link-icon">⚙️</span>
						Go to Admin Panel
					</a>
				</div>
			</div>
		</div>
	{:else if showPreview}
		<!-- Preview Mode -->
		<div class="preview-fullscreen">
			<div class="preview-header">
				<button class="back-btn" on:click={goBackToCamera}>
					<span class="back-icon">←</span>
				</button>
				<h2 class="preview-title">
					<!-- {#if capturedImg}<Camera /> Photo{:else}<Video /> Video{/if} -->
				</h2>
				<div></div>
				<!-- Spacer for centering -->
			</div>

			<div class="preview-content">
				{#if capturedImg}
					<img
						src={capturedImg}
						class="preview-media"
						alt="Captured photo"
					/>
				{:else if recordedVideo}
					<video
						src={recordedVideo}
						class="preview-media"
						controls
						muted
						playsinline
						disablePictureInPicture
						controlsList="nofullscreen noremoteplayback"
						on:loadeddata={() =>
							console.log("Video loaded successfully")}
						on:error={(e) => {
							console.error("Video load error:", e);
							alert(
								"Failed to load video preview. The video was recorded but cannot be displayed."
							);
						}}
					>
						<track
							kind="captions"
							src=""
							label="No captions available"
							default
						/>
					</video>
				{/if}
			</div>

			<div class="preview-actions">
				<button
					class="action-btn save-btn"
					on:click={() =>
						capturedImg ? downloadImage() : downloadVideo()}
				>
					<span class="btn-icon"
						><img src="/Save.svg" alt="Download" /></span
					>
					<span class="btn-text">Save</span>
				</button>
				<button class="action-btn share-btn" on:click={shareContent}>
					<span class="btn-icon"
						><img src="/Share.svg" alt="Share" /></span
					>
					<span class="btn-text">Share</span>
				</button>
				<button
					class="action-btn filters-btn"
					on:click={showUserFilters}
				>
					<span class="btn-icon"
						><img src="/filter.svg" alt="Filters" /></span
					>
					<span class="btn-text">Filters</span>
				</button>
				<button class="action-btn retake-btn" on:click={goBackToCamera}>
					<span class="btn-icon"
						><img src="/Retake.svg" alt="Retake" /></span
					>
					<span class="btn-text">Retake</span>
				</button>
			</div>
		</div>
	{:else}
		<!-- Camera Mode -->
		<div class="camera-fullscreen">
			<!-- Top Controls -->
			<!-- <div class="top-controls">
				<div></div>
				<div class="mode-toggle"> -->
			<!-- <button
						class="mode-btn {isPhotoMode ? 'active' : ''}"
						on:click={() => toggleMode()}
						disabled={isRecording}
					>
						PHOTO
					</button> -->
			<!-- <button
						class="mode-btn {!isPhotoMode ? 'active' : ''}"
						on:click={() => toggleMode()}
						disabled={isRecording}
					>
						VIDEO
					</button> -->
			<!-- </div>
				<button
					class="control-btn close-btn"
					on:click={() => window.history.back()}
					on:touchstart={() => window.history.back()}
				>
					<span class="control-icon">✕</span>
				</button>
			</div> -->

			<!-- Camera View -->
			<div class="camera-view">
				<video
					bind:this={videoRef}
					autoplay
					playsinline
					class="video-stream {currentCamera === 'user'
						? 'mirrored'
						: ''}"
				></video>
				{#if filterUrl}
					<img
						src={filterUrl}
						class="ar-filter-overlay"
						alt="AR Filter"
					/>
				{/if}
				<!-- Face tracking overlay canvas for additional filters -->
				<canvas
					bind:this={overlayCanvasRef}
					class="face-tracking-overlay {currentCamera === 'user'
						? 'mirrored'
						: ''}"
				></canvas>
				<canvas bind:this={canvasRef} class="capture-canvas"></canvas>

				<!-- Recording Indicator -->
				{#if isRecording}
					<div class="recording-indicator">
						<div class="recording-dot"></div>
						<span class="recording-text"
							>REC {recordingCountdown}s</span
						>
					</div>
				{/if}

				<!-- Filter Loading Indicator -->
				{#if isFilterLoading}
					<div class="filter-loading-indicator">
						<div class="loading-spinner"></div>
						<span class="loading-text">Loading Filter...</span>
					</div>
				{/if}

				<!-- Video Processing Indicator -->
				{#if isProcessingVideo}
					<div class="filter-loading-indicator">
						<div class="loading-spinner"></div>
						<span class="loading-text">Processing Video...</span>
					</div>
				{/if}
			</div>

			<!-- Bottom Controls -->
			<div class="bottom-controls">
				<div class="capture-controls">
					<!-- Switch Camera Button -->
					<button
						class="control-btn switch-camera-btn"
						on:click={switchCamera}
						disabled={isRecording}
					>
						<RefreshCw />
					</button>

					<!-- Main Capture Button -->
					{#if isPhotoMode}
						<button
							class="capture-button photo-capture {isCapturing
								? 'capturing'
								: ''}"
							on:click={capturePhoto}
							disabled={isRecording ||
								isCapturing ||
								isFilterLoading}
						>
							<div class="capture-ring">
								<div
									class="capture-inner {isCapturing
										? 'capturing'
										: ''}"
								>
									{#if isCapturing}
										<div class="capture-spinner"></div>
									{/if}
								</div>
							</div>
						</button>
					{:else if !isRecording}
						<button
							class="capture-button video-capture"
							on:click={startVideoRecording}
							disabled={isFilterLoading || isProcessingVideo}
							aria-label="Start video recording"
						>
							<div class="capture-ring video-ring">
								<div class="capture-inner video-inner"></div>
							</div>
						</button>
					{:else}
						<button
							class="capture-button stop-capture"
							on:click={stopVideoRecording}
							aria-label="Stop video recording"
						>
							<div class="capture-ring stop-ring">
								<div class="capture-inner stop-inner"></div>
							</div>
						</button>
					{/if}

					<!-- Flash Button -->
					<button
						class="control-btn flash-btn {isFlashOn
							? 'flash-active'
							: ''}"
						on:click={toggleFlash}
						on:touchstart|stopPropagation={toggleFlash}
						disabled={isRecording}
						aria-label={isFlashOn
							? "Turn off flash"
							: "Turn on flash"}
					>
						<Sparkles />
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Filters Modal -->
{#if showFiltersModal}
	<div class="filters-modal-overlay" on:click={closeFiltersModal}>
		<div class="filters-modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>My Filters</h3>
				<button class="close-modal-btn" on:click={closeFiltersModal}>
					<span>✕</span>
				</button>
			</div>
			<div class="modal-content">
				{#if userFilters.length > 0}
					<div class="filters-grid">
						{#each userFilters as filter}
							<div class="filter-item">
								<div class="filter-preview">
									{#if getFilterImageUrl(filter)}
										<img
											src={getFilterImageUrl(filter)}
											alt={getFilterName(filter)}
											class="filter-image"
											on:error={(e) =>
												handleImageError(e, filter)}
										/>
									{:else}
										<div class="filter-placeholder">
											<span>No Image</span>
										</div>
									{/if}
								</div>
								<div class="filter-info">
									<h4 class="filter-name">
										{getFilterName(filter)}
									</h4>
									<button
										class="try-filter-btn"
										on:click={() => tryFilter(filter)}
									>
										<span class="btn-text">Try</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-filters">
						<p>No filters found for this user.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Additional Filters Modal (Face Tracking Filters) -->
{#if showAdditionalFiltersModal}
	<div
		class="filters-modal-overlay"
		on:click={closeAdditionalFiltersModal}
		on:touchstart={closeAdditionalFiltersModal}
		role="button"
		tabindex="0"
		on:keydown={(e) => {
			if (e.key === "Escape") {
				closeAdditionalFiltersModal();
			}
		}}
	>
		<div
			class="filters-modal"
			on:click|stopPropagation
			on:touchstart|stopPropagation
			role="dialog"
			tabindex="-1"
		>
			<div class="modal-header">
				<h3>AI Filters</h3>
				<button
					class="close-modal-btn"
					on:click={closeAdditionalFiltersModal}
					on:touchstart|stopPropagation={closeAdditionalFiltersModal}
					aria-label="Close additional filters modal"
				>
					<span>✕</span>
				</button>
			</div>
			<div class="modal-content">
				<div class="filters-grid">
					<!-- Remove filter option -->
					<div class="filter-item">
						<button
							class="filter-btn"
							on:click={removeAdditionalFilter}
							on:touchstart|stopPropagation={removeAdditionalFilter}
							class:active={!selectedAdditionalFilter}
							aria-label="Remove additional filter"
						>
							<div class="filter-preview no-filter">
								<span>None</span>
							</div>
							<div class="filter-info">
								<h4 class="filter-name">No Filter</h4>
							</div>
						</button>
					</div>

					<!-- Additional filters -->
					<!-- {#each additionalFilters as filter}
						<div class="filter-item">
							<button
								class="filter-btn"
								on:click={() =>
									selectAdditionalFilter(filter.image)}
								on:touchstart|stopPropagation={() =>
									selectAdditionalFilter(filter.image)}
								class:active={selectedAdditionalFilter ===
									filter.image}
								aria-label={`Apply ${filter.name} filter`}
							>
								<div class="filter-preview">
									<img
										src={filter.image}
										alt={filter.name}
										class="filter-image"
										on:error={(e) =>
											(e.target.style.display = "none")}
									/>
								</div>
								<div class="filter-info">
									<h4 class="filter-name">{filter.name}</h4>
								</div>
							</button>
						</div>
					{/each} -->
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
			"Helvetica Neue", Arial, sans-serif;
		background: #000;
		min-height: 100dvh;
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	.app-container {
		width: 100vw;
		height: 100dvh;
		position: fixed;
		top: 0;
		left: 0;
		background: #000;
		overflow: hidden;
	}

	/* Error Section */
	.error-section {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.error-container {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border-radius: 20px;
		padding: 2rem;
		margin: 1rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.2);
		text-align: center;
		max-width: 400px;
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-title {
		color: white;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
	}

	.error-text {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		line-height: 1.5;
		margin: 0 0 1.5rem 0;
	}

	.admin-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #4ecdc4, #44a08d);
		color: white;
		text-decoration: none;
		border-radius: 25px;
		padding: 0.8rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		box-shadow: 0 10px 20px rgba(68, 160, 141, 0.3);
		transition: all 0.3s ease;
	}

	.admin-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 15px 30px rgba(68, 160, 141, 0.4);
	}

	.link-icon {
		font-size: 1.2rem;
	}

	/* Camera Fullscreen */
	.camera-fullscreen {
		width: 100%;
		height: 100%;
		position: relative;
		background: #000;
		display: flex;
		flex-direction: column;
	}

	.top-controls {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 20;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: env(safe-area-inset-top, 20px) 20px 20px 20px;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
	}

	.control-btn {
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 22px;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.control-btn:active {
		transform: scale(0.95);
		background: rgba(0, 0, 0, 0.7);
	}

	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.control-icon {
		font-size: 18px;
	}

	.mode-toggle {
		display: flex;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		padding: 4px;
	}

	.mode-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 16px;
		background: transparent;
		color: rgba(255, 255, 255, 0.7);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
	}

	.mode-btn.active {
		background: white;
		color: #000;
	}

	.mode-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Camera View */
	.camera-view {
		flex: 1;
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.video-stream {
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: #000;
	}

	.video-stream.mirrored {
		transform: scaleX(-1);
	}

	.ar-filter-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
		z-index: 10;
	}

	.face-tracking-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 15; /* Above the main AR filter */
	}

	.capture-canvas {
		display: none;
	}

	.recording-indicator {
		position: absolute;
		top: env(safe-area-inset-top, 20px);
		top: calc(env(safe-area-inset-top, 20px) + 80px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 0, 0, 0.9);
		color: white;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		animation: pulse 2s infinite;
	}

	.filter-loading-indicator {
		position: absolute;
		top: calc(env(safe-area-inset-top, 20px) + 120px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(76, 175, 80, 0.9);
		color: white;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		backdrop-filter: blur(10px);
	}

	.loading-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.recording-dot {
		width: 8px;
		height: 8px;
		background: white;
		border-radius: 50%;
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0.3;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	/* Bottom Controls */
	.bottom-controls {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 20;
		padding: 20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px) 20px;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
	}

	.capture-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 400px;
		margin: 0 auto;
	}

	.flash-btn {
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 22px;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		user-select: none;
	}

	.flash-btn:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.3);
	}

	.flash-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.flash-btn.flash-active {
		background: rgba(255, 215, 0, 0.8);
		color: #000;
		box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
	}

	.flash-btn.flash-active:active {
		background: rgba(255, 215, 0, 0.9);
	}

	/* Mobile improvements for flash button */
	@media (max-width: 480px) {
		.flash-btn {
			min-width: 44px;
			min-height: 44px;
		}

		.flash-btn:active {
			background: rgba(255, 255, 255, 0.4);
		}
	}

	/* Capture Button */
	.capture-button {
		width: 80px;
		height: 80px;
		border: none;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.capture-button:active {
		transform: scale(0.95);
	}

	.capture-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.capture-ring {
		width: 65px;
		height: 65px;
		border: 4px solid white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		flex-shrink: 0;
	}

	.capture-inner {
		width: 58px;
		height: 58px;
		background: white;
		border-radius: 50%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	/* Capturing state styles */
	.capture-button.capturing {
		animation: pulse-capture 1s infinite ease-in-out;
	}

	.capture-inner.capturing {
		background: #4caf50;
	}

	.capture-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid white;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes pulse-capture {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.video-ring {
		border-color: #ff3333;
	}

	.video-inner {
		background: #ff3333;
	}

	.stop-ring {
		border-color: #ff3333;
		background: #ff3333;
	}

	.stop-inner {
		width: 24px;
		height: 24px;
		background: white;
		border-radius: 4px;
	}

	/* Preview Fullscreen */
	.preview-fullscreen {
		width: 100%;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		background: #000;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1000;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: env(safe-area-inset-top, 20px) 20px 20px 20px;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		position: relative;
	}

	.back-btn {
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 22px;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.3);
	}

	.back-icon {
		font-size: 20px;
		font-weight: bold;
	}

	.preview-title {
		color: white;
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.preview-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		overflow: hidden;
		min-height: 0;
	}

	.preview-media {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
		object-fit: contain;
	}

	/* Hide only specific video control buttons - keep play/pause/replay */
	.preview-media::-webkit-media-controls-fullscreen-button {
		display: none !important;
	}

	.preview-media::-webkit-media-controls-picture-in-picture-button {
		display: none !important;
	}

	/* Firefox - hide fullscreen button */
	.preview-media::-moz-media-controls
		> :not([class*="play"]):not([class*="volume"]):not(
			[class*="scrubber"]
		):not([class*="time"]) {
		display: none !important;
	}

	/* General video styling */
	video.preview-media {
		outline: none;
	}

	.preview-actions {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 15px;
		padding: 15px 15px calc(env(safe-area-inset-bottom, 15px) + 15px) 15px;
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(10px);
		flex-wrap: nowrap;
		min-height: 80px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: white;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 8px 6px;
		border-radius: 12px;
		min-width: 60px;
		flex: 1;
		max-width: 90px;
	}

	.action-btn:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.1);
	}

	.btn-icon {
		font-size: 20px;
		width: 44px;
		height: 44px;
		border-radius: 22px;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.btn-text {
		font-size: 11px;
		font-weight: 500;
		text-align: center;
		white-space: nowrap;
	}

	.save-btn .btn-icon {
		background: rgba(52, 152, 219, 0.8);
		border-color: rgba(52, 152, 219, 1);
	}

	.share-btn .btn-icon {
		background: rgba(46, 204, 113, 0.8);
		border-color: rgba(46, 204, 113, 1);
	}

	.retake-btn .btn-icon {
		background: rgba(255, 149, 0, 0.8);
		border-color: rgba(255, 149, 0, 1);
	}

	.filters-btn .btn-icon {
		background: rgba(155, 89, 182, 0.8);
		border-color: rgba(155, 89, 182, 1);
	}

	/* Filters Modal Styles */
	.filters-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		touch-action: manipulation;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

	.filters-modal {
		background: #1a1a1a;
		border-radius: 16px;
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transform: translateZ(0);
		will-change: transform;
		z-index: 10000;
		position: relative;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
	}

	.modal-header h3 {
		margin: 0;
		color: white;
		font-size: 18px;
		font-weight: 600;
	}

	.close-modal-btn {
		background: none;
		border: none;
		color: white;
		font-size: 20px;
		cursor: pointer;
		padding: 8px;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s ease;
	}

	.close-modal-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-content {
		padding: 20px;
		overflow-y: auto;
		max-height: calc(80vh - 80px);
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 16px;
	}

	/* Mobile adjustments for filters grid */
	@media (max-width: 480px) {
		.filters-modal-overlay {
			padding: 10px;
			align-items: flex-end;
		}

		.filters-modal {
			max-height: 85vh;
			border-radius: 16px 16px 0 0;
			margin-bottom: 0;
		}

		.modal-content {
			padding: 15px;
			max-height: calc(85vh - 70px);
		}

		.filters-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
			gap: 12px;
		}

		.modal-header {
			padding: 15px;
		}

		.modal-header h3 {
			font-size: 16px;
		}
	}

	/* Very small mobile screens */
	@media (max-width: 360px) {
		.filters-modal-overlay {
			padding: 5px;
		}

		.filters-modal {
			max-height: 90vh;
		}

		.modal-content {
			padding: 12px;
			max-height: calc(90vh - 60px);
		}

		.filters-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
			gap: 10px;
		}

		.modal-header {
			padding: 12px;
		}

		.modal-header h3 {
			font-size: 15px;
		}
	}

	.filter-item {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: transform 0.2s ease;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	.filter-item:hover {
		transform: scale(1.02);
	}

	/* Mobile touch improvements */
	@media (max-width: 480px) {
		.filter-item {
			min-height: 140px;
		}

		.filter-item:active {
			transform: scale(0.98);
			background: rgba(255, 255, 255, 0.08);
		}
	}

	.filter-preview {
		width: 100%;
		height: 120px;
		overflow: hidden;
		background: #000;
		position: relative;
	}

	/* Mobile adjustments for filter preview */
	@media (max-width: 480px) {
		.filter-preview {
			height: 100px;
		}
	}

	@media (max-width: 360px) {
		.filter-preview {
			height: 90px;
		}
	}

	.filter-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.filter-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.6);
		font-size: 12px;
		border: 1px dashed rgba(255, 255, 255, 0.3);
	}

	.filter-info {
		padding: 12px;
	}

	.filter-name {
		margin: 0 0 8px 0;
		color: white;
		font-size: 14px;
		font-weight: 500;
		line-height: 1.2;
		max-height: 2.4em;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.try-filter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		background: #1a8ef1;
		border: 1px solid #1a8ef1;
		color: white;
		border-radius: 8px;
		padding: 8px 12px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.try-filter-btn:hover {
		background: #1576d1;
		transform: scale(1.02);
	}

	.try-filter-btn:active {
		transform: scale(0.98);
	}

	.try-filter-btn .btn-icon {
		font-size: 14px;
		width: auto;
		height: auto;
		background: none;
		border: none;
	}

	.no-filters {
		text-align: center;
		padding: 40px 20px;
		color: rgba(255, 255, 255, 0.6);
	}

	.no-filters p {
		margin: 0;
		font-size: 16px;
	}

	/* Additional Filters Styles */
	.filter-btn {
		width: 100%;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.2s ease;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		user-select: none;
	}

	.filter-btn:hover {
		transform: scale(1.02);
	}

	.filter-btn:active {
		transform: scale(0.98);
	}

	.filter-btn.active {
		border: 2px solid #4ecdc4;
		box-shadow: 0 0 15px rgba(78, 205, 196, 0.3);
	}

	/* Mobile improvements for filter buttons */
	@media (max-width: 480px) {
		.filter-btn {
			min-height: 44px; /* Minimum touch target size */
		}

		.filter-btn:active {
			background: rgba(255, 255, 255, 0.05);
		}
	}

	.no-filter {
		width: 100%;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
		border: 2px dashed rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		touch-action: manipulation;
	}

	/* Mobile adjustments for no-filter */
	@media (max-width: 480px) {
		.no-filter {
			height: 100px;
			font-size: 12px;
		}
	}

	@media (max-width: 360px) {
		.no-filter {
			height: 90px;
			font-size: 11px;
		}
	}

	/* Responsive adjustments for larger screens */
	@media (min-width: 768px) {
		.app-container {
			position: relative;
			width: 100%;
			height: 100dvh;
			display: flex;
			justify-content: center;
			align-items: center;
			background: #1a1a1a;
		}

		.camera-fullscreen,
		.preview-fullscreen {
			max-width: 480px;
			max-height: 100dvh;
			margin: 0 auto;
			border-radius: 20px;
			overflow: hidden;
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
			position: relative;
		}

		.preview-content {
			padding: 20px;
		}

		.preview-actions {
			padding: 20px 20px calc(env(safe-area-inset-bottom, 20px) + 20px)
				20px;
			gap: 20px;
		}

		.action-btn {
			min-width: 80px;
			max-width: 120px;
			padding: 12px 10px;
			gap: 8px;
		}

		.btn-icon {
			width: 48px;
			height: 48px;
			font-size: 22px;
		}

		.btn-text {
			font-size: 12px;
		}

		.error-container {
			max-width: 600px;
		}
	}

	/* Desktop and large tablets */
	@media (min-width: 1024px) {
		.camera-fullscreen,
		.preview-fullscreen {
			max-width: 500px;
		}

		.preview-actions {
			gap: 25px;
			padding: 25px;
		}

		.action-btn {
			min-width: 90px;
			max-width: 140px;
			padding: 15px 12px;
		}

		.btn-icon {
			width: 52px;
			height: 52px;
			font-size: 24px;
		}

		.btn-text {
			font-size: 13px;
		}
	}

	/* Landscape mode adjustments */
	@media (orientation: landscape) and (max-height: 500px) {
		.top-controls {
			padding: 8px 15px;
		}

		.bottom-controls {
			padding: 8px 15px calc(env(safe-area-inset-bottom, 8px) + 8px) 15px;
		}

		.capture-button {
			width: 60px;
			height: 60px;
		}

		.capture-ring {
			width: 50px;
			height: 50px;
		}

		.capture-inner {
			width: 42px;
			height: 42px;
		}

		.stop-inner {
			width: 20px;
			height: 20px;
		}

		.preview-header {
			padding: 8px 15px;
		}

		.preview-content {
			padding: 5px;
		}

		.preview-actions {
			padding: 10px 15px calc(env(safe-area-inset-bottom, 10px) + 10px)
				15px;
			gap: 12px;
			min-height: 70px;
		}

		.btn-icon {
			width: 38px;
			height: 38px;
			font-size: 18px;
		}

		.btn-text {
			font-size: 10px;
		}

		.action-btn {
			min-width: 50px;
			max-width: 80px;
			padding: 6px 4px;
			gap: 4px;
		}
	}

	/* Small screen adjustments */
	@media (max-width: 400px) {
		.preview-actions {
			gap: 8px;
			padding: 12px 8px calc(env(safe-area-inset-bottom, 12px) + 12px) 8px;
			min-height: 75px;
		}

		.btn-icon {
			width: 40px;
			height: 40px;
			font-size: 18px;
		}

		.btn-text {
			font-size: 10px;
		}

		.action-btn {
			min-width: 55px;
			max-width: 75px;
			padding: 6px 3px;
			gap: 5px;
		}

		.preview-content {
			padding: 8px;
		}
	}

	/* Very small screens */
	@media (max-width: 320px) {
		.preview-actions {
			gap: 6px;
			padding: 10px 5px calc(env(safe-area-inset-bottom, 10px) + 10px) 5px;
		}

		.btn-icon {
			width: 36px;
			height: 36px;
			font-size: 16px;
		}

		.btn-text {
			font-size: 9px;
		}

		.action-btn {
			min-width: 50px;
			max-width: 70px;
			padding: 5px 2px;
		}
	}

	/* Large screens with tall aspect ratios */
	@media (min-height: 800px) and (max-width: 480px) {
		.preview-actions {
			padding: 20px 15px calc(env(safe-area-inset-bottom, 20px) + 20px)
				15px;
			gap: 18px;
			min-height: 90px;
		}

		.btn-icon {
			width: 46px;
			height: 46px;
			font-size: 21px;
		}

		.btn-text {
			font-size: 12px;
		}

		.action-btn {
			min-width: 70px;
			max-width: 90px;
			padding: 10px 8px;
			gap: 7px;
		}
	}
</style>
