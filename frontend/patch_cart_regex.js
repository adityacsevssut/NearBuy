const fs = require('fs');

let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

// 1. Script tag
content = content.replace(
  /import Link from "next\/link";/,
  `import Link from "next/link";\nimport Script from "next/script";`
);
content = content.replace(
  /<div className="min-h-screen bg-\[#f5f5f5\] flex flex-col pt-16 pb-20">/,
  `<div className="min-h-screen bg-[#f5f5f5] flex flex-col pt-16 pb-20">\n      <Script src="https://checkout.razorpay.com/v1/checkout.js" />`
);

// 2. Props
content = content.replace(
  /onPlaceOrder: \(restId: string, orderItems: any\[\], subtotal: number, gst: number, platformFee: number, totalAmount: number\) => void;/,
  `onPlaceOrder: (restId: string, orderItems: any[], subtotal: number, gst: number, platformFee: number, totalAmount: number, razorpayData: any) => void;`
);

// 3. State
content = content.replace(
  /const \[feesPaid, setFeesPaid\] = useState\(false\);/,
  `const [feesPaid, setFeesPaid] = useState(false);\n  const [isPayingTaxes, setIsPayingTaxes] = useState(false);\n  const [razorpayData, setRazorpayData] = useState<any>(null);`
);

// 4. onClick Razorpay button
const payTaxesRegex = /onClick=\{\(\) => \{\s*\/\/ Simulating payment process\s*const loadingToast = toast\.loading\("Processing payment\.\.\."\);\s*setTimeout\(\(\) => \{\s*toast\.success\("Fees paid successfully!", \{ id: loadingToast \}\);\s*setFeesPaid\(true\);\s*\}, 1000\);\s*\}\}/;

const newPayTaxes = `onClick={async () => {
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
                    handler: function (response) {
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
                } catch (err) {
                  toast.error(err.message || "Error initiating Razorpay");
                  setIsPayingTaxes(false);
                }
              }}`;

content = content.replace(payTaxesRegex, newPayTaxes);

// 5. Place Order button call
content = content.replace(
  /onClick=\{\(\) => onPlaceOrder\(restId, restItems, subtotal, calculatedGst, calculatedPlatformFee, totalAmount\)\}/,
  `onClick={() => onPlaceOrder(restId, restItems, subtotal, calculatedGst, calculatedPlatformFee, totalAmount, razorpayData)}`
);

// 6. Signature
content = content.replace(
  /const handlePlaceOrder = async \(restId: string, orderItems: any\[\], subtotal: number, gstAmount: number, platformFeeAmount: number, totalAmount: number\) => \{/,
  `const handlePlaceOrder = async (restId: string, orderItems: any[], subtotal: number, gstAmount: number, platformFeeAmount: number, totalAmount: number, razorpayData: any = null) => {`
);

// 7. Body
const bodyRegex = /cooking_instructions: cookingInstructions,\s*\}\),/;
const newBody = `cooking_instructions: cookingInstructions,\n          ...(razorpayData || {})\n        }),`;
content = content.replace(bodyRegex, newBody);

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Fixed cart page perfectly!');
