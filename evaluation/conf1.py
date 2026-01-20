import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

bias_df = pd.read_csv(r"outputs\bias\bias_detailed_results.csv")

y_true = bias_df["expected_bias"]
y_pred = bias_df["predicted_bias"]

cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Non-Biased", "Biased"]
)

disp.plot(cmap="Blues", values_format="d")
plt.title("Confusion Matrix for Bias Detection (Toxic-BERT)")
plt.show()
