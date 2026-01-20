import os
import csv
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

from bias_detection import detect_bias

INPUT_CSV = "evaluation_data.csv"
OUTPUT_DIR = "output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

df = pd.read_csv(INPUT_CSV)

texts = df["text"].astype(str).tolist()
true_labels = df["true_bias"].astype(int).tolist()

pred_labels = []
bias_scores = []
flag_counts = []

for text in texts:
    result = detect_bias(text)
    pred_labels.append(1 if result["overall_bias_detected"] else 0)
    bias_scores.append(result["bias_score"])
    flag_counts.append(len(result["flags"]))

accuracy = accuracy_score(true_labels, pred_labels)
precision = precision_score(true_labels, pred_labels, zero_division=0)
recall = recall_score(true_labels, pred_labels, zero_division=0)
f1 = f1_score(true_labels, pred_labels, zero_division=0)
cm = confusion_matrix(true_labels, pred_labels)

metrics = {
    "accuracy": round(accuracy, 3),
    "precision": round(precision, 3),
    "recall": round(recall, 3),
    "f1_score": round(f1, 3),
    "average_bias_score": round(np.mean(bias_scores), 2),
    "average_flags_per_text": round(np.mean(flag_counts), 2)
}

with open(os.path.join(OUTPUT_DIR, "metrics.json"), "w") as f:
    json.dump(metrics, f, indent=4)

with open(os.path.join(OUTPUT_DIR, "classification_report.txt"), "w") as f:
    f.write(classification_report(true_labels, pred_labels))

df["predicted_bias"] = pred_labels
df["bias_score"] = bias_scores
df["flag_count"] = flag_counts

df.to_csv(os.path.join(OUTPUT_DIR, "evaluation_results.csv"), index=False)

plt.figure()
plt.imshow(cm)
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.colorbar()
plt.xticks([0, 1])
plt.yticks([0, 1])

for i in range(2):
    for j in range(2):
        plt.text(j, i, cm[i, j], ha="center", va="center")

plt.savefig(os.path.join(OUTPUT_DIR, "confusion_matrix.png"))
plt.close()

plt.figure()
plt.hist(bias_scores, bins=10)
plt.title("Bias Score Distribution")
plt.xlabel("Bias Score")
plt.ylabel("Frequency")
plt.savefig(os.path.join(OUTPUT_DIR, "bias_score_distribution.png"))
plt.close()

plt.figure()
plt.hist(flag_counts, bins=10)
plt.title("Flags per Text")
plt.xlabel("Number of Flags")
plt.ylabel("Frequency")
plt.savefig(os.path.join(OUTPUT_DIR, "flag_distribution.png"))
plt.close()


print("✅ Evaluation complete.")
print("📁 Results saved to:", OUTPUT_DIR)
print("📊 Metrics:", metrics)
