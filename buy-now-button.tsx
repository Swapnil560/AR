"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";
import { RazorpayService } from "@/lib/razorpay";
import { toast } from "@/components/toast";
import { postOrder, postOrderItems } from "@/api/orders"; // Adjust the import path as needed
import useIsInternational from "@/lib/useIsInternational";
import { updateCoupon } from "@/api/message";

interface BuyNowButtonProps {
  product: Product;
  licenseType: "standard" | "extended";
  finalPrice: number;
  className?: string;
}

export default function BuyNowButton({
  product,
  finalPrice,
  licenseType,
  className = "",
}: BuyNowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isInternational = useIsInternational();

  // const isInternational = true;

  const handleBuyNow = async () => {
    const isLoggedIn = localStorage.getItem("login") === "true";

    if (!isLoggedIn) {
      toast.error(
        "Please login to continue",
        "You need to be logged in to make a purchase"
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }

    setIsLoading(true);
    toast.info("Processing your order...");

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      const basePrice = isInternational
        ? Math.round(Number(finalPrice) / 86)
        : Number(finalPrice);
      const tax = 0;
      const total = basePrice + tax;

      const orderPayload: any = {
        user_id: currentUser.id,
        amount: total,
        product_details: {
          product_id: product.id,
          product_name: product.name,
          creator: product.creator,
          product_creator: product.user_id,

          finalPrice: finalPrice,
          qty: 1,
        },
      };

      // ✅ Only add payment_status for free products
      if (total === 0) {
        orderPayload.payment_status = "success";
      }
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
          console.error("Failed to update coupon on free order:", error);
        }
      }

      const res = await postOrder(orderPayload);
      console.log("Order response:", res);

      if (res?.err === false && res?.result?.lastInsertID) {
        const orderId = res.result.lastInsertID;

        const productItem = {
          order_id: orderId,
          product_id: Number(product.id),
          product_name: product.name,
          product_creator: product.user_id,
          price: Number(finalPrice),
          customer: currentUser?.id,
        };

        try {
          const itemRes = await postOrderItems(productItem);
          console.log("Item saved to order_items:", itemRes);
        } catch (err) {
          console.error("Failed to save item to order_items:", err);
        }

        if (total === 0) {
          toast.success("Product purchased successfully!");
          setTimeout(() => {
            window.location.href = "/reader";
          }, 1500);
          return;
        }

        // Paid products → Razorpay flow
        const item = {
          ...product,
          quantity: 1,
          licenseType,
        };

        localStorage.setItem(
          "pendingOrder",
          JSON.stringify({
            items: [item],
            total,
            subtotal: basePrice,
            tax,
            timestamp: Date.now(),
            customerEmail: currentUser.email || "",
            customerName: currentUser.name || "",
          })
        );

        const paymentData = {
          orderId,
          amount: total,
          currency: isInternational ? "USD" : "INR",
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          customerPhone: currentUser.phone,
          items: [
            {
              id: Number(product.id),
              name: product.name,
              description: `${product.description} - ${licenseType} License`,
              price: basePrice,
              quantity: 1,
            },
          ],
          subtotal: basePrice,
          tax,
          total,
        };

        const razorpayService = new RazorpayService(paymentData);
        await razorpayService.createOrder();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        "Payment Error",
        error instanceof Error ? error.message : "Failed to process payment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuyNow}
      disabled={isLoading}
      className={`w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Processing...</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-5 h-5" />
          <span>Buy Now</span>
        </>
      )}
    </button>
  );
}

// const handleBuyNow = async () => {
//   console.log("Buy Now clicked for product:", product);
//   // Check if user is logged in
//   const isLoggedIn = localStorage.getItem("login") === "true";

//   if (!isLoggedIn) {
//     toast.error(
//       "Please login to continue",
//       "You need to be logged in to make a purchase"
//     );
//     setTimeout(() => {
//       window.location.href = "/login";
//     }, 2000);
//     return;
//   }

//   setIsLoading(true);
//   toast.info(
//     "Initializing payment",
//     "Please wait while we prepare your payment..."
//   );

//   try {
//     const currentUser = JSON.parse(
//       localStorage.getItem("currentUser") || "{}"
//     );

//     // Calculate price based on license type
//     const basePrice = Number(finalPrice);
//     const price = licenseType === "extended" ? basePrice : basePrice;
//     const tax = price * 0;
//     const total = price + tax;

//     // Create a single item for direct purchase
//     const item = {
//       ...product,
//       quantity: 1,
//       licenseType,
//     };
//     if (!currentUser?.id) {
//       toast.error("User Id Not Found");
//       return;
//     }

//     const body = {
//       user_id: currentUser?.id,
//       amount: total,

//       product_details: {
//         product_id: product.id,
//         product_name: product.name,
//         creator: product.creator,
//         product_creator: product.user_id,
//         finalPrice: finalPrice,
//         // product_owner: product.user_id,
//         qty: 1,
//       },
//       // product_creator: product.user_id,
//     };
//     const res = await postOrder(body);
//     console.log("Order response:", res);
//     if (res?.err === false && res?.result?.lastInsertID) {
//       const orderId = res.result.lastInsertID;

//       // Store order data for post-payment processing
//       localStorage.setItem(
//         "pendingOrder",
//         JSON.stringify({
//           items: [item],
//           total: total,
//           subtotal: price,
//           tax: tax,
//           timestamp: Date.now(),
//           customerEmail: currentUser?.email || "",
//           customerName: currentUser?.name || "",
//         })
//       );

//       // Prepare payment data for Razorpay
//       const paymentData = {
//         orderId: orderId,
//         amount: total,
//         customerId: currentUser?.id,
//         customerName: currentUser?.name,
//         customerEmail: currentUser?.email,
//         customerPhone: currentUser?.phone,
//         items: [
//           {
//             id: Number(product.id),
//             name: product.name,
//             description: `${product.description} - ${licenseType} License`,
//             price: price,
//             quantity: 1,
//           },
//         ],
//         subtotal: price,
//         tax: tax,
//         total: total,
//       };

//       // Create Razorpay service instance
//       const razorpayService = new RazorpayService(paymentData);

//       // Create order and initiate payment
//       await razorpayService.createOrder();
//     }
//   } catch (error) {
//     console.error("Payment error:", error);
//     toast.error(
//       "Payment Error",
//       error instanceof Error ? error.message : "Failed to process payment"
//     );
//   } finally {
//     setIsLoading(false);
//   }
// };
