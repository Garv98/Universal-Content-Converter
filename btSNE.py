import pandas as pd

bias_df = pd.read_csv(r"outputs\bias\bias_detailed_results.csv")

texts = bias_df["text"].dropna().astype(str).tolist()
bias_scores = bias_df["bias_score"].dropna().tolist()  

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

plt.figure(figsize=(6, 6))

scatter = plt.scatter(
    emb_2d[:, 0],
    emb_2d[:, 1],
    c=bias_scores,
    cmap="coolwarm",
    s=25,
    alpha=0.8
)

plt.colorbar(scatter, label="Bias / Toxicity Score")
plt.xticks([])
plt.yticks([])
plt.title("t-SNE of Text Outputs Colored by Bias Score")
plt.show()
