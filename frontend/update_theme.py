import re

with open('src/components/LocationModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace useLocationContext import to add usePathname
content = content.replace(
    'import { useLocationContext, SavedAddress } from "@/context/LocationContext";',
    'import { useLocationContext, SavedAddress } from "@/context/LocationContext";\nimport { usePathname } from "next/navigation";'
)

# Add pathname logic
content = content.replace(
    '  const {',
    '  const pathname = usePathname();\n  const isStore = pathname?.includes("/store");\n\n  const {'
)

def replacer(m):
    classes = m.group(1).split()
    orange_classes = []
    static_classes = []
    
    for c in classes:
        if 'orange' in c or 'amber' in c:
            orange_classes.append(c)
        else:
            static_classes.append(c)
            
    if not orange_classes:
        return f'className="{m.group(1)}"'
        
    blue_classes = []
    for c in orange_classes:
        b = c.replace('orange', 'blue').replace('amber', 'cyan')
        blue_classes.append(b)
        
    static_str = ' '.join(static_classes)
    orange_str = ' '.join(orange_classes)
    blue_str = ' '.join(blue_classes)
    
    # Format the replacement
    if static_str:
        return f'className={{`{static_str} ${{isStore ? "{blue_str}" : "{orange_str}"}}`}}'
    else:
        return f'className={{isStore ? "{blue_str}" : "{orange_str}"}}'

# Replace regular className="..."
content = re.sub(r'className="([^"]+)"', replacer, content)

with open('src/components/LocationModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated LocationModal.tsx successfully")
