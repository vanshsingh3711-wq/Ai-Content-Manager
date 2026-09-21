import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace reason with type
    new_content = re.sub(r'reason:\s*', 'type: ', content)
    
    # Fix elementId -> elementIds only inside diagnostics.push
    new_content = re.sub(r'elementId:\s*elementId,', 'elementIds: [elementId],', new_content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

replace_in_file("src/media/image/image.resolver.ts")

