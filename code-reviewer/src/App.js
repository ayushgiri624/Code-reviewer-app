import { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  "C++", "Python", "JavaScript", "Java", "TypeScript",
  "Go", "Rust", "C", "PHP", "Ruby"
];

const REVIEW_TYPES = [
  { id: "full", label: "Full Review", icon: "⚡", desc: "Bugs, quality, performance, security" },
  { id: "bugs", label: "Bug Detection", icon: "🐛", desc: "Find errors and logical issues" },
  { id: "optimize", label: "Optimize", icon: "🚀", desc: "Performance improvements" },
  { id: "security", label: "Security Audit", icon: "🔒", desc: "Vulnerabilities & best practices" },
];

const SAMPLE_CODE = {
  "C++": `#include <iostream>
#include <vector>
using namespace std;

int findMax(vector<int> arr) {
    int max = 0;
    for(int i = 0; i <= arr.size(); i++) {
        if(arr[i] > max)
            max = arr[i];
    }
    return max;
}

int main() {
    vector<int> nums = {3, 1, 4, 1, 5, 9, 2, 6};
    cout << "Max: " << findMax(nums) << endl;
    return 0;
}`,
  "Python": `def find_duplicates(lst):
    duplicates = []
    for i in range(len(lst)):
        for j in range(len(lst)):
            if lst[i] == lst[j] and i != j:
                duplicates.append(lst[i])
    return duplicates

numbers = [1, 2, 3, 2, 4, 3, 5]
print(find_duplicates(numbers))`,
  "JavaScript": `async function fetchUserData(userId) {
    const response = await fetch('/api/users/' + userId);
    const data = response.json();
    
    if(data.password) {
        console.log("Password: " + data.password);
    }
    
    return data;
}

var password = "admin123";
fetchUserData(1);`
};

function TypewriterText({ text, speed = 8 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idx.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}{!done && text && <span className="cursor">▋</span>}</span>;
}

function ScoreRing({ score, label, color }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#1e2a3a" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x="36" y="40" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{score}</text>
      </svg>
      <span style={{ fontSize: 11, color: "#8899aa", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function TagBadge({ text, type }) {
  const colors = {
    bug: { bg: "#2d1a1a", border: "#c0392b", text: "#e74c3c" },
    warning: { bg: "#2d2a1a", border: "#d4a017", text: "#f1c40f" },
    info: { bg: "#1a2a2d", border: "#1a7fa0", text: "#3498db" },
    success: { bg: "#1a2d1e", border: "#1e8449", text: "#2ecc71" },
    security: { bg: "#2d1a2d", border: "#8e44ad", text: "#9b59b6" },
  };
  const c = colors[type] || colors.info;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      padding: "2px 10px", borderRadius: 4, fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
      letterSpacing: "0.05em", textTransform: "uppercase"
    }}>{text}</span>
  );
}

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE["C++"]);
  const [language, setLanguage] = useState("C++");
  const [reviewType, setReviewType] = useState("full");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState("");
  const [activeTab, setActiveTab] = useState("review");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [animateScores, setAnimateScores] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    setLineCount(code.split("\n").length);
  }, [code]);

  useEffect(() => {
    if (language in SAMPLE_CODE) setCode(SAMPLE_CODE[language]);
  }, [language]);

  useEffect(() => {
    if (result) setTimeout(() => setAnimateScores(true), 300);
    else setAnimateScores(false);
  }, [result]);

  const parseResult = (text) => {
    const scores = { quality: 72, performance: 65, security: 58, readability: 70 };
    const qualM = text.match(/quality[:\s]+(\d+)/i);
    const perfM = text.match(/performance[:\s]+(\d+)/i);
    const secM = text.match(/security[:\s]+(\d+)/i);
    const readM = text.match(/readability[:\s]+(\d+)/i);
    if (qualM) scores.quality = parseInt(qualM[1]);
    if (perfM) scores.performance = parseInt(perfM[1]);
    if (secM) scores.security = parseInt(secM[1]);
    if (readM) scores.readability = parseInt(readM[1]);
    return { scores, fullText: text };
  };

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setRawText("");
    setActiveTab("review");

    const prompts = {
      full: `You are an expert code reviewer. Analyze this ${language} code thoroughly.

Return your response in this EXACT format:

SCORES:
Quality: [0-100]
Performance: [0-100]
Security: [0-100]
Readability: [0-100]

SUMMARY:
[2-3 sentence overall assessment]

ISSUES FOUND:
[List each issue with severity: 🔴 CRITICAL / 🟡 WARNING / 🔵 INFO]
- [Issue description with line reference if possible]

IMPROVEMENTS:
[Specific actionable improvements]

FIXED CODE:
\`\`\`${language.toLowerCase()}
[Provide the corrected/improved version of the code]
\`\`\`

Code to review:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``,

      bugs: `You are a bug detection expert. Find all bugs in this ${language} code.

SCORES:
Quality: [0-100]
Performance: [0-100]
Security: [0-100]
Readability: [0-100]

SUMMARY:
[Assessment focused on bugs]

BUGS FOUND:
[List every bug with 🔴 CRITICAL / 🟡 WARNING labels]

FIXED CODE:
\`\`\`${language.toLowerCase()}
[Bug-free version]
\`\`\`

Code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``,

      optimize: `You are a performance optimization expert for ${language}.

SCORES:
Quality: [0-100]
Performance: [0-100]
Security: [0-100]
Readability: [0-100]

SUMMARY:
[Performance assessment]

OPTIMIZATIONS:
[List all performance improvements with complexity analysis]

OPTIMIZED CODE:
\`\`\`${language.toLowerCase()}
[Optimized version with comments explaining changes]
\`\`\`

Code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``,

      security: `You are a security expert. Audit this ${language} code for vulnerabilities.

SCORES:
Quality: [0-100]
Performance: [0-100]
Security: [0-100]
Readability: [0-100]

SUMMARY:
[Security assessment]

VULNERABILITIES:
[List with 🔴 CRITICAL / 🟡 WARNING / 🔵 INFO severity]

SECURE VERSION:
\`\`\`${language.toLowerCase()}
[Hardened version]
\`\`\`

Code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``
    };

    try {
      // ✅ Now calling YOUR backend instead of Anthropic directly
      const response = await fetch("https://code-reviewer-backend-liart.vercel.app/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompts[reviewType] }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "No response received.";
      setRawText(text);
      const parsed = parseResult(text);
      setResult(parsed);

      setHistory(prev => [{
        id: Date.now(),
        language,
        reviewType,
        code: code.slice(0, 100) + "...",
        scores: parsed.scores,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);

    } catch (err) {
      setRawText("Error connecting to AI. Please try again.\n\n" + err.message);
      setResult({ scores: { quality: 0, performance: 0, security: 0, readability: 0 }, fullText: "" });
    }
    setLoading(false);
  };

  const scoreColor = (s) => s >= 80 ? "#2ecc71" : s >= 60 ? "#f1c40f" : "#e74c3c";

  const extractSection = (text, section) => {
    const patterns = {
      summary: /SUMMARY:\n([\s\S]*?)(?:\n[A-Z\s]+:|\n```|$)/,
      issues: /(?:ISSUES FOUND|BUGS FOUND|VULNERABILITIES|OPTIMIZATIONS):\n([\s\S]*?)(?:\n[A-Z\s]+:|\n```|$)/,
      fixed: /```[\w]*\n([\s\S]*?)```/
    };
    const match = text.match(patterns[section]);
    return match ? match[1].trim() : "";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070d14",
      color: "#c9d8e8",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0d1520; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
        .cursor { animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .glow-btn { transition: all 0.2s; }
        .glow-btn:hover { box-shadow: 0 0 20px rgba(0,200,255,0.3); transform: translateY(-1px); }
        .glow-btn:active { transform: translateY(0); }
        .lang-btn { transition: all 0.15s; cursor: pointer; }
        .lang-btn:hover { border-color: #00c8ff !important; color: #00c8ff !important; }
        .review-type { transition: all 0.15s; cursor: pointer; }
        .review-type:hover { border-color: #00c8ff !important; }
        .tab-btn { transition: all 0.2s; cursor: pointer; }
        .tab-btn:hover { color: #00c8ff !important; }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .grid-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .history-item { transition: background 0.15s; cursor: pointer; }
        .history-item:hover { background: #0d1f30 !important; }
        textarea { resize: none; outline: none; }
        textarea:focus { border-color: #1e4a6e !important; box-shadow: 0 0 0 2px rgba(0,150,255,0.1); }
        pre { white-space: pre-wrap; word-break: break-word; }
      `}</style>

      <div className="grid-bg" />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 10,
        borderBottom: "1px solid #0f2035",
        background: "rgba(7,13,20,0.95)",
        backdropFilter: "blur(10px)",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #00c8ff, #0066ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 0 12px rgba(0,200,255,0.4)"
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>
              CodeReview<span style={{ color: "#00c8ff" }}>AI</span>
            </div>
            <div style={{ fontSize: 9, color: "#3a5a7a", letterSpacing: "0.15em", marginTop: -2 }}>BUILT BY AYUSH GIRI</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            padding: "4px 12px", borderRadius: 4,
            background: "#0a1a0a", border: "1px solid #1a4a1a",
            color: "#2ecc71", fontSize: 11, letterSpacing: "0.1em"
          }}>● LIVE</div>
          <button onClick={() => setShowHistory(!showHistory)} style={{
            padding: "4px 14px", borderRadius: 4,
            background: showHistory ? "#0d1f30" : "transparent",
            border: "1px solid #1e3a5f", color: "#6a9ab0",
            fontSize: 11, cursor: "pointer", letterSpacing: "0.08em"
          }}>
            HISTORY ({history.length})
          </button>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 5, display: "flex", height: "calc(100vh - 56px)" }}>

        {/* Left Panel */}
        <div style={{
          width: showHistory ? "38%" : "45%",
          borderRight: "1px solid #0f2035",
          display: "flex", flexDirection: "column",
          transition: "width 0.3s ease"
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #0f2035", background: "#08111c" }}>
            <div style={{ fontSize: 10, color: "#3a5a7a", letterSpacing: "0.15em", marginBottom: 8 }}>LANGUAGE</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LANGUAGES.map(l => (
                <button key={l} className="lang-btn" onClick={() => setLanguage(l)} style={{
                  padding: "3px 10px", borderRadius: 4, fontSize: 11,
                  background: language === l ? "#0d2a3f" : "transparent",
                  border: `1px solid ${language === l ? "#00c8ff" : "#1e3a5f"}`,
                  color: language === l ? "#00c8ff" : "#4a7090", cursor: "pointer"
                }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: "12px 16px", borderBottom: "1px solid #0f2035", background: "#08111c" }}>
            <div style={{ fontSize: 10, color: "#3a5a7a", letterSpacing: "0.15em", marginBottom: 8 }}>REVIEW TYPE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {REVIEW_TYPES.map(rt => (
                <button key={rt.id} className="review-type" onClick={() => setReviewType(rt.id)} style={{
                  padding: "8px 10px", borderRadius: 6, textAlign: "left",
                  background: reviewType === rt.id ? "#0d2236" : "transparent",
                  border: `1px solid ${reviewType === rt.id ? "#00c8ff" : "#1e3a5f"}`,
                  cursor: "pointer"
                }}>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{rt.icon} <span style={{ color: reviewType === rt.id ? "#00c8ff" : "#8899aa", fontSize: 11, fontWeight: 600 }}>{rt.label}</span></div>
                  <div style={{ fontSize: 10, color: "#3a5a7a" }}>{rt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              padding: "8px 16px", background: "#08111c",
              borderBottom: "1px solid #0f2035",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e74c3c" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f1c40f" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71" }} />
                <span style={{ fontSize: 11, color: "#3a5a7a", marginLeft: 8 }}>
                  main.{language === "C++" ? "cpp" : language === "Python" ? "py" : language === "JavaScript" ? "js" : language.toLowerCase()}
                </span>
              </div>
              <span style={{ fontSize: 10, color: "#2a4a5a" }}>{lineCount} lines</span>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div style={{
                width: 40, background: "#07101a", padding: "12px 0",
                overflowY: "hidden", borderRight: "1px solid #0f2035", flexShrink: 0
              }}>
                {code.split("\n").map((_, i) => (
                  <div key={i} style={{
                    height: 21, display: "flex", alignItems: "center",
                    justifyContent: "flex-end", paddingRight: 8, fontSize: 11, color: "#1e3a5f"
                  }}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, background: "#07101a", border: "none", color: "#a8c8e8",
                  fontSize: 12.5, lineHeight: "21px", padding: "12px 16px",
                  fontFamily: "'JetBrains Mono', monospace", overflowY: "auto"
                }}
              />
            </div>
          </div>

          <div style={{ padding: 16, background: "#08111c", borderTop: "1px solid #0f2035" }}>
            <button
              className="glow-btn"
              onClick={handleReview}
              disabled={loading || !code.trim()}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 8,
                background: loading ? "#0a1a2a" : "linear-gradient(135deg, #0066ff, #00c8ff)",
                border: loading ? "1px solid #1e3a5f" : "none",
                color: loading ? "#4a7090" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {loading ? (
                <><span className="spin" style={{ display: "inline-block" }}>⟳</span> ANALYZING...</>
              ) : "▶ RUN ANALYSIS"}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!result && !loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16, color: "#1e3a5f"
            }}>
              <div style={{ fontSize: 48 }}>⚡</div>
              <div style={{ fontSize: 14, letterSpacing: "0.1em", color: "#2a4a6a" }}>READY TO ANALYZE</div>
              <div style={{ fontSize: 11, color: "#1a2a3a", maxWidth: 240, textAlign: "center", lineHeight: 1.6 }}>
                Select your language, choose review type, and click Run Analysis
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 20
            }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #0f2035" }} />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2px solid transparent", borderTopColor: "#00c8ff",
                  animation: "spin 1s linear infinite"
                }} />
                <div style={{
                  position: "absolute", inset: 8, borderRadius: "50%",
                  border: "2px solid transparent", borderTopColor: "#0066ff",
                  animation: "spin 0.7s linear infinite reverse"
                }} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 20
                }}>⚡</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#00c8ff", letterSpacing: "0.1em" }} className="pulse">
                  ANALYZING YOUR CODE...
                </div>
                <div style={{ fontSize: 11, color: "#2a4a6a", marginTop: 6 }}>
                  Powered by Google Gemini
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{
                padding: "16px 24px", background: "#08111c",
                borderBottom: "1px solid #0f2035",
                display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap"
              }}>
                <ScoreRing score={animateScores ? result.scores.quality : 0} label="Quality" color={scoreColor(result.scores.quality)} />
                <ScoreRing score={animateScores ? result.scores.performance : 0} label="Perf" color={scoreColor(result.scores.performance)} />
                <ScoreRing score={animateScores ? result.scores.security : 0} label="Security" color={scoreColor(result.scores.security)} />
                <ScoreRing score={animateScores ? result.scores.readability : 0} label="Readability" color={scoreColor(result.scores.readability)} />
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                  <TagBadge text={language} type="info" />
                  <TagBadge text={REVIEW_TYPES.find(r => r.id === reviewType)?.label} type="success" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #0f2035", background: "#07101a" }}>
                {[{ id: "review", label: "REVIEW" }, { id: "fixed", label: "FIXED CODE" }, { id: "raw", label: "RAW OUTPUT" }].map(tab => (
                  <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{
                    padding: "10px 20px", background: "transparent", border: "none",
                    borderBottom: `2px solid ${activeTab === tab.id ? "#00c8ff" : "transparent"}`,
                    color: activeTab === tab.id ? "#00c8ff" : "#3a5a7a",
                    fontSize: 11, cursor: "pointer", letterSpacing: "0.12em",
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600
                  }}>{tab.label}</button>
                ))}
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                {activeTab === "review" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ padding: 16, borderRadius: 8, background: "#08111c", border: "1px solid #0f2035" }}>
                      <div style={{ fontSize: 10, color: "#3a5a7a", letterSpacing: "0.15em", marginBottom: 10 }}>SUMMARY</div>
                      <div style={{ fontSize: 13, color: "#a8c8e8", lineHeight: 1.7 }}>
                        <TypewriterText text={extractSection(rawText, "summary")} speed={6} />
                      </div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 8, background: "#08111c", border: "1px solid #0f2035" }}>
                      <div style={{ fontSize: 10, color: "#3a5a7a", letterSpacing: "0.15em", marginBottom: 10 }}>ISSUES & RECOMMENDATIONS</div>
                      <pre style={{ fontSize: 12, color: "#8899aa", lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" }}>
                        {extractSection(rawText, "issues") || "No specific issues section found. See raw output."}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === "fixed" && (
                  <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #0f2035" }}>
                    <div style={{
                      padding: "10px 16px", background: "#08111c", borderBottom: "1px solid #0f2035",
                      display: "flex", alignItems: "center", gap: 8
                    }}>
                      <span style={{ fontSize: 11, color: "#2ecc71", letterSpacing: "0.1em" }}>✓ IMPROVED CODE</span>
                      <span style={{ fontSize: 10, color: "#3a5a7a", marginLeft: "auto" }}>{language}</span>
                    </div>
                    <pre style={{
                      padding: 20, background: "#07101a", fontSize: 12.5, color: "#a8c8e8",
                      lineHeight: "21px", fontFamily: "'JetBrains Mono', monospace", overflowX: "auto"
                    }}>
                      {extractSection(rawText, "fixed") || "No fixed code found. See raw output."}
                    </pre>
                  </div>
                )}

                {activeTab === "raw" && (
                  <pre style={{
                    fontSize: 12, color: "#6a8a9a", lineHeight: 1.8,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "#07101a", padding: 20, borderRadius: 8,
                    border: "1px solid #0f2035", overflowX: "auto"
                  }}>
                    {rawText}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History Panel */}
        {showHistory && (
          <div style={{ width: 240, borderLeft: "1px solid #0f2035", background: "#07101a", overflow: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #0f2035", fontSize: 10, color: "#3a5a7a", letterSpacing: "0.15em" }}>REVIEW HISTORY</div>
            {history.length === 0 ? (
              <div style={{ padding: 16, fontSize: 11, color: "#1e3a5f", textAlign: "center", marginTop: 20 }}>No history yet</div>
            ) : history.map(h => (
              <div key={h.id} className="history-item" style={{ padding: "12px 16px", borderBottom: "1px solid #0a1a28", background: "#07101a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#00c8ff" }}>{h.language}</span>
                  <span style={{ fontSize: 10, color: "#2a4a6a" }}>{h.time}</span>
                </div>
                <div style={{ fontSize: 10, color: "#3a5a7a", marginBottom: 8 }}>{h.reviewType.toUpperCase()}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(h.scores).map(([k, v]) => (
                    <span key={k} style={{
                      fontSize: 9, padding: "1px 6px", borderRadius: 3,
                      background: "#0a1a28", border: `1px solid ${scoreColor(v)}`, color: scoreColor(v)
                    }}>{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}