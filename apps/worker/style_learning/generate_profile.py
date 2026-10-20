import os
import json
import argparse
from dotenv import load_dotenv
from openai import OpenAI

def generate_aggregated_profile(niche_name: str, editorial_logics: list):
    """
    Phase 3: Niche Profile Aggregation.
    Takes the extracted editorial logic from multiple videos in a niche
    and uses an LLM to synthesize them into a single, cohesive master Style Profile.
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY environment variable not set")
        
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    
    # We dump all the logics into a JSON payload for the LLM
    logics_dump = json.dumps(editorial_logics, indent=2)
    
    prompt = f"""You are an expert video editor and YouTube strategist.
I am providing you with the extracted editorial logic rules from multiple top-performing videos in the '{niche_name}' niche.

Your job is to AGGREGATE these rules into a single, cohesive Master Style Profile in Markdown format.
Find the common patterns (median/mode) across the videos. What do most of them do?
Ignore outliers. 

The output MUST be formatted as a Markdown document with these exact sections:
# Style Profile: {niche_name.replace('_', ' ').title()}

## 1. Narrative & Structure
(Summarize the common hook strategies and structural flow)

## 2. Pacing & Rhythm
(Summarize the average cuts per minute and hold durations)

## 3. Motion Graphics Logic
(List the most common triggers for motion graphics and what type of graphic to use)

## 4. B-Roll Logic
(When do these videos typically cut to b-roll? What is the visual strategy?)

## 5. Sound Design (SFX)
(What are the most common SFX used and what visual events trigger them?)

## 6. Music Rules
(What is the common BPM range, mode, and behavior for music?)

---
*Note to Agents: Treat this profile as your single source of truth for stylistic decisions. Do not deviate into generic YouTube editing styles.*

Here is the raw extracted data from {len(editorial_logics)} videos:
{logics_dump}

Output ONLY the Markdown document. Do not wrap it in a code block or add conversational text.
"""

    print(f"Aggregating {len(editorial_logics)} profiles via LLM...")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content

def main(niche_name: str, video_ids: list):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    env_path = os.path.join(base_dir, ".env")
    load_dotenv(env_path)

    editorial_logics = []
    
    for vid in video_ids:
        data_dir = os.path.join(base_dir, "data", "styles", vid)
        logic_file = os.path.join(data_dir, "editorial_logic.json")
        
        if os.path.exists(logic_file):
            with open(logic_file, "r") as f:
                editorial_logics.append(json.load(f))
        else:
            print(f"Warning: {logic_file} not found. Skipping {vid}.")
            
    if not editorial_logics:
        print("Error: No editorial logic files found to aggregate.")
        return

    # Generate Markdown
    markdown_content = generate_aggregated_profile(niche_name, editorial_logics)
    
    # Save to the shared knowledge directory
    knowledge_dir = os.path.join(base_dir, "data", "styles", "knowledge")
    os.makedirs(knowledge_dir, exist_ok=True)
    
    output_file = os.path.join(knowledge_dir, f"{niche_name}.md")
    
    with open(output_file, "w") as f:
        f.write(markdown_content.strip())

    print(f"\nSuccess! Aggregated style profile generated and saved to: {output_file}")
    print("\n--- PREVIEW ---\n")
    print(markdown_content)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Phase 3: Aggregate multiple editorial logics into a master profile.")
    parser.add_argument("--niche", required=True, help="Name of the niche (e.g. high_retention_educational)")
    parser.add_argument("videos", nargs="+", help="List of video IDs to aggregate")
    
    args = parser.parse_args()
    main(args.niche, args.videos)
