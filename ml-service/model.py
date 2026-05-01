from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Richer ideal resume = more realistic scoring
ideal_resume = """
Python Java JavaScript SQL NoSQL MongoDB Machine Learning Deep Learning
Data Structures Algorithms Object Oriented Programming REST API Git GitHub
Communication Teamwork Problem Solving Leadership Time Management Critical Thinking
Data Analysis NumPy Pandas Scikit-learn TensorFlow PyTorch Flask Django
HTML CSS React Node.js Express Docker Linux Agile Scrum
Education Bachelor Degree Computer Science Engineering
Experience Internship Project Developed Implemented Designed Built
Certification AWS Cloud Azure DevOps
"""

# All skills we check for
ALL_SKILLS = [
    "Python", "Java", "JavaScript", "SQL", "Machine Learning",
    "Deep Learning", "Git", "Data Structures", "Communication",
    "Teamwork", "Problem Solving", "Leadership", "REST API",
    "Docker", "React", "NoSQL", "Algorithms"
]

def analyze_resume(resume_text):
    # ── Score via TF-IDF cosine similarity ──
    docs = [resume_text, ideal_resume]
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(docs)
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    # Scale: cosine similarity rarely hits 1.0, so scale up to feel realistic
    score = min(100, int(similarity * 180))

    # ── Missing skills ──
    missing_skills = [
        skill for skill in ALL_SKILLS
        if skill.lower() not in resume_text.lower()
    ]

    # ── Smart suggestions ──
    suggestions = []

    word_count = len(resume_text.split())

    if word_count < 100:
        suggestions.append("Your resume is too short — add more detail to each section (aim for 300+ words)")

    if missing_skills:
        top_missing = missing_skills[:5]
        suggestions.append("Add these in-demand skills if you have them: " + ", ".join(top_missing))

    if "project" not in resume_text.lower():
        suggestions.append("Add a Projects section — it's one of the most important sections for freshers")

    if "education" not in resume_text.lower():
        suggestions.append("Include your Education section with degree, institution, and year")

    if "experience" not in resume_text.lower() and "internship" not in resume_text.lower():
        suggestions.append("Add internships, part-time work, or freelance experience if available")

    if "github" not in resume_text.lower() and "linkedin" not in resume_text.lower():
        suggestions.append("Add links to your GitHub profile and LinkedIn — recruiters always check these")

    if "certif" not in resume_text.lower():
        suggestions.append("Include any certifications (Coursera, Google, AWS, etc.) to stand out")

    # Score-based overall feedback
    if score < 30:
        suggestions.append("Overall: Resume needs significant improvement — focus on adding more relevant content and keywords")
    elif score < 55:
        suggestions.append("Overall: Resume is basic — strengthen it by adding more technical skills and project details")
    elif score < 75:
        suggestions.append("Overall: Resume is decent — a few targeted improvements will make it much stronger")
    else:
        suggestions.append("Overall: Strong resume! Polish the formatting and tailor it to each job description")

    if not suggestions:
        suggestions.append("Your resume looks well-structured and complete — great job!")

    return {
        "score": score,
        "missing_skills": missing_skills,
        "suggestions": suggestions
    }