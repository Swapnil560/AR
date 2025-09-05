// Razorpay Service for Svelte
import { browser } from "$app/environment";

const TOKENS = {
	test: "A7X9D2P3QJ",
	live: "L4M8T1Z6WB",
};

const _TOKEN = TOKENS.test; // Change to TOKENS.test for testing
const _BASE_URL = "https://arodos-payments.vercel.app/rzpay/v1";
const _PROJECT = "rong-digital";

const _COMPANY_NAME = "rong.digital";
const _COMPANY_LOGO_URL = "https://rong.digital/logo.png";

export class RazorpayService {
	constructor(paymentData, onSuccessCallback = null) {
		this.paymentData = paymentData;
		this.onSuccessCallback = onSuccessCallback;
		console.log("RazorpayService initialized with payment data:", this.paymentData);
	}

	async verifyPayment(data) {
		try {
			const response = await fetch(`${_BASE_URL}/verify`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					data,
					token: _TOKEN,
					project: _PROJECT,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (e) {
			console.error("Verification error:", e);
			throw e;
		}
	}

	async makePayment({ orderId, amount, currency, rz_key }) {
		console.log("makePayment");

		const notes = {
			order_id: this.paymentData.orderId,
			subtotal: `₹${this.paymentData.subtotal.toFixed(0)}`,
			gst: `₹${this.paymentData.tax.toFixed(0)}`,
			total: `₹${this.paymentData.total.toFixed(0)}`,
			items: this.paymentData.items.map(item => `${item.name} (${item.quantity}x)`).join(", "),
			customer_name: this.paymentData.customerName,
			customer_email: this.paymentData.customerEmail,
		};

		const options = {
			key: rz_key,
			amount,
			currency,
			name: _COMPANY_NAME,
			description: `Purchase of ${this.paymentData.items.length} plan subscription`,
			image: _COMPANY_LOGO_URL,
			order_id: orderId,
			notes,
			handler: async response => {
				console.log("Payment response:", response);
				const verifyData = {
					razorpayOrderId: response.razorpay_order_id,
					razorpayPaymentId: response.razorpay_payment_id,
					razorpaySignature: response.razorpay_signature,
				};

				try {
					const verificationResult = await this.verifyPayment(verifyData);

					if (verificationResult && verificationResult.success) {
						// Payment successful
						if (this.onSuccessCallback) {
							try {
								await this.onSuccessCallback({ ...verifyData, isSuccess: true });
							} catch (callbackError) {
								console.error("Success callback error:", callbackError);
							}
						}
						// alert("Payment successful! Your plan has been upgraded.");
						// if (browser) {
						// 	window.location.reload();
						// }
					} else {
						throw new Error("Payment verification failed");
					}
				} catch (error) {
					console.error("Payment verification error:", error);
					alert("Payment verification failed. Please contact support.");
				}
			},
			prefill: {
				name: this.paymentData.customerName,
				email: this.paymentData.customerEmail,
				contact: this.paymentData.customerPhone,
			},
			theme: {
				color: "#3B82F6",
			},
		};

		if (browser && window.Razorpay) {
			const rzp = new window.Razorpay(options);
			rzp.open();
			rzp.on("payment.failed", response => {
				console.error("Payment failed:", response);
				alert(`Payment failed: ${response.error.description}`);
			});
		} else {
			console.error("Razorpay not loaded");
			alert("Payment gateway not available. Please try again later.");
		}
	}

	async createOrder() {
		try {
			const response = await fetch(`${_BASE_URL}/init`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					amount: this.paymentData.total,
					currency: this.paymentData.currency,
					project: _PROJECT,
					token: _TOKEN,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log("Order creation response:", data);

			if (data?.result?.id) {
				const orderId = data.result.id;
				const amount = data.result.amount;
				const currency = data.result.currency;
				const rz_key = data.rz_key;

				await this.makePayment({ orderId, amount, currency, rz_key });
			} else {
				throw new Error("Failed to create order");
			}
		} catch (error) {
			console.error("Order creation error:", error);
			throw error;
		}
	}
}
