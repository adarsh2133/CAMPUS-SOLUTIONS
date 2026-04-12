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
# 🔴 REMOVED: unused "import hmac"
from datetime import datetime, timedelta, timezone

load_dotenv(".env")

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(32)

CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

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

# ============================================================
# Internal API Key
# ============================================================
# Only your Express server knows this key.
# Flask uses it to verify requests to protected endpoints are
# coming from Express — not a random person typing the URL.
# Add to .env: INTERNAL_API_KEY=your_random_secret_here
# Generate: python -c "import secrets; print(secrets.token_urlsafe(32))"
# ============================================================
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
if not INTERNAL_API_KEY:
    raise ValueError("INTERNAL_API_KEY not set in .env")

def is_authorized():
    """
    Returns True only if request carries the correct internal API key.
    Express sends this header on every call to protected endpoints.
    Direct browser or Postman requests without this header are rejected.
    """
    incoming_key = request.headers.get("X-Internal-Key")
    if not incoming_key or incoming_key != INTERNAL_API_KEY:
        return False
    return True

# ============================================================
# MongoDB Rate Limiting
# ============================================================
# Dedicated rate_limits collection — separate from user data.
# TTL index auto-deletes expired counters keeping collection clean.
# Compound index makes every IP + route lookup fast.
# ============================================================
db.rate_limits.create_index("expires_at", expireAfterSeconds=0)
db.rate_limits.create_index([("ip", 1), ("route", 1)])


def get_client_ip():
    """
    Get real client IP.
    Checks X-Forwarded-For first (set by Vercel/proxies),
    falls back to direct remote address.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr


# 🟢 FIXED: Wrapped entire function in try/except — fail closed.
#           Previously any MongoDB hiccup would bubble up, get caught
#           by the route's own except block, and silently bypass the
#           rate limit entirely. Now it blocks the request instead.
def check_rate_limit(route, max_requests, window_seconds):
    """
    Check and enforce rate limit for a given route.
    Returns (True, None) if allowed.
    Returns (False, response) if limit exceeded or error occurs.
    """
    try:
        ip = get_client_ip()
        now = now_utc()

        existing = db.rate_limits.find_one({"ip": ip, "route": route})

        if not existing:
            db.rate_limits.insert_one({
                "ip": ip,
                "route": route,
                "count": 1,
                "expires_at": now + timedelta(seconds=window_seconds)
            })
            return True, None

        expires_at = to_utc(existing.get("expires_at"))
        if expires_at and now > expires_at:
            db.rate_limits.replace_one(
                {"ip": ip, "route": route},
                {
                    "ip": ip,
                    "route": route,
                    "count": 1,
                    "expires_at": now + timedelta(seconds=window_seconds)
                }
            )
            return True, None

        if existing["count"] >= max_requests:
            seconds_left = int((expires_at - now).total_seconds()) if expires_at else window_seconds
            return False, (
                jsonify({
                    "status": "rate_limit_exceeded",
                    "message": f"Too many requests. Try again in {seconds_left} seconds."
                }),
                429
            )

        db.rate_limits.update_one(
            {"ip": ip, "route": route},
            {"$inc": {"count": 1}}
        )
        return True, None

    except Exception as e:
        # Fail closed — if rate limiting breaks, block the request
        # rather than letting everything through silently
        print(f"RATE LIMIT ERROR on {route}: {e}")
        return False, (
            jsonify({
                "status": "rate_limit_error",
                "message": "Service temporarily unavailable. Please try again."
            }),
            503
        )


# ============================================================
# Timezone Helpers
# ============================================================
UTC = timezone.utc

def to_utc(dt):
    """Re-attach UTC tzinfo to naive datetimes returned by PyMongo."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt

def now_utc():
    """Current time in UTC, always timezone-aware."""
    return datetime.now(UTC)


# ============================================================
# Rate Limit Config
# ============================================================
RATE_LIMITS = {
    "/newlogin":         {"max": 5,  "window": 3600},   # 5  per hour
    "/verify-otp":       {"max": 10, "window": 900},    # 10 per 15 min
    "/resend-otp":       {"max": 3,  "window": 3600},   # 3  per hour
    "/login":            {"max": 10, "window": 60},     # 10 per minute
    "/api/user":         {"max": 30, "window": 60},     # 30 per minute
    "/forgot-password":  {"max": 5,  "window": 3600},   # 5  per hour
    "/verify-reset-otp": {"max": 10, "window": 900},    # 10 per 15 min
    "/reset-password":   {"max": 5,  "window": 3600},   # 5  per hour
}

ALLOWED_DOMAINS = {
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'kobace.com'
}

def is_valid_email(email):
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
    if not password or not isinstance(password, str):
        return False, "Password is required"
    password = password.strip()
    if " " in password or '\n' in password or '\r' in password:
        return False, "Password contains invalid characters"
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    return True, "Password is valid"

def generate_otp():
    return f"{secrets.randbelow(900000) + 100000:06d}"

def hash_otp(otp):
    return hashlib.sha256(otp.encode()).hexdigest()


# ========== REGISTRATION ROUTES ==========

@app.route("/newlogin", methods=["POST"])
def newlogin():
    rl = RATE_LIMITS["/newlogin"]
    allowed, err = check_rate_limit("/newlogin", rl["max"], rl["window"])
    if not allowed:
        return err

    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "invalid_json"}), 400

        username = data.get("username", "").strip()
        password = data.get("password", "")
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        phoneNumber = data.get("phoneNumber", "").strip()
        college = data.get("college", "").strip()
        year = data.get("year", "").strip()
        major = data.get("major", "").strip()
        linkedin = data.get("linkedin","").strip()

        if not all([username, password, name, email, phoneNumber, college, year, major,linkedin]):
            return jsonify({"status": "please_fill_all_fields"}), 400

        is_valid_pwd, pwd_msg = is_valid_password(password)
        if not is_valid_pwd:
            return jsonify({"status": "invalid_password", "message": pwd_msg}), 400

        is_valid_email_result, email_msg = is_valid_email(email)
        if not is_valid_email_result:
            return jsonify({"status": "invalid_email", "message": email_msg}), 400

        existing_user = db.test.find_one({"_id": username})
        if existing_user and existing_user.get("is_verified"):
            return jsonify({"status": "username_taken"}), 400

        existing_email = db.test.find_one({"email": email})
        if existing_email and existing_email.get("is_verified") and existing_email.get("_id") != username:
            return jsonify({"status": "email_registered"}), 400

        otp = generate_otp()

        db_user = {
            "_id": username,
            "password": generate_password_hash(password, method='pbkdf2:sha256:600000'),
            "name": name,
            "email": email,
            "phoneNumber": phoneNumber,
            "college": college,
            "year": year,
            "major": major,
            "linkedin":linkedin,
            "is_verified": False,
            "failed_attempts": 0,
            "created_at": now_utc(),
            "otp": {
                "hash": hash_otp(otp),
                "expiry": now_utc() + timedelta(minutes=10),
                "type": "registration"
            }
        }

        db.test.update_one({"_id": username}, {"$set": db_user}, upsert=True)

        # 🟢 FIXED: Replaced bare except: with except Exception as e
        #           so the real email error is visible in terminal
        try:
            msg = Message(subject="Verify Email - OTP", recipients=[email], sender=app.config['MAIL_USERNAME'])
            msg.body = f"Your OTP: {otp}\nUsername: {username}\nValid 10 min."
            mail.send(msg)
        except Exception as e:
            print(f"EMAIL ERROR in newlogin: {e}")
            return jsonify({"status": "email_service_error"}), 500

        return jsonify({"status": "otp_sent", "message": "OTP sent to email!", "username": username}), 200

    except Exception as e:
        print(f"ERROR in newlogin: {e}")
        return jsonify({"status": "internal_error"}), 500


@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    rl = RATE_LIMITS["/verify-otp"]
    allowed, err = check_rate_limit("/verify-otp", rl["max"], rl["window"])
    if not allowed:
        return err

    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        otp = data.get("otp", "").strip()

        if not username or not otp or len(otp) != 6:
            return jsonify({"status": "invalid_otp_format"}), 400

        user = db.test.find_one({"_id": username})
        if not user or user.get("is_verified"):
            return jsonify({"status": "user_not_found"}), 404

        user_otp = user.get("otp", {})

        if user_otp.get("type") != "registration":
            return jsonify({"status": "invalid_otp_type"}), 400

        expiry = to_utc(user_otp.get("expiry"))
        if not expiry:
            return jsonify({"status": "otp_expired"}), 400
        if now_utc() > expiry:
            return jsonify({"status": "otp_expired"}), 400

        if user_otp.get("hash") == hash_otp(otp):
            db.test.update_one(
                {"_id": username},
                {"$set": {"is_verified": True}, "$unset": {"otp": ""}}
            )
            return jsonify({"status": "verified_successfully", "message": "Registration complete! You can now login."}), 200
        else:
            return jsonify({"status": "invalid_otp"}), 400

    except Exception as e:
        print(f"ERROR in verify_otp: {e}")
        return jsonify({"status": "internal_error"}), 500


@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    rl = RATE_LIMITS["/resend-otp"]
    allowed, err = check_rate_limit("/resend-otp", rl["max"], rl["window"])
    if not allowed:
        return err

    try:
        data = request.get_json()
        username = data.get("username", "").strip()

        if not username:
            return jsonify({"status": "username_required"}), 400

        user = db.test.find_one({"_id": username})
        if not user or user.get("is_verified"):
            return jsonify({"status": "user_not_found"}), 404

        otp = generate_otp()

        db.test.update_one(
            {"_id": username},
            {"$set": {
                "otp": {
                    "hash": hash_otp(otp),
                    "expiry": now_utc() + timedelta(minutes=10),
                    "type": "registration"
                }
            }}
        )

        try:
            msg = Message(subject="Your New OTP Code", recipients=[user["email"]], sender=app.config['MAIL_USERNAME'])
            msg.body = f"Your new OTP code is: {otp}\n\nValid for 10 minutes only.\nIf you didn't request this, ignore this email."
            mail.send(msg)
            return jsonify({"status": "otp_resent", "message": "New OTP sent"}), 200
        except Exception as e:
            print(f"EMAIL ERROR in resend_otp: {e}")
            return jsonify({"status": "email_failed"}), 500

    except Exception as e:
        print(f"ERROR in resend_otp: {e}")
        return jsonify({"status": "internal_error"}), 500


# ========== LOGIN & GET USER ==========

@app.route("/login", methods=["POST"])
def login():
    rl = RATE_LIMITS["/login"]
    allowed, err = check_rate_limit("/login", rl["max"], rl["window"])
    if not allowed:
        return err

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
            return jsonify({"status": "email_not_verified", "login": False, "message": "Please verify your email first"}), 401

        return jsonify({
            "status": "login_success",
            "login": True,
            "username": user.get("_id"),
            "name": user.get("name"),
            "email": user.get("email")
        }), 200

    except Exception as e:
        print(f"ERROR in login: {e}")
        return jsonify({"status": "internal_error", "login": False}), 500


@app.route("/api/user/<username>", methods=["GET"])
def get_user(username):
    if not is_authorized():
        return jsonify({"status": "unauthorized"}), 401

    rl = RATE_LIMITS["/api/user"]
    allowed, err = check_rate_limit("/api/user", rl["max"], rl["window"])
    if not allowed:
        return err

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
        print(f"ERROR in get_user: {e}")
        return jsonify({"status": "internal_error"}), 500


# ========== FORGOT PASSWORD ROUTES ==========

@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    rl = RATE_LIMITS["/forgot-password"]
    allowed, err = check_rate_limit("/forgot-password", rl["max"], rl["window"])
    if not allowed:
        return err

    try:
        data = request.get_json()
        email = data.get("email", "").strip()

        if not email:
            return jsonify({"status": "email_required"}), 400

        is_valid_email_result, email_msg = is_valid_email(email)
        if not is_valid_email_result:
            return jsonify({"status": "invalid_email", "message": email_msg}), 400

        user = db.test.find_one({"email": email, "is_verified": True})
        if not user:
            return jsonify({"status": "user_not_found"}), 404

        otp = generate_otp()

        db.test.update_one(
            {"email": email},
            {"$set": {
                "otp": {
                    "hash": hash_otp(otp),
                    "expiry": now_utc() + timedelta(minutes=10),
                    "type": "reset"
                }
            }}
        )

        try:
            msg = Message(subject="Password Reset OTP", recipients=[email], sender=app.config['MAIL_USERNAME'])
            msg.body = f"Password Reset OTP: {otp}\n\nThis OTP is valid for 10 minutes only.\nUsername: {user['_id']}\n\nIf you didn't request this, please ignore this email."
            mail.send(msg)
            return jsonify({"status": "otp_sent", "message": "Password reset OTP sent to your email!", "email": email}), 200
        except Exception as e:
            print(f"EMAIL ERROR in forgot_password: {e}")
            return jsonify({"status": "email_service_error"}), 500

    except Exception as e:
        print(f"ERROR in forgot_password: {e}")
        return jsonify({"status": "internal_error"}), 500


@app.route("/verify-reset-otp", methods=["POST"])
def verify_reset_otp():
    rl = RATE_LIMITS["/verify-reset-otp"]
    allowed, err = check_rate_limit("/verify-reset-otp", rl["max"], rl["window"])
    if not allowed:
        return err

    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        otp = data.get("otp", "").strip()
        action = data.get("action", "").strip()

        if not email:
            return jsonify({"status": "email_required"}), 400

        user = db.test.find_one({"email": email, "is_verified": True})
        if not user:
            return jsonify({"status": "user_not_found"}), 404

        # ========== RESEND ACTION ==========
        if action == "resend":
            new_otp = generate_otp()

            db.test.update_one(
                {"email": email},
                {"$set": {
                    "otp": {
                        "hash": hash_otp(new_otp),
                        "expiry": now_utc() + timedelta(minutes=10),
                        "type": "reset"
                    }
                }}
            )

            try:
                msg = Message(subject="Password Reset OTP - RESENT", recipients=[email], sender=app.config['MAIL_USERNAME'])
                msg.body = f"Password Reset OTP (RESENT): {new_otp}\n\nThis OTP is valid for 10 minutes only.\nUsername: {user['_id']}\n\nIf you didn't request this, please ignore this email."
                mail.send(msg)
                return jsonify({"status": "otp_resent", "message": "New password reset OTP sent to your email!", "email": email}), 200
            except Exception as e:
                print(f"EMAIL ERROR in verify_reset_otp resend: {e}")
                return jsonify({"status": "email_service_error"}), 500

        # ========== VERIFY ACTION ==========
        if not otp or len(otp) != 6:
            return jsonify({"status": "invalid_otp_format"}), 400

        user_otp = user.get("otp", {})

        if not user_otp:
            return jsonify({"status": "request_not_found"}), 404

        if user_otp.get("type") != "reset":
            return jsonify({"status": "invalid_otp_type"}), 400

        expiry = to_utc(user_otp.get("expiry"))
        if not expiry:
            return jsonify({"status": "otp_expired"}), 400
        if now_utc() > expiry:
            return jsonify({"status": "otp_expired"}), 400

        if user_otp.get("hash") == hash_otp(otp):
            db.test.update_one(
                {"email": email},
                {"$set": {
                    "otp": {
                        "type": "reset_granted",
                        "reset_granted_until": now_utc() + timedelta(minutes=10)
                    }
                }}
            )
            return jsonify({
                "status": "otp_verified",
                "message": "OTP verified! Enter new password.",
                "username": user["_id"],
                "email": email
            }), 200
        else:
            return jsonify({"status": "invalid_otp"}), 400

    except Exception as e:
        print(f"ERROR in verify_reset_otp: {e}")
        return jsonify({"status": "internal_error"}), 500


@app.route("/reset-password", methods=["POST"])
def reset_password():
    rl = RATE_LIMITS["/reset-password"]
    allowed, err = check_rate_limit("/reset-password", rl["max"], rl["window"])
    if not allowed:
        return err

    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        username = data.get("username", "").strip()
        new_password = data.get("new_password", "")

        if not all([email, username, new_password]):
            return jsonify({"status": "missing_fields"}), 400

        is_valid_pwd, pwd_msg = is_valid_password(new_password)
        if not is_valid_pwd:
            return jsonify({"status": "invalid_password", "message": pwd_msg}), 400

        user = db.test.find_one({"email": email, "_id": username})
        if not user:
            return jsonify({"status": "invalid_user"}), 400

        user_otp = user.get("otp", {})

        if user_otp.get("type") != "reset_granted":
            return jsonify({"status": "session_expired"}), 400

        reset_until = to_utc(user_otp.get("reset_granted_until"))
        if not reset_until:
            return jsonify({"status": "session_expired"}), 400
        if now_utc() > reset_until:
            return jsonify({"status": "session_expired"}), 400

        result = db.test.update_one(
            {"_id": username},
            {
                "$set": {
                    "password": generate_password_hash(new_password, method='pbkdf2:sha256:600000'),
                    "failed_attempts": 0
                },
                "$unset": {"otp": ""}
            }
        )

        if result.modified_count == 1:
            return jsonify({"status": "password_updated", "message": "Password updated successfully! You can now login."}), 200
        else:
            return jsonify({"status": "update_failed"}), 500

    except Exception as e:
        print(f"ERROR in reset_password: {e}")
        return jsonify({"status": "internal_error"}), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)