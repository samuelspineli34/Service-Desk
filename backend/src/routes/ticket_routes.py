from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from services.ticket_service import TicketService

ticket_bp = Blueprint('ticket', __name__)
ticket_service = TicketService()

@ticket_bp.route('/ticket', methods=['GET'])
@jwt_required()
def get_all():
    return jsonify(ticket_service.get_all_tickets()), 200

@ticket_bp.route('/ticket', methods=['POST'])
@jwt_required()
def create():
    ticket_service.create_ticket(request.json)
    return jsonify({"message": "Ticket created"}), 201

@ticket_bp.route('/ticket/<uuid:ticket_id>', methods=['PUT'])
@jwt_required()
def update(ticket_id):
    # Opcional: Validar se o usuário é o dono do ticket ou técnico
    ticket_service.update_ticket(str(ticket_id), request.json)
    return jsonify({"message": "Updated"}), 200

@ticket_bp.route('/ticket/<uuid:ticket_id>', methods=['DELETE'])
@jwt_required()
def delete(ticket_id):
    user_role = get_jwt().get("role")
    # Regra: Usuário comum (USER) não deleta tickets
    if user_role == "USER":
        return jsonify({"error": "Technician or Admin privileges required"}), 403
        
    ticket_service.delete_ticket(str(ticket_id))
    return jsonify({"message": "Deleted (Soft Delete)"}), 200