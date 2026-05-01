// ── FILE INPUT HANDLING ──
const resumeInput = document.getElementById("resumeUpload");
const analyzeBtn  = document.getElementById("analyzeBtn");
const fileNameEl  = document.getElementById("fileName");
const fileNameTxt = document.getElementById("fileNameText");
const dropZone    = document.getElementById("dropZone");

resumeInput.addEventListener("change", () => {
    const file = resumeInput.files[0];
    if (file) {
        fileNameTxt.textContent = file.name;
        fileNameEl.classList.add("visible");
        analyzeBtn.disabled = false;
    }
});

// Drag & drop
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.style.borderColor = "var(--green-bright)"; });
dropZone.addEventListener("dragleave", () => { dropZone.style.borderColor = ""; });
dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.style.borderColor = "";
    if (e.dataTransfer.files[0]) {
        resumeInput.files = e.dataTransfer.files;
        resumeInput.dispatchEvent(new Event("change"));
    }
});

// ── UPLOAD & ANALYZE ──
async function uploadResume(event) {
    if (event) event.preventDefault();

    console.log("Clicked");

    const file = document.getElementById("resumeUpload").files[0];

    if (!file) {
        alert("Upload a file first!");
        return;
    }

    // Show loader, disable button
    analyzeBtn.disabled = true;
    document.getElementById("loader").classList.add("visible");
    document.getElementById("result").innerHTML = "";

    let formData = new FormData();
    formData.append("resume", file);

    try {
        console.log("Sending request...");

        let res = await fetch("http://localhost:3000/analyze", {
            method: "POST",
            body: formData
        });

        console.log("Response:", res);

        let data = await res.json();
        console.log("Data:", data);

        // Hide loader
        document.getElementById("loader").classList.remove("visible");
        analyzeBtn.disabled = false;

        renderResults(data);

    } catch (err) {
        console.error("ERROR:", err);
        document.getElementById("loader").classList.remove("visible");
        analyzeBtn.disabled = false;
        document.getElementById("result").innerHTML = `
            <div class="result-card" style="border-color:rgba(239,68,68,0.25);">
                <p style="font-family:var(--font-mono);font-size:13px;color:#f87171;">
                    ⚠ Error connecting to server. Make sure the backend is running on port 3000.
                </p>
            </div>`;
    }
}

// ── RENDER RESULTS ──
function renderResults(data) {
    const score = Math.min(100, Math.max(0, data.score || 0));
    const circumference = 301.6; // 2π × 48
    const offset = circumference - (score / 100) * circumference;

    const gradeColor = score >= 70 ? "var(--green-neon)" : score >= 40 ? "#fbbf24" : "#f87171";
    const gradeText  = score >= 70 ? "Good Resume" : score >= 40 ? "Needs Improvement" : "Major Improvements Needed";

    // Parse missing skills
    const missingSkills = Array.isArray(data.missing_skills)
        ? data.missing_skills
        : (data.missing_skills || "").split(",").map(s => s.trim()).filter(Boolean);

    // Parse suggestions into array
    const suggestionLines = Array.isArray(data.suggestions)
    ? data.suggestions
    : (data.suggestions || "")
        .split(/[.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 5);

    const skillChips = missingSkills.map(s =>
        `<div class="skill-chip missing">${s}</div>`
    ).join("");

    const suggItems = suggestionLines.map((s, i) =>
        `<div class="suggestion-item">
<span class="suggestion-num">${String(i + 1).padStart(2, '0')}</span>
            <span>${s}</span>
        </div>`
    ).join("");

    document.getElementById("result").innerHTML = `

        <!-- SCORE CARD -->
        <div class="result-card">
            <div class="result-label">02 — Score</div>
            <div class="score-wrapper">
                <div class="score-ring">
                    <svg viewBox="0 0 110 110" width="110" height="110">
                        <circle class="track" cx="55" cy="55" r="48"/>
                        <circle class="fill" id="scoreFill" cx="55" cy="55" r="48"/>
                    </svg>
                    <div class="score-center">
                        <div class="score-num">${score}</div>
                        <div class="score-denom">/100</div>
                    </div>
                </div>
                <div class="score-meta">
                    <h2 style="color:${gradeColor}">${gradeText}</h2>
                    <p>Your resume scored <strong style="color:var(--text-primary)">${score} out of 100</strong> based on skills, structure, and content.</p>
                </div>
            </div>
        </div>

        <!-- MISSING SKILLS CARD -->
        <div class="result-card">
            <div class="result-label">03 — Missing Skills</div>
            <div class="skills-grid">
                ${skillChips || '<span style="font-size:13px;color:var(--text-muted);font-family:var(--font-mono);">No missing skills detected</span>'}
            </div>
        </div>

        <!-- SUGGESTIONS CARD -->
        <div class="result-card">
            <div class="result-label">04 — Suggestions</div>
            <div class="suggestion-list">
                ${suggItems || '<div class="suggestion-item"><span>No suggestions at this time.</span></div>'}
            </div>
        </div>
    `;

    // Animate score ring
    setTimeout(() => {
        const fill = document.getElementById("scoreFill");
        if (fill) fill.style.strokeDashoffset = offset;
    }, 100);

    // Scroll to results
    document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
}
