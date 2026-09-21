import os
import re

files = [
    "src/media/image/image.resolver.ts",
    "src/templates/core.templates.ts",
    "src/transitions/transitions.resolver.ts"
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    new_content = content.replace("\\'", "'")
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
