const fs = require('fs');
let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

// I will use exact string replacements
content = content.replace(
  '  userPin: string | null;\r\n}) {',
  '  userPin: string | null;\r\n  accessToken: string | null;\r\n}) {'
).replace(
  '  userPin: string | null;\n}) {',
  '  userPin: string | null;\n  accessToken: string | null;\n}) {'
);

content = content.replace(
  '  userPin,\r\n}: {',
  '  userPin,\r\n  accessToken,\r\n}: {'
).replace(
  '  userPin,\n}: {',
  '  userPin,\n  accessToken,\n}: {'
);

content = content.replace(
  '                  userPin={pincode}\r\n                />',
  '                  userPin={pincode}\r\n                  accessToken={accessToken}\r\n                />'
).replace(
  '                  userPin={pincode}\n                />',
  '                  userPin={pincode}\n                  accessToken={accessToken}\n                />'
);

content = content.replace(
  'handler: function (response) {',
  'handler: function (response: any) {'
);

content = content.replace(
  '} catch (err) {',
  '} catch (err: any) {'
);

// Fix the auth header from previous patches
content = content.replace(
  'headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token") || ""}` },',
  'headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },'
);

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Fixed cart page without destroying it!');
