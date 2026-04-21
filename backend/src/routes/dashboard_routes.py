from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from src.config.config import Config
import psycopg2

dash_bp = Blueprint('dashboard', __name__)

@dash_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_stats():
    conn = psycopg2.connect(**Config.get_db_config())
    cursor = conn.cursor()
    
    query = """
        SELECT 
            COUNT(*) FILTER (WHERE status = 'OPEN' OR status = 'IN_PROGRESS') as active,
            COUNT(*) FILTER (WHERE status = 'CLOSED') as resolved,
            COALESCE(ROUND(AVG(rating), 1), 0) as avg_rating,
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users
        FROM tickets 
        WHERE deleted_at IS NULL
    """
    cursor.execute(query)
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return jsonify({
        "openTickets": row[0],
        "resolvedTickets": row[1],
        "averageRating": float(row[2]),
        "totalUsers": row[3]
    }), 200