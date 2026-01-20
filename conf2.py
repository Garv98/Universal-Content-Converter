import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

wcag_df = pd.read_csv(r"outputs\wcag\wcag_detailed_results.csv")

y_true = (wcag_df["expected_issue_count"] > 0).astype(int)
y_pred = (wcag_df["detected_issue_count"] > 0).astype(int)

cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["No Issue", "Issue Present"]
)

disp.plot(cmap="Greens", values_format="d")
plt.title("Confusion Matrix for WCAG Issue Detection")
plt.show()
