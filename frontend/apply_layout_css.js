const fs = require('fs');

// 1. Update layout.tsx
let layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf-8');
if (!layoutContent.includes('ThemeProvider')) {
  layoutContent = layoutContent.replace(
    'import { CartProvider } from "@/context/CartContext";',
    'import { CartProvider } from "@/context/CartContext";\nimport { ThemeProvider } from "@/context/ThemeContext";'
  );
  layoutContent = layoutContent.replace(
    '<GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>',
    '<ThemeProvider>\n          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "">'
  );
  layoutContent = layoutContent.replace(
    '</GoogleOAuthProvider>',
    '</GoogleOAuthProvider>\n        </ThemeProvider>'
  );
  fs.writeFileSync('src/app/layout.tsx', layoutContent);
}

// 2. Update globals.css
let cssContent = fs.readFileSync('src/app/globals.css', 'utf-8');
if (!cssContent.includes('.dark {')) {
  const darkCSS = `
@custom-variant dark (&:where(.dark, .dark *));

.dark {
  --background: #0D0D17;
  --foreground: #F9FAFB;

  --nb-surface: #151522;
  --nb-elevated: #1F1F2E;
  --nb-border: #2A2A3A;
  --nb-border-dark: #3F3F5A;

  --nb-text: #F9FAFB;
  --nb-text-secondary: #D1D5DB;
  --nb-muted: #9CA3AF;
  --nb-subtle: #6B7280;
  --nb-placeholder: #4B5563;
}
`;
  cssContent = cssContent.replace(
    ':root {',
    `${darkCSS}\n:root {`
  );
  fs.writeFileSync('src/app/globals.css', cssContent);
}

console.log('Layout and CSS updated for manual theme provider');
