from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from dotenv import load_dotenv
from flask_mail import Mail, Message
import os
import re
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, UTC
from bson import ObjectId

pending_users = {}  # {username: {user_data, otp_token}}
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(32)

CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])
load_dotenv(".env")

mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise ValueError("MONGO_URI not set in .env")
app.config["MONGO_URI"] = mongo_uri
mongo = PyMongo(app)
db = mongo.db


app.config.update({
    'MAIL_SERVER': os.getenv('MAIL_SERVER', 'smtp.gmail.com'),
    'MAIL_PORT': int(os.getenv('MAIL_PORT', 587)),
    'MAIL_USE_TLS': os.getenv('MAIL_USE_TLS', 'true').lower() == 'true',
    'MAIL_USERNAME': os.getenv('MAIL_USERNAME'),
    'MAIL_PASSWORD': os.getenv('MAIL_PASSWORD')
})

if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
    print("⚠️  WARNING: MAIL_USERNAME/MAIL_PASSWORD missing")

mail = Mail(app)

ALLOWED_DOMAINS = {
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
    'icloud.com', 'aol.com', 'protonmail.com', 'alibto.com'
}

def is_valid_email(email):
    """✅ FIXED: Correct regex escapes"""
    if not email or not isinstance(email, str):
        return False, "Email is required"
    email = email.strip()
    if " " in email or '\n' in email or '\r' in email:
        return False, "Email contains invalid characters"
    email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email_regex.match(email):
        return False, "Invalid email format"
    domain = email.lower().split('@')[-1]
    if domain not in ALLOWED_DOMAINS:
        return False, f"Only these domains allowed: {', '.join(ALLOWED_DOMAINS)}"
    return True, "Email is valid"

def is_valid_password(password):
    """✅ Password validation"""
    if not password or not isinstance(password, str):
        return False, "Password is required"
    password = password.strip()
    if " " in password or '\n' in password or '\r' in password:
        return False, "Password contains invalid characters"
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    return True, "Password is valid"

def generate_otp():
    """Secure 6-digit OTP"""
    return f"{secrets.randbelow(900000) + 100000:06d}"

def hash_otp(otp):
    """✅ ADDED: SHA256 hash for resend-otp"""
    return hashlib.sha256(otp.encode()).hexdigest()

# 🔄 NEW: /newlogin - NO DATABASE UNTIL VERIFIED!
@app.route("/newlogin", methods=["POST"])
def newlogin():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "invalid_json"}), 400
        
        # ✅ EXTRACT variables FIRST (no yellow line!)
        username = data.get("username", "").strip()
        password = data.get("password", "")
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        phoneNumber = data.get("phoneNumber", "").strip()
        college = data.get("college", "").strip()
        year = data.get("year", "").strip()
        major = data.get("major", "").strip()
        
        # Your existing validation (unchanged)
        if not all([username, password, name, email, phoneNumber, college, year, major]):
            return jsonify({"status": "please_fill_all_fields"}), 400
        
        is_valid_pwd, pwd_msg = is_valid_password(password)
        if not is_valid_pwd:
            return jsonify({"status": "invalid_password", "message": pwd_msg}), 400
        
        is_valid_email_result, email_msg = is_valid_email(email)
        if not is_valid_email_result:
            return jsonify({"status": "invalid_email", "message": email_msg}), 400
        
        if db.test.find_one({"_id": username}):
            return jsonify({"status": "username_taken"}), 400
        if db.test.find_one({"email": email}):
            return jsonify({"status": "email_registered"}), 400
        
        # Generate OTP
        otp = generate_otp()
        expires = int((datetime.now(UTC) + timedelta(minutes=10)).timestamp() * 1000)
        data_str = f"{email}.{otp}.{expires}"
        hash_value = hmac.new(app.secret_key.encode(), data_str.encode(), hashlib.sha256).hexdigest()
        otp_token = f"{hash_value}.{expires}"
        
        # ✅ STORE in memory
        pending_users[username] = {
            'user_data': data,
            'otp_token': otp_token,
            'created': datetime.now(UTC)
        }
        
        # Send email
        try:
            msg = Message(subject="Verify Email - OTP", recipients=[email], sender=app.config['MAIL_USERNAME'])
            msg.body = f"Your OTP: {otp}\nUsername: {username}\nValid 10 min."
            mail.send(msg)
        except:
            return jsonify({"status": "email_service_error"}), 500
        
        # ✅ NO YELLOW LINE - username defined above!
        return jsonify({
            "status": "otp_sent",
            "message": "OTP sent to email!",
            "username": username  # ✅ PERFECTLY VALID!
        }), 200
        
    except Exception as e:
        return jsonify({"status": "internal_error"}), 500

# 🔄 NEW: /verify-otp - Verify THEN save to DB
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        otp = data.get("otp", "").strip()
        
        # ✅ PERFECT UX: Username + OTP ONLY!
        if not username or not otp or len(otp) != 6:
            return jsonify({"status": "invalid_otp_format"}), 400
        
        # Lookup stored user data
        if username not in pending_users:
            return jsonify({"status": "user_not_found"}), 404
        
        user_info = pending_users[username]
        otp_token = user_info['otp_token']
        user_data = user_info['user_data']
        email = user_data.get("email", "").strip()
        
        # Verify token expiry & hash
        try:
            hash_value, expires_str = otp_token.split(".")
            expires = int(expires_str)
        except:
            return jsonify({"status": "invalid_token"}), 400
        
        now = int(datetime.now(UTC).timestamp() * 1000)
        if now > expires:
            return jsonify({"status": "otp_expired"}), 400
        
        data_str = f"{email}.{otp}.{expires}"
        expected_hash = hmac.new(
            app.secret_key.encode(), 
            data_str.encode(), 
            hashlib.sha256
        ).hexdigest()
        
        if expected_hash == hash_value:
            # Save to database
            db_user = {
                "_id": username,
                "password": generate_password_hash(user_data["password"], method='pbkdf2:sha256:600000'),
                "name": user_data["name"],
                "email": email,
                "phoneNumber": user_data["phoneNumber"],
                "college": user_data["college"],
                "year": user_data["year"],
                "major": user_data["major"],
                "is_verified": True,
                "failed_attempts": 0,
                "created_at": datetime.now(UTC)
            }
            
            db.test.insert_one(db_user)
            
            # Cleanup
            del pending_users[username]
            
            return jsonify({
                "status": "verified_successfully",
                "message": "Registration complete! You can now login."
            }), 200
        else:
            return jsonify({"status": "invalid_otp"}), 400
            
    except Exception as e:
        app.logger.error(f"Verify OTP error: {str(e)}")
        return jsonify({"status": "internal_error"}), 500

@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        
        if not username:
            return jsonify({"status": "username_required"}), 400
        
        user = db.test.find_one({"_id": username})
        if not user or user.get("is_verified"):
            return jsonify({"status": "user_not_found"}), 404
        
        otp = generate_otp()
        otp_expiry = datetime.now(UTC) + timedelta(minutes=10)
        
        db.test.update_one(
            {"_id": username},
            {"$set": {"otp_hash": hash_otp(otp), "otp_expiry": otp_expiry}}
        )
        
        try:
            msg = Message(
                subject="Your New OTP Code", 
                recipients=[user["email"]],
                sender=app.config['MAIL_USERNAME']
            )
            msg.body = f"""Your new OTP code is: {otp}

Valid for 10 minutes only.
If you didn't request this, ignore this email."""
            mail.send(msg)
            return jsonify({"status": "otp_resent", "message": "New OTP sent"}), 200
        except Exception as e:
            return jsonify({"status": "email_failed"}), 500
            
    except Exception as e:
        return jsonify({"status": "internal_error"}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "")
        
        if not username or not password:
            return jsonify({"status": "missing_fields", "login": False}), 400
        
        user = db.test.find_one({"_id": username})
        if not user:
            return jsonify({"status": "invalid_credentials", "login": False}), 401
        
        if not check_password_hash(user.get("password"), password):
            return jsonify({"status": "invalid_credentials", "login": False}), 401
        
        if not user.get("is_verified", False):
            return jsonify({
                "status": "email_not_verified", 
                "login": False,
                "message": "Please verify your email first"
            }), 401
        
        return jsonify({
            "status": "login_success",
            "login": True,
            "username": user.get("_id"),
            "name": user.get("name"),
            "email": user.get("email")
        }), 200
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({"status": "internal_error", "login": False}), 500

@app.route("/api/user/<username>", methods=["GET"])
def get_user(username):
    try:
        user = db.test.find_one({"_id": username})
        if user:
            user_data = {
                "username": user.get("_id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "phoneNumber": user.get("phoneNumber"),
                "college": user.get("college"),
                "year": user.get("year"),
                "major": user.get("major"),
                "is_verified": user.get("is_verified", False)
            }
            return jsonify({"status": "found", "user": user_data}), 200
        return jsonify({"status": "not_found"}), 404
    except Exception as e:
        app.logger.error(f"Get user error: {str(e)}")
        return jsonify({"status": "internal_error"}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
