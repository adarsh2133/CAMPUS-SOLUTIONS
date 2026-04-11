from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_mail import Mail, Message
import bcrypt
import os

# Load env variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# -----------------------------
# Load ENV Variables
# -----------------------------

MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

# Mail settings
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT"))
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS") == "true"

mail = Mail(app)

# -----------------------------
# MongoDB Connection
# -----------------------------

client = MongoClient(MONGO_URI)
db = client.get_database()
users = db["users"]

# -----------------------------
# Security Middleware
# -----------------------------

@app.before_request
def verify_internal_key():

    if request.path == "/health":
        return

    key = request.headers.get("X-Internal-Key")

    if key != INTERNAL_API_KEY:
        return jsonify({"error": "Unauthorized request"}), 403


# -----------------------------
# Routes
# -----------------------------

@app.route("/health")
def health():
    return jsonify({"status": "Flask running"})


@app.route("/register", methods=["POST"])
def register():

    data = request.json
    username = data.get("username")
    password = data.get("password")

    if users.find_one({"username": username}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    users.insert_one({
        "username": username,
        "password": hashed_password
    })

    return jsonify({"message": "User registered successfully"})


@app.route("/login", methods=["POST"])
def login():

    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = users.find_one({"username": username})

    if not user:
        return jsonify({"message": "User not found"}), 404

    if bcrypt.checkpw(password.encode(), user["password"]):
        return jsonify({"message": "Login successful"})
    else:
        return jsonify({"message": "Invalid password"}), 401


@app.route("/profile/<username>", methods=["GET"])
def profile(username):

    user = users.find_one(
        {"username": username},
        {"_id": 0, "password": 0}
    )

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify(user)


# -----------------------------
# Start server
# -----------------------------

if __name__ == "__main__":
    app.run(port=5000, debug=True)