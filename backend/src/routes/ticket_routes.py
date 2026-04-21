from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from services.ticket_service import TicketService

ticket_bp = Blueprint('ticket', __name__)
ticket_service = TicketService()

@ticket_bp.route('/ticket', methods=['GET'])
@jwt_required()
def get_all():
    user_id = get_jwt_identity()
    role = get_jwt().get("role")
    
    # Se for USER, filtra. Se for STAFF (Admin/Tech), traz tudo.
    filter_id = user_id if role == "USER" else None

    try:
        # Tenta chamar o service passando o filter_id
        tickets = ticket_service.get_all_tickets(user_id=filter_id)
        return jsonify(tickets), 200
    except Exception as e:
        print(f"--- ERRO NA ROTA: {str(e)} ---")
        return jsonify({"error": str(e)}), 500

@ticket_bp.route('/ticket/<uuid:ticket_id>/rate', methods=['PUT'])
@jwt_required()
def rate(ticket_id):
    user_id = get_jwt_identity() # ID de quem está logado (Dono do chamado)
    rating = request.json.get('rating')
    
    if not rating or not (1 <= rating <= 5):
        return jsonify({"error": "Invalid rating"}), 400

    success = ticket_service.rate_ticket(str(ticket_id), rating, user_id)
    
    if success:
        return jsonify({"message": "Ticket rated successfully"}), 200
    return jsonify({"error": "Failed to rate ticket"}), 500

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

@ticket_bp.route('/ticket/<uuid:ticket_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(ticket_id):
    comments = ticket_service.get_ticket_comments(str(ticket_id))
    return jsonify(comments), 200

@ticket_bp.route('/ticket/<uuid:ticket_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(ticket_id):
    user_id = get_jwt_identity() # Pega quem está comentando pelo Token
    data = request.json
    
    if not data.get('text'):
        return jsonify({"error": "Comment text is required"}), 400
        
    ticket_service.add_comment(str(ticket_id), user_id, data['text'])
    return jsonify({"message": "Comment added"}), 201