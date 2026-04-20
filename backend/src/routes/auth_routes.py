from flask import Blueprint, jsonify, request
from services.user_service import UserService

auth_bp = Blueprint('auth', __name__)
user_service = UserService()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    result = user_service.authenticate(email, password)
    
    if result:
        return jsonify(result), 200
        
    return jsonify({"error": "Invalid email or password"}), 401