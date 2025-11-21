from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import re

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'pro_database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), default="General")
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), default="expense") 
    date = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_deleted = db.Column(db.Boolean, default=False) 

with app.app_context():
    db.create_all()

# --- Helper ---
def is_password_strong(password):
    if len(password) < 8: return False
    if not re.search(r"[a-zA-Z]", password): return False
    if not re.search(r"\d", password): return False
    if not re.search(r"[ !@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", password): return False
    return True

# --- Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not all(k in data for k in ("fullname", "email", "password", "confirmPassword")):
        return jsonify({"message": "All fields are required"}), 400
    
    if data['password'] != data['confirmPassword']:
        return jsonify({"message": "Passwords do not match"}), 400
        
    if not is_password_strong(data['password']):
        return jsonify({"message": "Password too weak. Use 8+ chars, 1 number, 1 symbol."}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 409
    
    hashed_pw = generate_password_hash(data['password'])
    new_user = User(fullname=data['fullname'], email=data['email'], password_hash=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Account created successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        return jsonify({"message": "Login success", "user": {"id": user.id, "fullname": user.fullname, "email": user.email}}), 200
    return jsonify({"message": "Invalid email or password"}), 401

@app.route('/api/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    if not user: return jsonify({"message": "User not found"}), 404
    
    user.fullname = data.get('fullname', user.fullname)
    user.email = data.get('email', user.email)
    
    # Update Password if provided
    new_pass = data.get('password')
    if new_pass:
        if not is_password_strong(new_pass):
             return jsonify({"message": "New password is too weak. Use 8+ chars, 1 number, 1 symbol."}), 400
        user.password_hash = generate_password_hash(new_pass)
        
    try:
        db.session.commit()
        return jsonify({"message": "Profile updated", "user": {"id": user.id, "fullname": user.fullname, "email": user.email}}), 200
    except:
        return jsonify({"message": "Email might be taken"}), 409

@app.route('/api/dashboard/<int:user_id>', methods=['GET'])
def get_dashboard_data(user_id):
    transactions = Expense.query.filter_by(user_id=user_id, is_deleted=False).order_by(Expense.date.desc()).all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    balance = total_income - total_expense

    current_month = datetime.utcnow().month
    this_month_spent = sum(t.amount for t in transactions if t.type == 'expense' and t.date.month == current_month)
    
    category_data = {}
    for t in transactions:
        if t.type == 'expense':
            category_data[t.category] = category_data.get(t.category, 0) + t.amount

    formatted_transactions = [{
        "id": t.id,
        "title": t.title,
        "amount": t.amount,
        "category": t.category,
        "type": t.type,
        "date": t.date.strftime("%Y-%m-%d")
    } for t in transactions]

    return jsonify({
        "financials": {
            "income": total_income,
            "expense": total_expense,
            "balance": balance,
            "month_spent": this_month_spent
        },
        "transactions": formatted_transactions,
        "chart_data": {
            "labels": list(category_data.keys()),
            "values": list(category_data.values())
        }
    }), 200

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.get_json()
    new_expense = Expense(
        title=data['title'],
        amount=float(data['amount']),
        category=data.get('category', 'General'),
        type=data.get('type', 'expense'),
        user_id=data['user_id'],
        date=datetime.utcnow()
    )
    db.session.add(new_expense)
    db.session.commit()
    return jsonify({"message": "Saved"}), 201

@app.route('/api/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    data = request.get_json()
    expense = Expense.query.get(id)
    if not expense: return jsonify({"message": "Not found"}), 404
    
    expense.title = data['title']
    expense.amount = float(data['amount'])
    expense.category = data['category']
    expense.type = data['type']
    
    db.session.commit()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    expense = Expense.query.get(id)
    if expense:
        expense.is_deleted = True
        db.session.commit()
        return jsonify({"message": "Moved to trash"}), 200
    return jsonify({"message": "Not found"}), 404

@app.route('/api/trash/<int:user_id>', methods=['GET'])
def get_trash(user_id):
    deleted = Expense.query.filter_by(user_id=user_id, is_deleted=True).order_by(Expense.date.desc()).all()
    return jsonify([{
        "id": t.id, "title": t.title, "amount": t.amount, "date": t.date.strftime("%Y-%m-%d"), "type": t.type
    } for t in deleted]), 200

@app.route('/api/restore/<int:id>', methods=['POST'])
def restore_expense(id):
    expense = Expense.query.get(id)
    if expense:
        expense.is_deleted = False
        db.session.commit()
        return jsonify({"message": "Restored"}), 200
    return jsonify({"message": "Not found"}), 404


@app.route('/')
def home():
    return "Backend is running successfully! Open index.html to use the app."

if __name__ == '__main__':
    app.run(debug=True, port=5000)