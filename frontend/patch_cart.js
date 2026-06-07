const fs = require('fs');

let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

// 1. Add <Script> tag for Razorpay
if (!content.includes('next/script')) {
  content = content.replace(
    /import Link from "next\/link";/,
    `import Link from "next/link";\nimport Script from "next/script";`
  );
  
  content = content.replace(
    /return \(\n    <div className="min-h-screen/,
    `return (\n    <div className="min-h-screen">\n      <Script src="https://checkout.razorpay.com/v1/checkout.js" />`
  );
  
  // Actually, wait, it might break the div structure if not careful. Let's do it safer.
  content = content.replace(
    /<div className="min-h-screen bg-\[#f5f5f5\] flex flex-col pt-16 pb-20">/,
    `<div className="min-h-screen bg-[#f5f5f5] flex flex-col pt-16 pb-20">\n      <Script src="https://checkout.razorpay.com/v1/checkout.js" />`
  );
}

// 2. Fix the Online Payment button
const oldPaymentOnline = `                <div 
                  onClick={() => toast("This feature will be available soon", { icon: "ℹ️" })}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    disabled
                    className="w-4 h-4 text-gray-300"
                  />
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <span className="font-bold text-gray-500 text-sm flex-1">Online Payment</span>
                  <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Soon</span>
                </div>`;

const newPaymentOnline = `                <label className={\`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all \${paymentMethod === 'online' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}\`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'online'} 
                    onChange={() => setPaymentMethod('online')}
                    className="w-4 h-4 text-orange-500 accent-orange-500"
                  />
                  <Smartphone className="w-5 h-5 text-gray-700" />
                  <span className="font-bold text-gray-900 text-sm flex-1">Online Payment</span>
                </label>`;

if (content.includes('onClick={() => toast("This feature will be available soon"')) {
  content = content.replace(oldPaymentOnline, newPaymentOnline);
}

// 3. Update handlePlaceOrder
const oldHandlePlaceOrder = `  const handlePlaceOrder = async (restId: string, orderItems: any[], subtotal: number, gstAmount: number, platformFeeAmount: number, totalAmount: number) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    
    setIsPlacingOrder(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\\/+$/, "");
    const addressDetails = { locationName, landmark, pincode, latitude, longitude };

    try {
      const res = await fetch(\`\${API}/api/orders\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${accessToken}\`,
        },
        body: JSON.stringify({
          vendor_id: restId,
          items: orderItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.quantity,       // backend expects \`qty\`, cart uses \`quantity\`
            image: item.image ?? "",
            type: item.type,
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            section: item.section,
          })),
          subtotal,
          gst: gstAmount,
          platform_fee: platformFeeAmount,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          delivery_address: addressDetails,
          customer_mobile: customerMobile,
          alternate_mobile: alternateMobile,
          cooking_instructions: cookingInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      toast.success("Order placed! Wait for confirmation.");
      orderItems.forEach(item => removeItem(item.uid));
      router.push("/food/orders");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsPlacingOrder(false);
    }
  };`;

const newHandlePlaceOrder = `  const handlePlaceOrder = async (restId: string, orderItems: any[], subtotal: number, gstAmount: number, platformFeeAmount: number, totalAmount: number) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    
    setIsPlacingOrder(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\\/+$/, "");
    const addressDetails = { locationName, landmark, pincode, latitude, longitude };

    const placeFinalOrder = async (razorpayData = {}) => {
      try {
        const res = await fetch(\`\${API}/api/orders\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: \`Bearer \${accessToken}\`,
          },
          body: JSON.stringify({
            vendor_id: restId,
            items: orderItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              qty: item.quantity,
              image: item.image ?? "",
              type: item.type,
              restaurantId: item.restaurantId,
              restaurantName: item.restaurantName,
              section: item.section,
            })),
            subtotal,
            gst: gstAmount,
            platform_fee: platformFeeAmount,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            delivery_address: addressDetails,
            customer_mobile: customerMobile,
            alternate_mobile: alternateMobile,
            cooking_instructions: cookingInstructions,
            ...razorpayData
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to place order");

        toast.success("Order placed successfully!");
        orderItems.forEach(item => removeItem(item.uid));
        router.push("/food/orders");
      } catch (err: any) {
        toast.error(err.message || "An error occurred");
      } finally {
        setIsPlacingOrder(false);
      }
    };

    if (paymentMethod === "online") {
      try {
        // Create Razorpay Order
        const rzpRes = await fetch(\`\${API}/api/orders/create-razorpay-order\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: \`Bearer \${accessToken}\`,
          },
          body: JSON.stringify({ amount: totalAmount }),
        });
        
        const rzpOrder = await rzpRes.json();
        if (!rzpRes.ok) throw new Error(rzpOrder.error || "Failed to initiate payment");

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_ID",
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "NearBuy Food Delivery",
          description: "Order Payment",
          order_id: rzpOrder.id,
          handler: function (response: any) {
            placeFinalOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          prefill: {
            contact: customerMobile,
          },
          theme: {
            color: "#f97316", // orange-500
          },
          modal: {
            ondismiss: function () {
              setIsPlacingOrder(false);
              toast.error("Payment cancelled");
            }
          }
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        setIsPlacingOrder(false);
        toast.error(err.message || "Error initiating Razorpay");
      }
    } else {
      await placeFinalOrder();
    }
  };`;

if (content.includes('const handlePlaceOrder = async')) {
  content = content.replace(oldHandlePlaceOrder, newHandlePlaceOrder);
}

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Successfully patched src/app/food/cart/page.tsx');
