import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace reason with type
    new_content = re.sub(r'reason:\s*', 'type: ', content)
    
    # Replace elementId, with elementIds: [elementId], (only when preceded by spaces at start of line)
    new_content = re.sub(r'(\s+)elementId,', r'\1elementIds: [elementId],', new_content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

replace_in_file("src/media/image/image.resolver.ts")

