from flask import Flask, request, redirect, Response, jsonify
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from dotenv import load_dotenv
import os
import re

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])
load_dotenv(".env")
mongo_uri = str(os.getenv("mongo_uri"))
app.config["MONGO_URI"] = mongo_uri
db = PyMongo(app).db

# Whitelisted domains
ALLOWED_DOMAINS = {
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
    'icloud.com', 'aol.com', 'protonmail.com'
}

def is_valid_email(email):
    """Email must NOT contain spaces"""
    if not email or not isinstance(email, str):
        return False, "Email is required"
    
    # ✅ EXPLICIT SPACE CHECK
    if " " in email:
        return False, "Email should not contain spaces"
    
    email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email_regex.match(email):
        return False, "Invalid email format"
    
    domain = email.lower().split('@')[-1]
    if domain not in ALLOWED_DOMAINS:
        return False, f"Only these domains allowed: {', '.join(ALLOWED_DOMAINS)}"
    
    return True, "Email is valid"

def is_valid_password(password):
    """Password must be 8+ characters, NO SPACES"""
    if not password:
        return False, "Password is required"
    
    # ✅ EXPLICIT SPACE CHECK
    if " " in password:
        return False, "Password should not contain spaces"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    return True, "Password is valid"

@app.route("/newlogin", methods=["POST"])
def newlogin():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    email = data.get("email", "")
    name = data.get("name","")
    phoneNumber = data.get("phoneNumber","")
    college = data.get("college","")
    year = data.get("year","")
    major = data.get("major","")
    
    # Check if username already exists
    if db.user_data.find_one({"_id": username}):
        return jsonify({"status": "username already taken"}), 400
    
    # Check if all fields are filled
    if username == "" or password == "" or name == "" or email == "" or phoneNumber == "" or year == "" or major == "" or college == "":
        return jsonify({"status": "please fill all the fields"}), 400
    
    # ✅ Validate password (blocks spaces)
    is_valid_pwd, pwd_message = is_valid_password(password)
    if not is_valid_pwd:
        return jsonify({
            "status": "invalid password", 
            "message": pwd_message
        }), 400
    
    # ✅ Validate email (blocks spaces)
    is_valid_email, email_message = is_valid_email(email)
    if not is_valid_email:
        return jsonify({
            "status": "invalid email address", 
            "message": email_message
        }), 400
    
    # Check if email already exists
    if db.user_data.find_one({"email": email}):
        return jsonify({"status": "email already registered"}), 400
    
    # Create user
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    db.user_data.insert_one({
        "_id": username,
        "password": hashed_password,
        "name": name,
        "email": email
    })
    
    return jsonify({"status": "successful", "username": username, "name": name}), 200

# to login a existing user 

@app.route("/login", methods = ["POST"])
def login():
    data = request.get_json()
    username = data.get("username","")
    password = data.get("password","")
    
    if username == "" or password == "":
        return jsonify({"status":"please fill all the fields"}),400
    
    currentUser = db.user_data.find_one({"_id":username})

    if currentUser and check_password_hash(currentUser.get("password"),password) :
        return jsonify({"status": "login successfully",
                         "login":True ,
                          "username":currentUser.get("_id"),
                           "name":currentUser.get("name")}),200
    else:
        return jsonify({"status":"username or password is incorrect","login":False}),401
    
@app.route("/api/user/<username>", methods=["GET"])
def get_user(username):
    # Express sends username from ITS session
    # CORS ensures ONLY Express can call this
    user = db.user_data.find_one({"_id": username})
    if user:
        return jsonify({
            "status": "found",
            "user": {
                "username": user.get("_id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "phoneNumber": user.get("phoneNumber"),
                "college": user.get("college"),
                "year": user.get("year"),
                "major": user.get("major")
            }
        }), 200
    return jsonify({"status": "not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)
