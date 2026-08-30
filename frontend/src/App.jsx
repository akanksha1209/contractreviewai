import { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

const handleDrop = (e) => {
  e.preventDefault();
  setIsDragging(false);

  const droppedFile = e.dataTransfer.files[0];

  if (!droppedFile) return;

  const extension = droppedFile.name
    .substring(droppedFile.name.lastIndexOf("."))
    .toLowerCase();

  if (![".pdf", ".docx"].includes(extension)) {
    setError("Please upload a PDF or DOCX file.");
    return;
  }

  setFile(droppedFile);
  setError("");
  setResult(null);
};

const handleDragOver = (e) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = () => {
  setIsDragging(false);
};

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const extension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (![".pdf", ".docx"].includes(extension)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);
  };

  const analyzeContract = async () => {
    if (!file) {
      setError("Please select a contract first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Contract analysis failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setResult(null);
    setError("");
  };

  const riskClass = (risk) => {
    if (!risk) return "neutral";

    const value = risk.toLowerCase();

    if (value.includes("high")) return "high";
    if (value.includes("medium")) return "medium";
    if (value.includes("low")) return "low";

    return "neutral";
  };

  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">⚖</div>

          <div>
            <div className="brand-name">ContractAI</div>
            <div className="brand-subtitle">Contract Intelligence</div>
          </div>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#analyze">Analyze</a>
        </nav>

        <a href="#analyze" className="nav-button">
          Analyze Contract
        </a>
      </header>


      {/* LANDING PAGE */}
      {!result && (
        <>
          <main>

            <section className="hero" id="home">

              <div className="hero-content">

                <div className="eyebrow">
                  <span>✦</span>
                  AI-POWERED CONTRACT INTELLIGENCE
                </div>

                <h1>
                  Understand your
                  <span> contracts faster.</span>
                </h1>

                <p>
                  Analyze contracts, identify important clauses,
                  detect potential risks, and get a clear overview
                  of your agreement in seconds.
                </p>

                <div className="hero-actions">
                  <a href="#analyze" className="primary-button">
                    Analyze a Contract
                    <span>→</span>
                  </a>

                  <a href="#features" className="secondary-button">
                    Explore Features
                  </a>
                </div>

                <div className="trust-row">
                  <div>
                    <strong>PDF</strong>
                    <span>Supported</span>
                  </div>

                  <div>
                    <strong>DOCX</strong>
                    <span>Supported</span>
                  </div>

                  <div>
                    <strong>6+</strong>
                    <span>Clause Categories</span>
                  </div>
                </div>

              </div>


              {/* HERO PREVIEW */}
              <div className="hero-preview">

                <div className="preview-window">

                  <div className="preview-header">
                    <div className="window-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                    <span>Contract Overview</span>
                  </div>

                  <div className="preview-body">

                    <div className="preview-title">
                      <div>
                        <small>DOCUMENT ANALYSIS</small>
                        <h3>Service Agreement</h3>
                      </div>

                      <div className="mini-risk">
                        <strong>72</strong>
                        <span>/100</span>
                      </div>
                    </div>

                    <div className="preview-line"></div>

                    <div className="preview-items">

                      <div>
                        <span className="dot red"></span>
                        Liability
                        <b>High</b>
                      </div>

                      <div>
                        <span className="dot yellow"></span>
                        Termination
                        <b>Medium</b>
                      </div>

                      <div>
                        <span className="dot green"></span>
                        Confidentiality
                        <b>Low</b>
                      </div>

                    </div>

                  </div>
                </div>

              </div>

            </section>


            {/* FEATURES */}
            <section className="features-section" id="features">

              <div className="section-heading">

                <div className="eyebrow">
                  CORE CAPABILITIES
                </div>

                <h2>
                  Contract review,
                  <span> simplified.</span>
                </h2>

                <p>
                  Turn complex contractual documents into
                  understandable risk insights.
                </p>

              </div>


              <div className="feature-grid">

                <div className="feature-card">
                  <div className="feature-icon">⌕</div>

                  <h3>Clause Detection</h3>

                  <p>
                    Identify important contractual areas such
                    as termination, payment, liability and
                    confidentiality.
                  </p>
                </div>


                <div className="feature-card">
                  <div className="feature-icon">◈</div>

                  <h3>Risk Scoring</h3>

                  <p>
                    Get a simple risk score that helps you
                    quickly understand the overall contract risk.
                  </p>
                </div>


                <div className="feature-card">
                  <div className="feature-icon">⚠</div>

                  <h3>Risk Warnings</h3>

                  <p>
                    Highlight potentially important provisions
                    such as penalties, renewal and liability.
                  </p>
                </div>

              </div>

            </section>


            {/* UPLOAD */}
            <section className="upload-section" id="analyze">

              <div className="upload-container">

                <div className="upload-heading">

                  <div className="eyebrow">
                    START YOUR REVIEW
                  </div>

                  <h2>
                    Analyze a contract
                  </h2>

                  <p>
                    Upload your agreement and let ContractAI
                    review its key contractual areas.
                  </p>

                </div>


                <div
                   className={`upload-box ${isDragging ? "dragging" : ""}`}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}>

                  <div className="upload-icon">
                    ↑
                  </div>

                  <h3>
                    Upload your contract
                  </h3>

                  <p>
                    Drag and drop your file here, or browse
                    from your computer.
                  </p>

                  <label className="browse-button">

                    Browse Files

                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />

                  </label>

                  <small>
                    PDF or DOCX • Maximum recommended size: 10 MB
                  </small>


                  {file && (
                    <div className="selected-file">

                      <div className="file-symbol">
                        📄
                      </div>

                      <div className="file-details">

                        <strong>
                          {file.name}
                        </strong>

                        <span>
                          {(file.size / 1024).toFixed(1)} KB
                        </span>

                      </div>

                      <button
                        className="remove-file"
                        onClick={() => setFile(null)}
                      >
                        ×
                      </button>

                    </div>
                  )}


                  {error && (
                    <div className="error-message">
                      ⚠ {error}
                    </div>
                  )}


                  <button
                    className="analyze-button"
                    onClick={analyzeContract}
                    disabled={loading}
                  >
                    {loading
                      ? "Analyzing Contract..."
                      : "Analyze Contract →"}
                  </button>

                </div>

              </div>

            </section>

          </main>
        </>
      )}


      {/* RESULTS PAGE */}
      {result && (
        <main className="results-page">

          <div className="results-top">

            <button
              className="back-button"
              onClick={resetAnalysis}
            >
              ← New Analysis
            </button>

            <div className="analysis-status">
              <span>✓</span>
              Analysis Complete
            </div>

          </div>


          <div className="results-heading">

            <div>
              <div className="eyebrow">
                CONTRACT ANALYSIS
              </div>

              <h1>
                {result.filename}
              </h1>

              <p>
                Automated review of key contractual areas
                and potential risks.
              </p>
            </div>

          </div>


          {/* RISK OVERVIEW */}
          <section className="risk-overview">

            <div className="risk-score-card">

              <div className="score-ring">

                <div>
                  <strong>
                    {result.analysis.risk_score}
                  </strong>

                  <span>/100</span>
                </div>

              </div>

              <div className="score-label">
                Overall Risk Score
              </div>

            </div>


            <div className="risk-summary">

              <span
                className={`risk-pill ${riskClass(
                  result.analysis.risk_level
                )}`}
              >
                {result.analysis.risk_level}
              </span>

              <h2>
                Contract Risk Overview
              </h2>

              <p>
                {result.analysis.summary}
              </p>

            </div>


            <div className="summary-stats">

              <div>
                <strong>
                  {result.analysis.word_count}
                </strong>

                <span>Words</span>
              </div>

              <div>
                <strong>
                  {result.analysis.clauses.length}
                </strong>

                <span>Categories</span>
              </div>

              <div>
                <strong>
                  {result.analysis.warnings.length}
                </strong>

                <span>Warnings</span>
              </div>

            </div>

          </section>


          {/* WARNINGS */}
          {result.analysis.warnings.length > 0 && (

            <section className="warnings-section">

              <div className="section-heading-small">
                <span>⚠</span>

                <div>
                  <h2>Important Warnings</h2>
                  <p>
                    Potentially significant provisions detected
                    in the document.
                  </p>
                </div>
              </div>


              <div className="warning-list">

                {result.analysis.warnings.map(
                  (warning, index) => (

                    <div
                      className="warning-item"
                      key={index}
                    >
                      <div className="warning-icon">
                        !
                      </div>

                      <span>{warning}</span>
                    </div>

                  )
                )}

              </div>

            </section>

          )}


          {/* CLAUSES */}
          <section className="clauses-section">

            <div className="section-heading-small">

              <span>◈</span>

              <div>
                <h2>Clause Analysis</h2>

                <p>
                  Key contractual areas identified in
                  your document.
                </p>
              </div>

            </div>


            <div className="clauses-grid">

              {result.analysis.clauses.map(
                (clause, index) => (

                  <article
                    className="clause-card"
                    key={index}
                  >

                    <div className="clause-header">

                      <span className="clause-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        className={`risk-pill ${riskClass(
                          clause.risk
                        )}`}
                      >
                        {clause.risk}
                      </span>

                    </div>

                    <h3>
                      {clause.category}
                    </h3>

                    {clause.keyword && (
                      <div className="detected">
                        <span>Detected</span>
                        <strong>
                          {clause.keyword}
                        </strong>
                      </div>
                    )}

                    <p>
                      {clause.description}
                    </p>

                  </article>

                )
              )}

            </div>

          </section>


          {/* DOCUMENT INFO */}
          <section className="document-card">

            <div className="section-heading-small">

              <span>▣</span>

              <div>
                <h2>Document Information</h2>
                <p>
                  Basic information extracted from the document.
                </p>
              </div>

            </div>


            <div className="document-grid">

              <div>
                <span>File Name</span>
                <strong>{result.filename}</strong>
              </div>

              <div>
                <span>Word Count</span>
                <strong>{result.analysis.word_count}</strong>
              </div>

              <div>
                <span>Characters</span>
                <strong>{result.analysis.text_length}</strong>
              </div>

            </div>

          </section>


          <div className="legal-note">

            <strong>⚖ Legal Notice</strong>

            <p>
              ContractAI provides automated informational
              analysis and does not provide legal advice.
              Important agreements should be reviewed by
              a qualified legal professional.
            </p>

          </div>


          <button
            className="new-analysis-large"
            onClick={resetAnalysis}
          >
            ← Analyze Another Contract
          </button>

        </main>
      )}


      {/* FOOTER */}
      <footer>

        <div className="footer-brand">
          <div className="brand-icon">⚖</div>

          <div>
            <strong>ContractAI</strong>
            <span>Contract Intelligence</span>
          </div>
        </div>

        <p>
          AI-powered contract analysis and risk detection.
        </p>

        <span>
          © 2026 ContractAI
        </span>

      </footer>

    </div>
  );
}

export default App;