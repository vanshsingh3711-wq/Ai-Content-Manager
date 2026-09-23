import json
import re

content = """
Here is the JSON:
```json
{
  "edits": []
}
```
"""

try:
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
    if match:
        content = match.group(1)
    
    parsed = json.loads(content)
    print("Success:", parsed)
except Exception as e:
    print("Error:", e)
