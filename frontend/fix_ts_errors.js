const fs = require('fs');
let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

// 1. Add accessToken to props definition
content = content.replace(
  /userPin: string \| null;\n\}\) \{/,
  `userPin: string | null;\n  accessToken: string | null;\n}) {`
);

// 2. Destructure accessToken
content = content.replace(
  /  userLon,\n  userPin,\n\}: \{/,
  `  userLon,\n  userPin,\n  accessToken,\n}: {`
);

// 3. Pass accessToken to component
content = content.replace(
  /                  userLon=\{longitude\}\n                  userPin=\{pincode\}\n                \/>/,
  `                  userLon={longitude}\n                  userPin={pincode}\n                  accessToken={accessToken}\n                />`
);

// 4. Fix response: any
content = content.replace(
  /handler: function \(response\) \{/,
  `handler: function (response: any) {`
);

// 5. Fix err: any
content = content.replace(
  /\} catch \(err\) \{/,
  `} catch (err: any) {`
);

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Fixed TypeScript errors');
