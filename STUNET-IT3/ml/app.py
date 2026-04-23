"""
STUNET ML Pipeline Service (Flask)
===================================
This Flask app is the ML backend. It receives requests from the Express server
and returns ML-powered predictions. Replace the stub functions below with your
actual trained models.

Run:
    pip install flask flask-cors scikit-learn numpy pandas
    python app.py
"""
from flask import Flask, request, jsonify
import os
import functools
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ─── Security: internal API key check ────────────────────────────────────────
INTERNAL_KEY = os.getenv("FLASK_API_KEY", "")

def require_internal_key(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("X-Internal-Key", "")
        if INTERNAL_KEY and key != INTERNAL_KEY:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


# ─── Health ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "stunet-ml"})


# ─── 1. Analyze User Profile ──────────────────────────────────────────────────
@app.route("/ml/analyze-profile", methods=["POST"])
@require_internal_key
def analyze_profile():
    """
    Input: { userId, skills[], interests[], bio, branch, year, stats }
    Output: { skillScore, collaborationScore, suggestedRoles[] }
    """
    data = request.json or {}
    skills    = data.get("skills", [])
    interests = data.get("interests", [])
    year      = data.get("year", 1)

    # ── TODO: Replace with real ML model ──────────────────────────────────────
    # Example: load a pre-trained model
    # model = joblib.load("models/profile_scorer.pkl")
    # features = encode_profile(skills, interests, branch, year)
    # skill_score = model.predict([features])[0]

    skill_score         = min(100, len(skills) * 10 + year * 5)   # placeholder
    collaboration_score = min(100, len(interests) * 8 + 30)       # placeholder
    suggested_roles     = _infer_roles(skills)

    return jsonify({
        "skillScore":         skill_score,
        "collaborationScore": collaboration_score,
        "suggestedRoles":     suggested_roles,
    })


# ─── 2. Recommend Teammates ───────────────────────────────────────────────────
@app.route("/ml/recommend-teammates", methods=["POST"])
@require_internal_key
def recommend_teammates():
    """
    Input: { userId, skills[], interests[], projectType }
    Output: { userIds[], scores{} }

    Typical approach: load user embeddings, compute cosine similarity,
    return top-K user IDs whose skills complement (not just match) the requester.
    """
    data        = request.json or {}
    user_id     = data.get("userId")
    skills      = data.get("skills", [])
    project_type = data.get("projectType", "general")

    # ── TODO: Replace with vector similarity / collaborative filtering ─────────
    # import numpy as np
    # embeddings = load_embeddings()            # user_id -> vector
    # target_vec = embeddings.get(user_id)
    # sims = {uid: cosine(target_vec, vec) for uid, vec in embeddings.items()}
    # top_k = sorted(sims, key=sims.get, reverse=True)[:10]

    logger.info(f"Recommend teammates for {user_id}, skills={skills}, type={project_type}")

    return jsonify({
        "userIds": [],        # return real IDs from your model
        "scores":  {},
    })


# ─── 3. Recommend Projects ────────────────────────────────────────────────────
@app.route("/ml/recommend-projects", methods=["POST"])
@require_internal_key
def recommend_projects():
    """
    Input: { userId, skills[], interests[] }
    Output: { projectIds[], scores{} }
    """
    data      = request.json or {}
    user_id   = data.get("userId")
    skills    = data.get("skills", [])
    interests = data.get("interests", [])

    # ── TODO: content-based filtering on project techStack vs user skills ──────
    logger.info(f"Recommend projects for {user_id}")

    return jsonify({
        "projectIds": [],
        "scores":     {},
    })


# ─── 4. Auto-tag Project ──────────────────────────────────────────────────────
@app.route("/ml/tag-project", methods=["POST"])
@require_internal_key
def tag_project():
    """
    Input: { title, description, techStack[] }
    Output: { tags[] }

    Typical approach: fine-tuned text classifier or zero-shot classification.
    """
    data        = request.json or {}
    title       = data.get("title", "")
    description = data.get("description", "")
    tech_stack  = data.get("techStack", [])

    # ── TODO: NLP classifier ──────────────────────────────────────────────────
    # from transformers import pipeline
    # classifier = pipeline("zero-shot-classification")
    # candidate_labels = ["web", "mobile", "ml_ai", "iot", "game", "blockchain"]
    # result = classifier(description, candidate_labels)
    # tags = result["labels"][:3]

    tags = list(set(tech_stack[:5]))   # placeholder

    return jsonify({"tags": tags})


# ─── 5. Classify Resource ─────────────────────────────────────────────────────
@app.route("/ml/classify-resource", methods=["POST"])
@require_internal_key
def classify_resource():
    """
    Input: { title, description, url }
    Output: { category, difficulty }
    """
    data    = request.json or {}

    # ── TODO: text classification + difficulty estimation ─────────────────────
    return jsonify({
        "category":   "general",
        "difficulty": "intermediate",
    })


# ─── 6. Team Compatibility Score ─────────────────────────────────────────────
@app.route("/ml/team-compatibility", methods=["POST"])
@require_internal_key
def team_compatibility():
    """
    Input: { members: [{ userId, skills[] }] }
    Output: { score (0-100), breakdown{} }
    """
    data    = request.json or {}
    members = data.get("members", [])

    if not members:
        return jsonify({"score": 0, "breakdown": {}})

    # ── TODO: compute skill diversity + role coverage ──────────────────────────
    all_skills = []
    for m in members:
        all_skills.extend(m.get("skills", []))
    diversity_score = min(100, len(set(all_skills)) * 10)

    return jsonify({
        "score":     diversity_score,
        "breakdown": {"skillDiversity": diversity_score},
    })


# ─── 7. Match Competitions ────────────────────────────────────────────────────
@app.route("/ml/match-competitions", methods=["POST"])
@require_internal_key
def match_competitions():
    """
    Input: { userId, userProfile: { skills[], branch, year } }
    Output: { competitionIds[] }
    """
    data    = request.json or {}
    user_id = data.get("userId")

    # ── TODO: match user profile to competition requirements ──────────────────
    logger.info(f"Match competitions for {user_id}")

    return jsonify({"competitionIds": []})


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _infer_roles(skills):
    role_map = {
        "frontend": ["React", "Vue", "HTML", "CSS", "JavaScript", "TypeScript"],
        "backend":  ["Node.js", "Python", "Django", "Express", "Java", "Spring"],
        "ml_ai":    ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NLP"],
        "mobile":   ["React Native", "Flutter", "Swift", "Kotlin", "Android"],
        "devops":   ["Docker", "Kubernetes", "CI/CD", "AWS", "Azure", "Linux"],
        "designer": ["Figma", "UI/UX", "Adobe XD", "Sketch"],
    }
    matched = []
    for role, role_skills in role_map.items():
        if any(s in role_skills for s in skills):
            matched.append(role)
    return matched or ["generalist"]


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("NODE_ENV", "development") == "development"
    logger.info(f"🤖 STUNET ML Service starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)