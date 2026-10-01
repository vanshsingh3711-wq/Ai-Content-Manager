import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("DEEPSEEK_API_KEY")
client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

with open("/media/vansh/167267A5726787F7/Coding/Main Projects/Ai Content Manager/data/styles/2TlIg3VokY8/frames/frame_0.0.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

response = client.chat.completions.create(
    model="deepseek-v4-flash-vision-exp",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Describe this image."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
            ]
        }
    ],
    max_tokens=100
)
print(response.model_dump_json(indent=2))
