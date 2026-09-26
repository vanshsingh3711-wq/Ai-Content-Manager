with open("services/compositor.py", "r") as f:
    content = f.read()

content = content.replace("abs_path = abs_path.replace(\"\\\\'\", \"\\\\\\\\'\")", "")
content = content.replace("abs_path = abs_path.replace(\"'\", \"\\\\'\")", "abs_path = abs_path.replace(\" \", \"\\\\ \")")
content = content.replace("filter_str.append(f\"; [out_v]subtitles='{escaped_ass}'[sub_v]\")", "filter_str.append(f\"; [out_v]subtitles={escaped_ass}[sub_v]\")")

with open("services/compositor.py", "w") as f:
    f.write(content)
