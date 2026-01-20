import pandas as pd
import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score

from wcag_analysis import analyze_html  


DATASET = "data/wcag_eval_dataset.csv"
OUT_DIR = "outputs/wcag"
FIG_DIR = os.path.join(OUT_DIR, "figures")

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(FIG_DIR, exist_ok=True)

df = pd.read_csv(DATASET)

y_true = []
y_pred = []
category_correct = []
issue_count_errors = []
scores = []

results = []

for _, row in df.iterrows():
    expected_bias = 0 if row["expected_issue_count"] == 0 else 1
    expected_types = (
        [] if row["expected_issue_types"] == "none"
        else row["expected_issue_types"].split(";")
    )

    output = analyze_html(row["html"])
    detected_types = [i["type"] for i in output["issues"]]
    detected_issue_count = len(detected_types)

    predicted_bias = 0 if detected_issue_count == 0 else 1

    y_true.append(expected_bias)
    y_pred.append(predicted_bias)

    if expected_bias == 1:
        category_correct.append(
            int(all(t in detected_types for t in expected_types))
        )

    issue_count_errors.append(
        abs(row["expected_issue_count"] - detected_issue_count)
    )

    scores.append(output["score"])

    results.append({
        "id": row["id"],
        "expected_issue_count": row["expected_issue_count"],
        "detected_issue_count": detected_issue_count,
        "expected_types": row["expected_issue_types"],
        "detected_types": ";".join(detected_types),
        "accessibility_score": output["score"]
    })

precision = precision_score(y_true, y_pred)
recall = recall_score(y_true, y_pred)
f1 = f1_score(y_true, y_pred)
accuracy = accuracy_score(y_true, y_pred)

category_accuracy = (
    sum(category_correct) / len(category_correct)
    if category_correct else 1.0
)

mean_issue_error = np.mean(issue_count_errors)

summary = {
    "Accuracy": accuracy,
    "Precision": precision,
    "Recall": recall,
    "F1-Score": f1,
    "CategoryAccuracy": category_accuracy,
    "MeanIssueCountError": mean_issue_error,
    "MeanAccessibilityScore": np.mean(scores)
}


pd.DataFrame(results).to_csv(
    os.path.join(OUT_DIR, "wcag_detailed_results.csv"),
    index=False
)

pd.DataFrame([summary]).to_csv(
    os.path.join(OUT_DIR, "wcag_summary.csv"),
    index=False
)

plt.figure()
plt.hist(scores, bins=10)
plt.xlabel("Accessibility Score")
plt.ylabel("Frequency")
plt.title("Distribution of WCAG Accessibility Scores")
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "accessibility_score_distribution.png"))
plt.close()


plt.figure()
plt.hist(issue_count_errors, bins=10)
plt.xlabel("Absolute Issue Count Error")
plt.ylabel("Frequency")
plt.title("Issue Count Prediction Error")
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "issue_count_error.png"))
plt.close()

plt.figure()
metrics = ["Accuracy", "Precision", "Recall", "F1-Score"]
values = [accuracy, precision, recall, f1]

plt.bar(metrics, values)
plt.ylim(0, 1)
plt.ylabel("Score")
plt.title("WCAG Issue Detection Performance")
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "wcag_detection_metrics.png"))
plt.close()

print("\n=== WCAG Evaluation Summary ===")
for k, v in summary.items():
    print(f"{k}: {round(v, 3)}")

print("\nResults saved to:", OUT_DIR)
print("Figures saved to:", FIG_DIR)
