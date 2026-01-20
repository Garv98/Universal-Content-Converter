import os
import pandas as pd
import textstat
import matplotlib.pyplot as plt
import spacy
import torch

from easse.sari import corpus_sari
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

FIG_DIR = "outputs/figures"
RES_DIR = "outputs/results"

os.makedirs(FIG_DIR, exist_ok=True)
os.makedirs(RES_DIR, exist_ok=True)

SIMPL_MODEL = "facebook/bart-large-cnn"
tokenizer = AutoTokenizer.from_pretrained(SIMPL_MODEL)
model = AutoModelForSeq2SeqLM.from_pretrained(SIMPL_MODEL)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

embedder = SentenceTransformer("all-MiniLM-L6-v2")
nlp = spacy.load("en_core_web_sm")

def simplify_text(text, max_len=128):
    if not isinstance(text, str) or text.strip() == "":
        return ""

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512
    ).to(device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=max_len,
            num_beams=4,
            early_stopping=True
        )

    return tokenizer.decode(outputs[0], skip_special_tokens=True)

def fkgl(text):
    if not isinstance(text, str) or text.strip() == "":
        return 0.0
    return textstat.flesch_kincaid_grade(text)

def sari(src, pred, ref):
    return corpus_sari([src], [pred], [[ref]])

def semantic_similarity(src, pred):
    emb = embedder.encode([src, pred])
    return cosine_similarity([emb[0]], [emb[1]])[0][0]

def simplicity_gain(src, pred):
    return fkgl(src) - fkgl(pred)

def hallucination_rate(src, pred):
    src_ents = {e.text.lower() for e in nlp(src).ents}
    pred_ents = {e.text.lower() for e in nlp(pred).ents}
    hallucinated = pred_ents - src_ents
    return len(hallucinated) / max(1, len(pred_ents))

def evaluate_row(row):
    src = row["original_text"]
    pred = row["simplified_text"]
    ref = row["reference_simple"]

    return {
        "SARI": sari(src, pred, ref),
        "FKGL_Original": fkgl(src),
        "FKGL_Simplified": fkgl(pred),
        "SimplicityGain": simplicity_gain(src, pred),
        "SemanticSimilarity": semantic_similarity(src, pred),
        "HallucinationRate": hallucination_rate(src, pred),
    }

def plot_hist(df, col, title, xlabel, fname):
    plt.figure()
    plt.hist(df[col], bins=10)
    plt.xlabel(xlabel)
    plt.ylabel("Frequency")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/{fname}", dpi=300)
    plt.close()

if __name__ == "__main__":

    df = pd.read_csv("data/text_simplification_test.csv")

    required_cols = {"original_text", "reference_simple"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df.dropna(subset=required_cols).reset_index(drop=True)

    print("Running simplification model...")
    from tqdm import tqdm
    tqdm.pandas()

    df["simplified_text"] = df["original_text"].progress_apply(simplify_text)

    print("Evaluating outputs...")
    metrics = df.apply(evaluate_row, axis=1, result_type="expand")
    final = pd.concat([df, metrics], axis=1)

    final.to_csv(
        f"{RES_DIR}/text_simplification_detailed_results.csv",
        index=False
    )

    summary = final.mean(numeric_only=True)
    summary.to_csv(
        f"{RES_DIR}/text_simplification_summary.csv"
    )

    print("\n=== Average Evaluation Scores ===")
    print(summary)

    plot_hist(final, "SimplicityGain",
              "Distribution of Simplicity Gain",
              "FKGL Reduction",
              "simplicity_gain.png")

    plot_hist(final, "SemanticSimilarity",
              "Semantic Preservation After Simplification",
              "Cosine Similarity",
              "semantic_similarity.png")

    plot_hist(final, "HallucinationRate",
              "Hallucination Analysis",
              "Hallucination Rate",
              "hallucination_rate.png")

    print("\nEvaluation complete.")
    print(f"Figures saved to: {FIG_DIR}")
    print(f"Results saved to: {RES_DIR}")
