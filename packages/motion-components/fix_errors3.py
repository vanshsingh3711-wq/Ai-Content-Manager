import os
import re

def replace_in_file(filepath, pattern, repl):
    with open(filepath, 'r') as f:
        content = f.read()
    new_content = re.sub(pattern, repl, content)
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

# Fix image.resolver.ts missing 'type'
replace_in_file("src/media/image/image.resolver.ts", r'(elementIds: \[[^\]]+\]),', r'\1,\n      type: \'missing-metadata\',')

# Revert transitions.resolver.ts 'type' to 'reason'
replace_in_file("src/transitions/transitions.resolver.ts", r'type:\s*\'unknown-transition-type\'', r'reason: \'unknown-transition-type\'')
replace_in_file("src/transitions/transitions.resolver.ts", r'type:\s*\'invalid-duration\'', r'reason: \'invalid-duration\'')

# Fix templates/core.templates.ts import paths
replace_in_file("src/templates/core.templates.ts", r'\'../templates.types\'', r'\'./templates.types\'')
replace_in_file("src/templates/core.templates.ts", r'\'../../relationships/relationships.types\'', r'\'../relationships/relationships.types\'')

# Fix Stagger.test.tsx missing children
replace_in_file("src/animations/stagger/Stagger.test.tsx", r'\{ currentFrame: 10 \}', r'{ currentFrame: 10, children: [] }')

