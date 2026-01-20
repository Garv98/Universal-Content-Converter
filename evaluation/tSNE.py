import pandas as pd

simp_df = pd.read_csv(r"outputs\results\text_simplification_detailed_results.csv")
bias_df = pd.read_csv(r"outputs\bias\bias_detailed_results.csv")
wcag_df = pd.read_csv(r"outputs\wcag\wcag_detailed_results.csv")
print(wcag_df.columns)

texts = []
labels = []

texts.extend(simp_df["simplified_text"].dropna().tolist())
labels.extend(["Simplified Text"] * len(simp_df["simplified_text"].dropna()))

texts.extend(bias_df["text"].dropna().tolist())
labels.extend(["Bias Analysed Text"] * len(bias_df["text"].dropna()))

texts.extend(wcag_df["detected_types"].dropna().tolist())
labels.extend(["WCAG Elements"] * len(wcag_df["detected_types"].dropna()))

texts = texts[:120]
labels = labels[:120]

from sentence_transformers import SentenceTransformer
from sklearn.manifold import TSNE

model = SentenceTransformer("all-MiniLM-L6-v2")

embeddings = model.encode(texts)

tsne = TSNE(
    n_components=2,
    perplexity=15,
    learning_rate=200,
    max_iter=1000,
    random_state=42
)

emb_2d = tsne.fit_transform(embeddings)

import matplotlib.pyplot as plt

color_map = {
    "Simplified Text": "tab:blue",
    "Bias Analysed Text": "tab:orange",
    "WCAG Elements": "tab:green"
}

plt.figure(figsize=(6, 6))

for label in set(labels):
    idx = [i for i, l in enumerate(labels) if l == label]
    plt.scatter(
        emb_2d[idx, 0],
        emb_2d[idx, 1],
        label=label,
        c=color_map[label],
        s=25,
        alpha=0.8
    )

plt.legend(frameon=False)
plt.xticks([])
plt.yticks([])
plt.title("t-SNE Visualization of Accessibility System Outputs")
plt.show()
