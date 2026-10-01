import os
import json
from datetime import datetime
from dotenv import load_dotenv

def get_feedback_path():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    knowledge_dir = os.path.join(base_dir, "data", "styles", "knowledge")
    os.makedirs(knowledge_dir, exist_ok=True)
    return os.path.join(knowledge_dir, "feedback.json")

def record_feedback(original_edit: dict, corrected_edit: dict, niche: str, reason: str = ""):
    """
    Phase 5: Stores a human correction for future few-shot learning.
    """
    feedback_path = get_feedback_path()
    
    # Load existing feedback
    if os.path.exists(feedback_path):
        with open(feedback_path, "r") as f:
            feedbacks = json.load(f)
    else:
        feedbacks = []

    # Create new feedback record
    new_record = {
        "timestamp": datetime.now().isoformat(),
        "niche": niche,
        "original": original_edit,
        "correction": corrected_edit,
        "reason": reason
    }
    
    feedbacks.append(new_record)
    
    # Save back to file
    with open(feedback_path, "w") as f:
        json.dump(feedbacks, f, indent=2)
        
    print(f"Feedback recorded for {niche}. Total records: {len(feedbacks)}")
    return True

def apply_feedback_to_profile(niche: str):
    """
    Phase 5: Reads recorded feedback for a niche and appends the best
    corrections as few-shot learning examples to the end of the Style Profile.
    """
    feedback_path = get_feedback_path()
    if not os.path.exists(feedback_path):
        print("No feedback found yet.")
        return

    with open(feedback_path, "r") as f:
        feedbacks = json.load(f)
        
    # Filter for this niche
    niche_feedback = [f for f in feedbacks if f.get("niche") == niche]
    if not niche_feedback:
        print(f"No feedback records found for niche: {niche}")
        return
        
    print(f"Found {len(niche_feedback)} corrections for {niche}.")
    
    # Find the corresponding style profile
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    profile_path = os.path.join(base_dir, "data", "styles", "knowledge", f"{niche}.md")
    
    if not os.path.exists(profile_path):
        print(f"Error: Style profile {profile_path} does not exist.")
        return
        
    with open(profile_path, "r") as f:
        profile_content = f.read()

    # Remove any existing few-shot examples block to avoid appending infinitely
    if "## 5. Human Feedback (Few-Shot Examples)" in profile_content:
        profile_content = profile_content.split("## 5. Human Feedback (Few-Shot Examples)")[0]
        
    # Format the examples
    examples_md = "## 5. Human Feedback (Few-Shot Examples)\n\n"
    examples_md += "Learn from these past corrections made by the human editor. If you see similar situations, output the CORRECTION instead of the ORIGINAL.\n\n"
    
    for i, fb in enumerate(niche_feedback[-5:]): # Take the 5 most recent
        examples_md += f"### Example {i+1}\n"
        examples_md += f"**Context/Reason**: {fb.get('reason', 'N/A')}\n"
        examples_md += f"- ❌ **What you generated**: `{json.dumps(fb['original'])}`\n"
        examples_md += f"- ✅ **What the human corrected it to**: `{json.dumps(fb['correction'])}`\n\n"

    # Append to the profile
    new_profile_content = profile_content.strip() + "\n\n" + examples_md
    
    with open(profile_path, "w") as f:
        f.write(new_profile_content)
        
    print(f"Successfully injected {min(5, len(niche_feedback))} feedback examples into {profile_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Manage style learning feedback loop")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Record mock feedback command
    parser_record = subparsers.add_parser("record_mock", help="Record a mock piece of feedback for testing")
    parser_record.add_argument("--niche", default="high_retention_educational")
    
    # Apply feedback command
    parser_apply = subparsers.add_parser("apply", help="Apply feedback to a style profile")
    parser_apply.add_argument("--niche", default="high_retention_educational")
    
    args = parser.parse_args()
    
    if args.command == "record_mock":
        # Simulate a real correction
        mock_original = {"action": "motion_graphics", "motion_graphics_type": "metric_reveal"}
        mock_correction = {"action": "motion_graphics", "motion_graphics_type": "hero_reveal"}
        reason = "The LLM used a metric reveal for a broad claim that didn't have numbers. Hero reveal is better for bold non-numeric statements."
        record_feedback(mock_original, mock_correction, args.niche, reason)
    
    elif args.command == "apply":
        apply_feedback_to_profile(args.niche)
