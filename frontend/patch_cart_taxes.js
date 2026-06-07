const fs = require('fs');

let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

// 1. Add Script import
if (!content.includes('next/script')) {
  content = content.replace(
    /import Link from "next\/link";/,
    `import Link from "next/link";\nimport Script from "next/script";`
  );
  content = content.replace(
    /<div className="min-h-screen bg-\[#f5f5f5\] flex flex-col pt-16 pb-20">/,
    `<div className="min-h-screen bg-[#f5f5f5] flex flex-col pt-16 pb-20">\n      <Script src="https://checkout.razorpay.com/v1/checkout.js" />`
  );
}

// 2. Update RestaurantOrderCard props
content = content.replace(
  /onPlaceOrder: \(restId: string, orderItems: any\[\], subtotal: number, gst: number, platformFee: number, totalAmount: number\) => void;/,
  `onPlaceOrder: (restId: string, orderItems: any[], subtotal: number, gst: number, platformFee: number, totalAmount: number, razorpayData: any) => void;`
);

// 3. Update RestaurantOrderCard state
const oldState = `  const [feesPaid, setFeesPaid] = useState(false);`;
const newState = `  const [feesPaid, setFeesPaid] = useState(false);
  const [isPayingTaxes, setIsPayingTaxes] = useState(false);
  const [razorpayData, setRazorpayData] = useState<any>(null);`;
content = content.replace(oldState, newState);

// 4. Update Pay Taxes button
const oldPayTaxes = `              onClick={() => {
                // Simulating payment process
                const loadingToast = toast.loading("Processing payment...");
                setTimeout(() => {
                  toast.success("Fees paid successfully!", { id: loadingToast });
                  setFeesPaid(true);
                }, 1000);
              }}
              className={\`w-full mt-4 py-3 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 \${
                outOfRange 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-gray-900 text-white hover:bg-black active:scale-[0.98]"
              }\`}`;

const newPayTaxes = `              onClick={async () => {
                if (outOfRange) return;
                setIsPayingTaxes(true);
                const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\\/+$/, "");
                try {
                  const res = await fetch(\`\${API}/api/orders/create-razorpay-order\`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${localStorage.getItem("token") || ""}\` },
                    body: JSON.stringify({ amount: totalFees }),
                  });
                  const rzpOrder = await res.json();
                  if (!res.ok) throw new Error(rzpOrder.error || "Failed to initiate tax payment");

                  const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SyPFlFXJf4zf14",
                    amount: rzpOrder.amount,
                    currency: rzpOrder.currency,
                    name: "NearBuy Platform Fees",
                    description: "Tax and Platform Fees",
                    order_id: rzpOrder.id,
                    handler: function (response: any) {
                      setRazorpayData({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                      });
                      toast.success("Fees paid successfully!");
                      setFeesPaid(true);
                      setIsPayingTaxes(false);
                    },
                    theme: { color: "#f97316" },
                    modal: { ondismiss: function () { setIsPayingTaxes(false); toast.error("Tax payment cancelled"); } }
                  };
                  const rzp = new (window as any).Razorpay(options);
                  rzp.open();
                } catch (err: any) {
                  toast.error(err.message || "Error initiating Razorpay");
                  setIsPayingTaxes(false);
                }
              }}
              className={\`w-full mt-4 py-3 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 \${
                outOfRange || isPayingTaxes
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-gray-900 text-white hover:bg-black active:scale-[0.98]"
              }\`}`;
content = content.replace(oldPayTaxes, newPayTaxes);

// 5. Update the "Place Order" button inside RestaurantOrderCard to pass razorpayData
content = content.replace(
  `onClick={() => onPlaceOrder(restId, restItems, subtotal, calculatedGst, calculatedPlatformFee, totalAmount)}`,
  `onClick={() => onPlaceOrder(restId, restItems, subtotal, calculatedGst, calculatedPlatformFee, totalAmount, razorpayData)}`
);

// 6. Update CartPage handlePlaceOrder signature
content = content.replace(
  `const handlePlaceOrder = async (restId: string, orderItems: any[], subtotal: number, gstAmount: number, platformFeeAmount: number, totalAmount: number) => {`,
  `const handlePlaceOrder = async (restId: string, orderItems: any[], subtotal: number, gstAmount: number, platformFeeAmount: number, totalAmount: number, razorpayData: any = null) => {`
);

// 7. Update CartPage handlePlaceOrder fetch body
const oldBody = `          cooking_instructions: cookingInstructions,
        }),`;
const newBody = `          cooking_instructions: cookingInstructions,
          ...(razorpayData || {})
        }),`;
content = content.replace(oldBody, newBody);

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Successfully patched cart page for Taxes-only Razorpay');
