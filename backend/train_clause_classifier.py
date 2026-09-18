"""
Train a clause classification model (realistic train/test split).

Data:
    data/clauses_train.csv   -- 252 rows (3 variations per template)
    data/clauses_test.csv    --  84 rows (1 held-out variation per template)

Pipeline:
    CSV  →  TF-IDF vectorizer  →  LinearSVC  →  evaluation  →  joblib dump
"""

import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
)

TRAIN_PATH = "data/clauses_train.csv"
TEST_PATH = "data/clauses_test.csv"
MODEL_DIR = "ml_models"
MODEL_PATH = os.path.join(MODEL_DIR, "clause_clf.joblib")


def main():
    print("Loading data…")
    train_df = pd.read_csv(TRAIN_PATH)
    test_df = pd.read_csv(TEST_PATH)

    X_train = train_df["text"].astype(str)
    y_train = train_df["label"].astype(str)
    X_test = test_df["text"].astype(str)
    y_test = test_df["label"].astype(str)

    print(f"  training rows: {len(X_train)}")
    print(f"  test rows:     {len(X_test)}")
    print(f"  labels:        {sorted(train_df['label'].unique())}")
    print()

    # ---- Features ----
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        max_features=5000,
        sublinear_tf=True,
        lowercase=True,
        strip_accents="unicode",
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    print(f"Feature matrix: {X_train_vec.shape[0]} × {X_train_vec.shape[1]}")
    print()

    # ---- Model ----
    # LinearSVC is fast, performs well on TF-IDF, and is robust on small datasets.
    clf = LinearSVC(class_weight="balanced", C=1.0, max_iter=10000)
    clf.fit(X_train_vec, y_train)

    # ---- Evaluation ----
    y_pred = clf.predict(X_test_vec)

    print("=" * 62)
    print("EVALUATION ON HELD-OUT TEST SET")
    print("=" * 62)
    print()
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
    print()
    print(classification_report(y_test, y_pred, digits=3))

    labels_sorted = sorted(train_df["label"].unique())
    cm = confusion_matrix(y_test, y_pred, labels=labels_sorted)

    print("Confusion matrix (rows = actual, cols = predicted):")
    header = " " * 24 + "".join(f"{lab[:6]:>8}" for lab in labels_sorted)
    print(header)
    for i, lab in enumerate(labels_sorted):
        row = "".join(f"{cm[i][j]:>8}" for j in range(len(labels_sorted)))
        print(f"{lab:22s} {row}")
    print()

    # ---- Sample predictions ----
    print("Sample predictions:")
    samples = [
        "This Agreement may be terminated by either party upon thirty days written notice.",
        "The Client shall pay all invoices within thirty days of receipt.",
        "The Receiving Party shall keep confidential all Confidential Information.",
        "The Licensee shall not reverse engineer the Software.",
        "Any dispute shall be governed by the laws of the State of Delaware.",
        "This Agreement may be amended only by a written instrument signed by both parties.",
    ]
    sample_vecs = vectorizer.transform(samples)
    sample_preds = clf.predict(sample_vecs)
    for s, p in zip(samples, sample_preds):
        print(f"  [{p:22s}] {s[:70]}")
    print()

    # ---- Save ----
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump({"vectorizer": vectorizer, "clf": clf}, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()
