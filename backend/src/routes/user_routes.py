from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from services.user_service import UserService

user_bp = Blueprint('user', __name__)
user_service = UserService()

@user_bp.route('/user', methods=['GET'])
@jwt_required()
def get_all():
    return jsonify(user_service.get_all_users()), 200

@user_bp.route('/user/<uuid:user_id>', methods=['GET'])
@jwt_required()
def get_one(user_id):
    user = user_service.get_user_by_id(str(user_id))
    return jsonify(user) if user else (jsonify({"error": "Not found"}), 404)

@user_bp.route('/user', methods=['POST'])
@jwt_required()
def create():
    if get_jwt().get("role") != "ADMIN":
        return jsonify({"error": "Admin access required"}), 403
    user_service.create_user(request.json)
    return jsonify({"message": "Created"}), 201

@user_bp.route('/user/<uuid:user_id>', methods=['PUT'])
@jwt_required()
def update(user_id):
    if get_jwt().get("role") != "ADMIN":
        return jsonify({"error": "Admin access required"}), 403
    user_service.update_user(str(user_id), request.json)
    return jsonify({"message": "Updated"}), 200

@user_bp.route('/user/<uuid:user_id>', methods=['DELETE'])
@jwt_required()
def delete(user_id):
    if get_jwt().get("role") != "ADMIN":
        return jsonify({"error": "Admin access required"}), 403
    user_service.delete_user(str(user_id))
    return jsonify({"message": "Deleted"}), 200

@user_bp.route('/me/password', methods=['PUT'])
@jwt_required()
def change_my_password():
    user_id = get_jwt_identity() # Pega o ID direto do Token
    data = request.json
    
    success = user_service.change_password(
        user_id, 
        data.get('oldPassword'), 
        data.get('newPassword')
    )
    
    if success:
        return jsonify({"message": "Password updated successfully"}), 200
    return jsonify({"error": "Current password incorrect"}), 400