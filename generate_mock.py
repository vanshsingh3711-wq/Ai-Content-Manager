import json

script_chunks = [
    "Every day, businesses generate massive amounts of data.",
    "Customer messages. Sales numbers. Reports. Emails. Invoices.",
    "And most of it still requires someone to manually process it.",
    "But what if your software could understand that information and actually do something with it?",
    "Imagine dropping a messy collection of customer data into one system.",
    "The AI analyzes it, identifies important patterns, finds unusual activity, and turns the raw information into something you can actually use.",
    "It could tell you which customers are most likely to leave. Which products are performing best. Where you're losing money. And what needs your attention right now.",
    "Instead of spending hours searching through spreadsheets and dashboards, you get the important information immediately.",
    "The AI handles the analysis. The system organizes everything. And you stay in control of the decisions.",
    "Because the future of software isn't about giving you more information.",
    "It's about turning information into action."
]

edits = []
start = 0.0
dur = 5.0

# 1. Metric Reveal for massive amounts of data
edits.append({
    "action": "motion_graphics",
    "trigger_id": "MOCK_01",
    "motion_graphics_type": "metric_reveal",
    "motion_graphics_targets": {"label": "DATA GENERATED", "metric": "2.5", "delta": "QUINTILLION BYTES"},
    "motion_graphics_personality": "premium",
    "start": 0.0,
    "end": 6.0
})
# 2. Before / After for messy vs actionable
edits.append({
    "action": "motion_graphics",
    "trigger_id": "MOCK_02",
    "motion_graphics_type": "before_after",
    "motion_graphics_targets": {"beforeLabel": "MESSY DATA", "before": "Spreadsheets & Invoices", "afterLabel": "ACTIONABLE", "after": "Insights & Decisions"},
    "motion_graphics_personality": "technical",
    "start": 13.0,
    "end": 20.0
})
# 3. Step sequence for analysis
edits.append({
    "action": "motion_graphics",
    "trigger_id": "MOCK_03",
    "motion_graphics_type": "step_sequence",
    "motion_graphics_targets": {"title": "THE AI PROCESS", "step1": "Analyze Data", "step2": "Identify Patterns", "step3": "Take Action"},
    "motion_graphics_personality": "energetic",
    "start": 21.0,
    "end": 28.0
})
# 4. Hero reveal for turning info into action
edits.append({
    "action": "motion_graphics",
    "trigger_id": "MOCK_04",
    "motion_graphics_type": "hero_reveal",
    "motion_graphics_targets": {"label": "THE FUTURE", "headline": "INFORMATION", "accent": "INTO ACTION.", "supporting": "STAY IN CONTROL"},
    "motion_graphics_personality": "premium",
    "start": 48.0,
    "end": 60.0
})

print(json.dumps(edits))
