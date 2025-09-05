"use client";

import { updateCoupon } from "@/api/message";
import { updateOrder } from "@/api/orders";

enum TOKENS {
  test = "A7X9D2P3QJ",
  live = "L4M8T1Z6WB",
}

const _TOKEN = TOKENS.live; // Change to TOKENS.test for testing
const _BASE_URL = "https://arodos-payments.vercel.app/rzpay/v1";
const _PROJECT = "rong-digital";

const _COMPANY_NAME = "rong.digital";
const _COMPANY_LOGO_URL = "https://rong.digital/logo.png";

interface PaymentData {
  orderId: number;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

export class RazorpayService {
  private paymentData: PaymentData;

  constructor(paymentData: PaymentData) {
    this.paymentData = paymentData;
    console.log(
      "RazorpayService initialized with payment data:",
      this.paymentData
    );
  }

  async verifyPayment(data: any) {
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

  async makePayment({ orderId, amount, currency, rz_key }: any) {
    console.log("makePayment");

    const notes = {
      order_id: this.paymentData.orderId,
      subtotal: `₹${this.paymentData.subtotal.toFixed(0)}`,
      gst: `₹${this.paymentData.tax.toFixed(0)}`,
      total: `₹${this.paymentData.total.toFixed(0)}`,
      items: this.paymentData.items
        .map((item) => `${item.name} (${item.quantity}x)`)
        .join(", "),
      customer_name: this.paymentData.customerName,
      customer_email: this.paymentData.customerEmail,
    };

    const options = {
      key: rz_key,
      amount,
      currency,
      name: _COMPANY_NAME,
      description: `Purchase of ${this.paymentData.items.length} digital product(s)`,
      image: _COMPANY_LOGO_URL,
      order_id: orderId,
      notes,
      handler: async (response: any) => {
        console.log("Payment response:", response);
        const verifyData = {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        };

        try {
          const verificationResult = await this.verifyPayment(verifyData);
          console.log("Payment verification result:", verificationResult);

          if (verificationResult && verificationResult.success) {
            const updateData = {
              id: this.paymentData.orderId,
              payment_status: "success",
              payment_details: {
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
              },
            };

            const updateResponse = await updateOrder(updateData);
            console.log("Order update response:", updateResponse);

            const appliedCoupon = JSON.parse(
              localStorage.getItem("appliedCoupon") || "null"
            );
            if (appliedCoupon?.id && appliedCoupon?.limits > 0) {
              try {
                await updateCoupon({
                  id: appliedCoupon.id,
                  limits: String(Number(appliedCoupon.limits) - 1),
                });
                localStorage.removeItem("appliedCoupon"); // ✅ cleanup
              } catch (error) {
                console.error("Failed to update coupon after payment:", error);
              }
            }

            window.location.href = `/orders?payment_success=true&payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`;
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

    const rzp = new window.Razorpay(options);
    rzp.open();
    rzp.on("payment.failed", (response: any) => {
      console.error("Payment failed:", response);
      alert(`Payment failed: ${response.error.description}`);
    });
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

        try {
          const updatePendingData = {
            id: this.paymentData.orderId,
            payment_status: "pending",
            payment_details: {
              order_id: orderId,
            },
          };

          const updatePendingResponse = await updateOrder(updatePendingData);
          console.log(
            "Initial order update response (pending):",
            updatePendingResponse
          );

          await this.makePayment({ orderId, amount, currency, rz_key });
        } catch (error) {
          console.error("Payment initiation error:", error);
          throw error;
        }
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      throw error;
    }
  }
}
