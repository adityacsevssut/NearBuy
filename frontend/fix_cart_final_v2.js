const fs = require('fs');
let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

// 1. Add accessToken to RestaurantOrderCard type definition
content = content.replace(
  /userPin: string \| null;\n\}\) \{/,
  `userPin: string | null;\n  accessToken: string | null;\n}) {`
);

// 2. Add accessToken to RestaurantOrderCard destructuring
content = content.replace(
  /  userLon,\n  userPin,\n\}: \{/,
  `  userLon,\n  userPin,\n  accessToken,\n}: {`
);

// 3. Update the authorization header
content = content.replace(
  /headers: \{ "Content-Type": "application\/json", "Authorization": \`Bearer \$\{localStorage\.getItem\("token"\) \|\| ""\}\` \},/,
  `headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${accessToken || ""}\` },`
);

// 4. Update the RestaurantOrderCard usage
content = content.replace(
  /                  userLon=\{longitude\}\n                  userPin=\{pincode\}\n                \/>/,
  `                  userLon={longitude}\n                  userPin={pincode}\n                  accessToken={accessToken}\n                />`
);

// 5. Fix response typing
content = content.replace(
  /handler: function \(response\) \{/,
  `handler: function (response: any) {`
);

// 6. Fix err typing
content = content.replace(
  /\} catch \(err\) \{/,
  `} catch (err: any) {`
);

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Cart page successfully patched with typescript fixes and access token!');
