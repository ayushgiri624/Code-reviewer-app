import { jsPDF } from "jspdf";
import { useState, useEffect, useRef } from "react";
import { auth, signInWithGoogle, logOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const BACKEND_URL = "https://code-reviewer-backend-liart.vercel.app";

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
fetchUserData(1);`,
  "Java": `import java.util.ArrayList;

public class Main {
    public static int factorial(int n) {
        if(n == 0) return 1;
        return n * factorial(n-1);
    }
    
    public static void main(String[] args) {
        ArrayList<Integer> results = new ArrayList<>();
        for(int i = 0; i <= 10; i++) {
            results.add(factorial(i));
        }
        System.out.println(results);
    }
}`,
  "TypeScript": `interface User {
    id: number;
    name: string;
    email: string;
}

async function getUser(id: number) {
    const response = await fetch('/api/users/' + id);
    const user = response.json() as User;
    return user;
}

function printUser(user: any) {
    console.log("Name: " + user.name);
    console.log("Email: " + user.email);
}

getUser(1).then(printUser);`,
  "Go": `package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    for i := 0; i < 10; i++ {
        fmt.Println(fibonacci(i))
    }
}`,
  "Rust": `fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    for i in 2..n {
        if n % i == 0 {
            return false;
        }
    }
    true
}

fn main() {
    let primes: Vec<u64> = (2..50).filter(|&x| is_prime(x)).collect();
    println!("{:?}", primes);
}`,
  "C": `#include <stdio.h>
#include <stdlib.h>

int* createArray(int size) {
    int* arr = malloc(size * sizeof(int));
    for(int i = 0; i < size; i++) {
        arr[i] = i * 2;
    }
    return arr;
}

int main() {
    int* arr = createArray(5);
    for(int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }
    return 0;
}`,
  "PHP": `<?php
function getUserData($id) {
    $password = "admin123";
    $query = "SELECT * FROM users WHERE id = " . $id;
    $result = mysqli_query($conn, $query);
    return $result;
}

$userId = $_GET['id'];
$user = getUserData($userId);
var_dump($user);
?>`,
  "Ruby": `def bubble_sort(arr)
    n = arr.length
    for i in 0..n-1
        for j in 0..n-i-2
            if arr[j] > arr[j+1]
                arr[j], arr[j+1] = arr[j+1], arr[j]
            end
        end
    end
    arr
end

numbers = [64, 34, 25, 12, 22, 11, 90]
puts bubble_sort(numbers).inspect`
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

  return <span>{displayed}{!done && text && <span className="cursor">|</span>}</span>;
}

function ScoreRing({ score, label, color }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = score === null ? circ : circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e8edf2" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x="36" y="40" textAnchor="middle" fill={color} fontSize={score === null ? "9" : "14"} fontWeight="700" fontFamily="'JetBrains Mono', monospace">{score === null ? "N/A" : score}</text>
      </svg>
      <span style={{ fontSize: 11, color: "#6b7a8d", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function TagBadge({ text, type }) {
  const colors = {
    bug: { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" },
    warning: { bg: "#fffbeb", border: "#fcd34d", text: "#d97706" },
    info: { bg: "#eff6ff", border: "#93c5fd", text: "#2563eb" },
    success: { bg: "#f0fdf4", border: "#86efac", text: "#16a34a" },
    security: { bg: "#faf5ff", border: "#c4b5fd", text: "#7c3aed" },
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    setLineCount(code.split("\n").length);
  }, [code]);

  useEffect(() => {
    setCode(SAMPLE_CODE[language]);
  }, [language]);

  useEffect(() => {
    if (result) setTimeout(() => setAnimateScores(true), 300);
    else setAnimateScores(false);
  }, [result]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) fetchHistory(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reviews/history?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.reviews.map(r => ({
          id: r._id,
          language: r.language,
          reviewType: r.reviewType,
          code: r.code.slice(0, 100) + "...",
          scores: r.scores,
          time: new Date(r.createdAt).toLocaleTimeString()
        })));
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const saveReview = async (userId, reviewData) => {
    try {
      await fetch(`${BACKEND_URL}/api/reviews/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...reviewData }),
      });
    } catch (err) {
      console.error("Failed to save review:", err);
    }
  };

  const parseResult = (text) => {
    const scores = { quality: null, performance: null, security: null, readability: null };
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
      const response = await fetch(`${BACKEND_URL}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompts[reviewType] }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "No response received.";
      setRawText(text);
      const parsed = parseResult(text);
      setResult(parsed);

      const reviewData = { language, reviewType, code, result: text, scores: parsed.scores };

      if (user) {
        await saveReview(user.uid, reviewData);
        await fetchHistory(user.uid);
      } else {
        setHistory(prev => [{
          id: Date.now(), language, reviewType,
          code: code.slice(0, 100) + "...",
          scores: parsed.scores,
          time: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 9)]);
      }

    } catch (err) {
      setRawText("ERROR:" + err.message);
      setResult({ scores: { quality: -1, performance: -1, security: -1, readability: -1 }, fullText: "" });
    }
    setLoading(false);
  };

  const scoreColor = (s) => s === null ? "#94a3b8" : s === -1 ? "#dc2626" : s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#dc2626";

  const extractSection = (text, section) => {
    const patterns = {
      summary: /SUMMARY:\n([\s\S]*?)(?:\n[A-Z\s]+:|\n```|$)/,
      issues: /(?:ISSUES FOUND|BUGS FOUND|VULNERABILITIES|OPTIMIZATIONS):\n([\s\S]*?)(?:\n[A-Z\s]+:|\n```|$)/,
      fixed: /```[\w]*\n([\s\S]*?)```/
    };
    const match = text.match(patterns[section]);
    return match ? match[1].trim() : "";
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CodeReviewAI", 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(200, 220, 255);
    doc.text(`Language: ${language} | Type: ${reviewType} | ${new Date().toLocaleDateString()}`, 20, 32);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 40, pageWidth, 35, "F");
    const scoreLabels = ["Quality", "Performance", "Security", "Readability"];
    const scoreValues = [result.scores.quality, result.scores.performance, result.scores.security, result.scores.readability];
    scoreLabels.forEach((label, i) => {
      const x = 20 + i * 45;
      const val = scoreValues[i];
      const color = val >= 80 ? [22, 163, 74] : val >= 60 ? [217, 119, 6] : [220, 38, 38];
      doc.setTextColor(...color);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(val !== null ? String(val) : "N/A", x, 60);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text(label.toUpperCase(), x, 68);
    });
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 20, 85);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    const summary = extractSection(rawText, "summary");
    const summaryLines = doc.splitTextToSize(summary || "No summary available.", pageWidth - 40);
    doc.text(summaryLines, 20, 93);
    const issuesY = 93 + summaryLines.length * 5 + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text("ISSUES & RECOMMENDATIONS", 20, issuesY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    const issues = extractSection(rawText, "issues");
    const issueLines = doc.splitTextToSize(issues || "No issues found.", pageWidth - 40);
    doc.text(issueLines, 20, issuesY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by CodeReviewAI — Built by Ayush Giri", 20, 285);
    doc.save(`CodeReview_${language}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#1e293b",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .cursor { animation: blink 1s step-end infinite; color: #2563eb; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .glow-btn { transition: all 0.2s; }
        .glow-btn:hover { box-shadow: 0 4px 12px rgba(37,99,235,0.3); transform: translateY(-1px); }
        .glow-btn:active { transform: translateY(0); }
        .lang-btn { transition: all 0.15s; cursor: pointer; }
        .lang-btn:hover { border-color: #2563eb !important; color: #2563eb !important; background: #eff6ff !important; }
        .review-type { transition: all 0.15s; cursor: pointer; }
        .review-type:hover { border-color: #2563eb !important; background: #eff6ff !important; }
        .tab-btn { transition: all 0.2s; cursor: pointer; }
        .tab-btn:hover { color: #2563eb !important; }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .history-item { transition: background 0.15s; cursor: pointer; }
        .history-item:hover { background: #f1f5f9 !important; }
        textarea { resize: none; outline: none; }
        textarea:focus { border-color: #93c5fd !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
        pre { white-space: pre-wrap; word-break: break-word; }
        .auth-btn { transition: all 0.2s; cursor: pointer; }
        .auth-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* NAVBAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        borderBottom: "1px solid #e2e8f0",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56, boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "#0f172a", letterSpacing: "-0.02em" }}>
              CodeReview<span style={{ color: "#2563eb" }}>AI</span>
            </div>
            {!isMobile && <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.15em", marginTop: -2 }}>BUILT BY AYUSH GIRI</div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!isMobile && (
            <div style={{
              padding: "4px 12px", borderRadius: 20,
              background: "#f0fdf4", border: "1px solid #86efac",
              color: "#16a34a", fontSize: 11, letterSpacing: "0.1em"
            }}>● LIVE</div>
          )}

          <button onClick={() => setShowHistory(!showHistory)} style={{
            padding: "4px 12px", borderRadius: 6,
            background: showHistory ? "#eff6ff" : "#f8fafc",
            border: "1px solid #e2e8f0", color: "#64748b",
            fontSize: 11, cursor: "pointer", letterSpacing: "0.05em"
          }}>
            {isMobile ? `📋 ${history.length}` : `HISTORY (${history.length})`}
          </button>

          {!authLoading && (
            user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <img src={user.photoURL} alt="avatar" style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #e2e8f0" }} />
                {!isMobile && <span style={{ fontSize: 11, color: "#64748b" }}>{user.displayName?.split(" ")[0]}</span>}
                <button className="auth-btn" onClick={logOut} style={{
                  padding: "4px 10px", borderRadius: 6,
                  background: "#fff", border: "1px solid #fca5a5",
                  color: "#dc2626", fontSize: 11, cursor: "pointer"
                }}>{isMobile ? "↩" : "LOGOUT"}</button>
              </div>
            ) : (
              <button className="auth-btn" onClick={signInWithGoogle} style={{
                padding: "6px 14px", borderRadius: 6,
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                border: "none", color: "#fff",
                fontSize: 11, cursor: "pointer", fontWeight: 700,
                letterSpacing: "0.05em", fontFamily: "'JetBrains Mono', monospace",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
              }}>{isMobile ? "SIGN IN" : "SIGN IN WITH GOOGLE"}</button>
            )
          )}
        </div>
      </div>

      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "calc(100vh - 56px)",
        height: isMobile ? "auto" : "calc(100vh - 56px)"
      }}>

        {/* LEFT PANEL */}
        <div style={{
          width: isMobile ? "100%" : showHistory ? "38%" : "45%",
          borderRight: isMobile ? "none" : "1px solid #e2e8f0",
          borderBottom: isMobile ? "1px solid #e2e8f0" : "none",
          display: "flex", flexDirection: "column",
          background: "#ffffff",
          transition: "width 0.3s ease"
        }}>
          {/* Language selector */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#fff" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", marginBottom: 8, fontWeight: 600 }}>LANGUAGE</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LANGUAGES.map(l => (
                <button key={l} className="lang-btn" onClick={() => setLanguage(l)} style={{
                  padding: "3px 10px", borderRadius: 6, fontSize: 11,
                  background: language === l ? "#eff6ff" : "#f8fafc",
                  border: `1px solid ${language === l ? "#2563eb" : "#e2e8f0"}`,
                  color: language === l ? "#2563eb" : "#64748b",
                  cursor: "pointer", fontWeight: language === l ? 600 : 400
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Review type */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#fff" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", marginBottom: 8, fontWeight: 600 }}>REVIEW TYPE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {REVIEW_TYPES.map(rt => (
                <button key={rt.id} className="review-type" onClick={() => setReviewType(rt.id)} style={{
                  padding: "8px 10px", borderRadius: 8, textAlign: "left",
                  background: reviewType === rt.id ? "#eff6ff" : "#f8fafc",
                  border: `1px solid ${reviewType === rt.id ? "#2563eb" : "#e2e8f0"}`,
                  cursor: "pointer"
                }}>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{rt.icon} <span style={{ color: reviewType === rt.id ? "#2563eb" : "#475569", fontSize: 11, fontWeight: 600 }}>{rt.label}</span></div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{rt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Code editor */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: isMobile ? 300 : "auto", flex: isMobile ? "none" : 1 }}>
            <div style={{
              padding: "8px 16px", background: "#f8fafc",
              borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
                  main.{language === "C++" ? "cpp" : language === "Python" ? "py" : language === "JavaScript" ? "js" : language === "TypeScript" ? "ts" : language === "Ruby" ? "rb" : language === "Go" ? "go" : language === "Rust" ? "rs" : language === "PHP" ? "php" : language.toLowerCase()}
                </span>
              </div>
              <span style={{ fontSize: 10, color: "#cbd5e1" }}>{lineCount} lines</span>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div style={{
                width: 40, background: "#f8fafc",
                padding: "12px 0", overflowY: "hidden",
                borderRight: "1px solid #f1f5f9", flexShrink: 0
              }}>
                {code.split("\n").map((_, i) => (
                  <div key={i} style={{
                    height: 21, display: "flex", alignItems: "center",
                    justifyContent: "flex-end", paddingRight: 8,
                    fontSize: 11, color: "#cbd5e1"
                  }}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, background: "#fff",
                  border: "none", color: "#334155",
                  fontSize: 12.5, lineHeight: "21px",
                  padding: "12px 16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  overflowY: "auto"
                }}
              />
            </div>
          </div>

          {/* Run button */}
          <div style={{ padding: 16, background: "#fff", borderTop: "1px solid #f1f5f9" }}>
            {!user && (
              <div style={{
                marginBottom: 10, padding: "8px 12px", borderRadius: 8,
                background: "#f0f9ff", border: "1px solid #bae6fd",
                fontSize: 11, color: "#0369a1", textAlign: "center"
              }}>
                Sign in to save your review history permanently
              </div>
            )}
            <button
              className="glow-btn"
              onClick={handleReview}
              disabled={loading || !code.trim()}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 8,
                background: loading ? "#f1f5f9" : "linear-gradient(135deg, #2563eb, #0ea5e9)",
                border: "none",
                color: loading ? "#94a3b8" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 4px 12px rgba(37,99,235,0.3)"
              }}
            >
              {loading ? (
                <><span className="spin" style={{ display: "inline-block" }}>⟳</span>ANALYZING...</>
              ) : "▶ RUN ANALYSIS"}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", minHeight: isMobile ? 500 : "auto", background: "#f8fafc" }}>

          {/* READY STATE */}
          {!result && !loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16,
              padding: 24
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, boxShadow: "0 8px 24px rgba(37,99,235,0.2)"
              }}>⚡</div>
              <div style={{ fontSize: 18, color: "#0f172a", fontWeight: 700 }}>Ready to Analyze</div>
              <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 260, textAlign: "center", lineHeight: 1.6 }}>
                Select your language, choose a review type, and click Run Analysis
              </div>
            </div>
          )}

          {/* SKELETON LOADING */}
          {loading && (
            <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{
                padding: "16px 24px", background: "#fff",
                borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap"
              }}>
                {["Quality", "Perf", "Security", "Readability"].map(label => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s infinite"
                    }} />
                    <span style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
                {["REVIEW", "FIXED CODE", "RAW OUTPUT"].map(tab => (
                  <div key={tab} style={{
                    padding: "10px 20px", fontSize: 11, color: "#94a3b8",
                    letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace"
                  }}>{tab}</div>
                ))}
              </div>
              <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ padding: 16, borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", marginBottom: 10 }}>SUMMARY</div>
                  {[100, 85, 92].map((w, i) => (
                    <div key={i} style={{
                      height: 12, borderRadius: 6, marginBottom: 8, width: `${w}%`,
                      background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite"
                    }} />
                  ))}
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", marginBottom: 10 }}>ISSUES & RECOMMENDATIONS</div>
                  {[90, 75, 85, 60].map((w, i) => (
                    <div key={i} style={{
                      height: 12, borderRadius: 6, marginBottom: 10, width: `${w}%`,
                      background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite"
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 8 }}>
                  <span className="spin" style={{ display: "inline-block", color: "#2563eb", fontSize: 16 }}>⟳</span>
                  <span style={{ fontSize: 12, color: "#2563eb", letterSpacing: "0.1em" }} className="pulse">ANALYZING YOUR CODE...</span>
                </div>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {result && !loading && result.scores.quality === -1 && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16, padding: 24
            }}>
              <div style={{ fontSize: 48 }}>⚠️</div>
              <div style={{ fontSize: 16, color: "#dc2626", fontWeight: 700 }}>Connection Error</div>
              <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 300, textAlign: "center", lineHeight: 1.7 }}>
                Failed to connect to the AI. Please check your internet connection and try again.
              </div>
              <button className="glow-btn" onClick={handleReview} style={{
                marginTop: 8, padding: "10px 24px", borderRadius: 8,
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                border: "none", color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.1em",
                fontFamily: "'JetBrains Mono', monospace"
              }}>↺ RETRY</button>
            </div>
          )}

          {/* RESULT STATE */}
          {result && !loading && result.scores.quality !== -1 && (
            <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Score rings */}
              <div style={{
                padding: "16px 24px", background: "#fff",
                borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", gap: isMobile ? 12 : 24, flexWrap: "wrap"
              }}>
                <ScoreRing score={animateScores ? result.scores.quality : null} label="Quality" color={scoreColor(result.scores.quality)} />
                <ScoreRing score={animateScores ? result.scores.performance : null} label="Perf" color={scoreColor(result.scores.performance)} />
                <ScoreRing score={animateScores ? result.scores.security : null} label="Security" color={scoreColor(result.scores.security)} />
                <ScoreRing score={animateScores ? result.scores.readability : null} label="Readability" color={scoreColor(result.scores.readability)} />
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <TagBadge text={language} type="info" />
                  <TagBadge text={REVIEW_TYPES.find(r => r.id === reviewType)?.label} type="success" />
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e2e8f0", background: "#fff", alignItems: "center" }}>
                {[
                  { id: "review", label: "REVIEW" },
                  { id: "fixed", label: "FIXED CODE" },
                  { id: "raw", label: "RAW OUTPUT" }
                ].map(tab => (
                  <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{
                    padding: "10px 16px", background: "transparent", border: "none",
                    borderBottom: `2px solid ${activeTab === tab.id ? "#2563eb" : "transparent"}`,
                    color: activeTab === tab.id ? "#2563eb" : "#94a3b8",
                    fontSize: isMobile ? 10 : 11, cursor: "pointer", letterSpacing: "0.08em",
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>{tab.label}</button>
                ))}
                <button onClick={downloadPDF} style={{
                  marginLeft: "auto", marginRight: 12,
                  padding: "4px 12px", borderRadius: 6,
                  background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                  border: "none", color: "#fff", fontSize: 10,
                  cursor: "pointer", fontWeight: 700,
                  letterSpacing: "0.05em", fontFamily: "'JetBrains Mono', monospace"
                }}>↓ PDF</button>
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: "auto", padding: isMobile ? 16 : 24 }}>
                {activeTab === "review" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ padding: 16, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", marginBottom: 10, fontWeight: 600 }}>SUMMARY</div>
                      <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }}>
                        <TypewriterText text={extractSection(rawText, "summary")} speed={6} />
                      </div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", marginBottom: 10, fontWeight: 600 }}>ISSUES & RECOMMENDATIONS</div>
                      <pre style={{ fontSize: 12, color: "#475569", lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" }}>
                        {extractSection(rawText, "issues") || "No specific issues section found. See raw output."}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === "fixed" && (
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{
                      padding: "10px 16px", background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex", alignItems: "center", gap: 8
                    }}>
                      <span style={{ fontSize: 11, color: "#16a34a", letterSpacing: "0.1em", fontWeight: 600 }}>✓ IMPROVED CODE</span>
                      <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>{language}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(extractSection(rawText, "fixed"))}
                        style={{
                          padding: "2px 10px", borderRadius: 4, fontSize: 10,
                          background: "#fff", border: "1px solid #e2e8f0",
                          color: "#64748b", cursor: "pointer"
                        }}>COPY</button>
                    </div>
                    <pre style={{
                      padding: 20, background: "#fff",
                      fontSize: 12.5, color: "#334155", lineHeight: "21px",
                      fontFamily: "'JetBrains Mono', monospace", overflowX: "auto"
                    }}>
                      {extractSection(rawText, "fixed") || "No fixed code found. See raw output."}
                    </pre>
                  </div>
                )}

                {activeTab === "raw" && (
                  <pre style={{
                    fontSize: 12, color: "#64748b", lineHeight: 1.8,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "#fff", padding: 20, borderRadius: 10,
                    border: "1px solid #e2e8f0", overflowX: "auto",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                  }}>
                    {rawText}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* HISTORY PANEL */}
        {showHistory && (
          <div style={{
            width: isMobile ? "100%" : 240,
            borderLeft: isMobile ? "none" : "1px solid #e2e8f0",
            borderTop: isMobile ? "1px solid #e2e8f0" : "none",
            background: "#fff", overflow: "auto",
            display: "flex", flexDirection: "column",
            maxHeight: isMobile ? 300 : "none"
          }}>
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid #f1f5f9",
              fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", fontWeight: 600,
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              REVIEW HISTORY
              {user && <span style={{ fontSize: 9, color: "#16a34a" }}>● SAVED</span>}
            </div>
            {history.length === 0 ? (
              <div style={{ padding: 16, fontSize: 11, color: "#cbd5e1", textAlign: "center", marginTop: 20 }}>
                No history yet
              </div>
            ) : history.map(h => (
              <div key={h.id} className="history-item" style={{
                padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#fff"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>{h.language}</span>
                  <span style={{ fontSize: 10, color: "#cbd5e1" }}>{h.time}</span>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>{h.reviewType.toUpperCase()}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(h.scores).map(([k, v]) => (
                    <span key={k} style={{
                      fontSize: 9, padding: "1px 6px", borderRadius: 3,
                      background: "#f8fafc", border: `1px solid ${scoreColor(v)}`,
                      color: scoreColor(v), fontWeight: 600
                    }}>{v ?? "N/A"}</span>
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