import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
import numpy as np
import os

from bias_detection import detect_bias

DATASET = "data/bias_eval_dataset.csv"
OUT_DIR = "outputs/bias"
os.makedirs(OUT_DIR, exist_ok=True)

df = pd.read_csv(DATASET)

y_true = []
y_pred = []
category_matches = []
false_positives = 0

results = []

for _, row in df.iterrows():
    text = row["text"]
    expected_bias = row["expected_bias"]
    expected_categories = (
        [] if row["expected_categories"] == "none"
        else row["expected_categories"].split(",")
    )

    output = detect_bias(text)
    predicted_bias = int(output["overall_bias_detected"])
    predicted_categories = output["categories"]

    y_true.append(expected_bias)
    y_pred.append(predicted_bias)

    if expected_bias == 1:
        category_matches.append(
            int(any(cat in predicted_categories for cat in expected_categories))
        )

    if expected_bias == 0 and predicted_bias == 1:
        false_positives += 1

    results.append({
        "id": row["id"],
        "text": text,
        "expected_bias": expected_bias,
        "predicted_bias": predicted_bias,
        "expected_categories": row["expected_categories"],
        "predicted_categories": ",".join(predicted_categories),
        "bias_score": output["bias_score"]
    })

precision = precision_score(y_true, y_pred)
recall = recall_score(y_true, y_pred)
f1 = f1_score(y_true, y_pred)
accuracy = accuracy_score(y_true, y_pred)

category_accuracy = (
    sum(category_matches) / len(category_matches)
    if category_matches else 1.0
)

false_positive_rate = false_positives / max(1, sum(1 for x in y_true if x == 0))

summary = {
    "Accuracy": accuracy,
    "Precision": precision,
    "Recall": recall,
    "F1-Score": f1,
    "CategoryAccuracy": category_accuracy,
    "FalsePositiveRate": false_positive_rate
}

pd.DataFrame(results).to_csv(
    f"{OUT_DIR}/bias_detailed_results.csv",
    index=False
)

pd.DataFrame([summary]).to_csv(
    f"{OUT_DIR}/bias_summary.csv",
    index=False
)

print("\n=== Bias Detection Evaluation Summary ===")
for k, v in summary.items():
    print(f"{k}: {round(v, 3)}")
