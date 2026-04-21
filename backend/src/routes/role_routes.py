from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from src.dao.role_dao import RoleDAO
import psycopg2
from src.config.config import Config

role_bp = Blueprint('role', __name__)
role_dao = RoleDAO()

@role_bp.route('/roles', methods=['GET'])
@jwt_required()
def list_roles():
    return jsonify(role_dao.get_all_with_permissions()), 200

@role_bp.route('/permissions', methods=['GET'])
@jwt_required()
def list_permissions():
    conn = psycopg2.connect(**Config.get_db_config())
    cursor = conn.cursor()
    cursor.execute("SELECT id, code, description FROM permissions")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([{"id": r[0], "code": r[1], "description": r[2]} for r in rows]), 200

@role_bp.route('/roles', methods=['POST'])
@jwt_required()
def create_role():
    if get_jwt().get("role") != "ADMIN":
        return jsonify({"error": "Unauthorized"}), 403
    data = request.json
    role_dao.create_with_permissions(data['name'], data['permissions'])
    return jsonify({"message": "Role created"}), 201