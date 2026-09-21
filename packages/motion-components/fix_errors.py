import os
import glob
import re

def replace_in_file(filepath, pattern, repl):
    with open(filepath, 'r') as f:
        content = f.read()
    new_content = re.sub(pattern, repl, content)
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

# Fix 'reason:' to 'type:' in resolvers
for file in glob.glob("src/media/**/*.resolver.ts", recursive=True):
    replace_in_file(file, r'reason:\s*', 'type: ')
    replace_in_file(file, r'elementId:\s*([a-zA-Z0-9_\.\-]+),', r'elementIds: [\1],')

# Fix transitions.resolver.ts
replace_in_file("src/transitions/transitions.resolver.ts", r'reason:\s*', 'type: ')

