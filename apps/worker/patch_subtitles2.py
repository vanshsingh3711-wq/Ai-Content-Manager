import os

with open("services/compositor.py", "r") as f:
    content = f.read()

# Replace _escape_ass_path_for_filter
new_func = """def _escape_ass_path_for_filter(filepath: str) -> str:
    # Use relative path to avoid spaces from the root path
    import os
    try:
        rel_path = os.path.relpath(filepath, os.getcwd())
        # If it still has spaces, just use basename (assuming it's in the current dir)
        if " " in rel_path:
            return os.path.basename(filepath)
        return rel_path.replace("\\\\", "/")
    except Exception:
        return os.path.basename(filepath)
"""

# The function is lines 255-267
import re
content = re.sub(r'def _escape_ass_path_for_filter\(filepath: str\) -> str:.*?return abs_path', new_func, content, flags=re.DOTALL)

with open("services/compositor.py", "w") as f:
    f.write(content)
