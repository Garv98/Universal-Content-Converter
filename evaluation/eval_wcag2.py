import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import precision_score, recall_score, f1_score

from wcag import check_wcag_compliance


INPUT_CSV = r"data/wcag_eval_dataset.csv"
OUTPUT_DIR = "output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

df = pd.read_csv(INPUT_CSV)

true_labels = df["ground_truth_violations"].tolist()
pred_labels = []
score_before = []
score_after = []
fix_counts = []

for _, row in df.iterrows():
    result = check_wcag_compliance(row["raw_content"], row["content_type"])

    detected = result.get("violations_detected", [])
    pred_labels.append(detected[0] if detected else "none")

    score_before.append(result.get("wcag_score_before", 0))
    score_after.append(result.get("wcag_score_after", 0))
    fix_counts.append(len(result.get("fixes_applied", [])))

labels = ["perceivable", "operable", "understandable", "robust", "none"]

precision = precision_score(true_labels, pred_labels, labels=labels, average="macro", zero_division=0)
recall = recall_score(true_labels, pred_labels, labels=labels, average="macro", zero_division=0)
f1 = f1_score(true_labels, pred_labels, labels=labels, average="macro", zero_division=0)

metrics = {
    "precision_macro": round(precision, 3),
    "recall_macro": round(recall, 3),
    "f1_macro": round(f1, 3),
    "avg_wcag_score_before": round(np.mean(score_before), 2),
    "avg_wcag_score_after": round(np.mean(score_after), 2),
    "avg_improvement": round(np.mean(np.array(score_after) - np.array(score_before)), 2),
    "avg_fixes_applied": round(np.mean(fix_counts), 2)
}

with open(os.path.join(OUTPUT_DIR, "wcag_metrics.json"), "w") as f:
    json.dump(metrics, f, indent=4)

df["predicted_violation"] = pred_labels
df["wcag_score_before"] = score_before
df["wcag_score_after"] = score_after
df["fixes_applied_count"] = fix_counts

df.to_csv(os.path.join(OUTPUT_DIR, "wcag_evaluation_results.csv"), index=False)

plt.figure()
plt.boxplot([score_before, score_after], labels=["Before", "After"])
plt.title("WCAG Score Improvement")
plt.ylabel("WCAG Compliance Score")
plt.savefig(os.path.join(OUTPUT_DIR, "wcag_score_improvement.png"))
plt.close()

plt.figure()
plt.hist(fix_counts, bins=10)
plt.title("Accessibility Fixes Applied")
plt.xlabel("Number of Fixes")
plt.ylabel("Frequency")
plt.savefig(os.path.join(OUTPUT_DIR, "wcag_fix_distribution.png"))
plt.close()

plt.figure()
df["ground_truth_violations"].value_counts().plot(kind="bar")
plt.title("Ground Truth WCAG Violations")
plt.ylabel("Count")
plt.savefig(os.path.join(OUTPUT_DIR, "wcag_violation_distribution.png"))
plt.close()


print("✅ WCAG pipeline evaluation complete.")
print("📁 Results saved to:", OUTPUT_DIR)
print("📊 Metrics:", metrics)
