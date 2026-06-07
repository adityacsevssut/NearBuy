const fs = require('fs');

let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

const missingBlock = `
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-orange-500/5 mt-4 mb-4">
              <h3 className="font-black text-gray-900 mb-3 text-lg">Payment Method <span className="text-red-500">*</span></h3>
              <div className="space-y-3">
                <label className={\`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all \${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}\`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'cod'} 
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-orange-500 accent-orange-500"
                  />
                  <Wallet className="w-5 h-5 text-gray-700" />
                  <span className="font-bold text-gray-900 text-sm flex-1">Cash on Delivery</span>
                </label>
                
                <label className={\`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all \${paymentMethod === 'online' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}\`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="w-4 h-4 text-orange-500 accent-orange-500"
                  />
                  <Smartphone className="w-5 h-5 text-gray-700" />
                  <span className="font-bold text-gray-900 text-sm flex-1">Online Payment</span>
                </label>
              </div>
            </div>

            {/* Notice about independent delivery */}
            <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
              <Store className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700 font-medium leading-relaxed">
                Each restaurant handles its own delivery. Place separate orders below for each restaurant.
              </p>
            </div>
`;

content = content.replace(
  /                <\/div>\n              <\/div>\n\n            {\/\* Per-restaurant order cards \*\/}/,
  `                </div>\n              </div>${missingBlock}\n            {/* Per-restaurant order cards */}`
);

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Restored Payment Method section properly.');
