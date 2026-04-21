from src.dao.ticket_dao import TicketDAO
from src.dao.comments_dao import CommentDAO

class TicketService:
    def __init__(self):
        self.dao = TicketDAO()
        self.comments_dao = CommentDAO()

    def get_all_tickets(self, user_id=None): # <--- CERTIFIQUE-SE DO user_id=None
        try:
            # Chama o DAO passando o user_id
            tickets_dto = self.dao.get_all(user_id=user_id)
            return [t.to_dict() for t in tickets_dto]
        except Exception as e:
            print(f"--- ERRO NO SERVICE: {str(e)} ---")
            return []

    def create_ticket(self, data):
        try:
            # Aqui você poderia validar se o user_id ainda existe e não está deletado
            self.dao.create(data)
        except Exception as e:
            print(f"Service Error (Create): {e}")

    def update_ticket(self, ticket_id, data, updated_by_user_id):
        try:
            # 1. Busca o ticket atual para comparar valores
            old_ticket = self.dao.get_by_id(ticket_id)
            if not old_ticket:
                return False

            # 2. Executa a atualização no banco
            self.dao.update(ticket_id, data)
            
            # 3. Gera logs de auditoria se houve mudança
            if old_ticket.status != data['status']:
                self.dao.add_audit_log(ticket_id, updated_by_user_id, 'STATUS_CHANGE', old_ticket.status, data['status'])
                
            if old_ticket.priority != data['priority']:
                self.dao.add_audit_log(ticket_id, updated_by_user_id, 'PRIORITY_CHANGE', old_ticket.priority, data['priority'])
            
            return True
        except Exception as e:
            print(f"Service Error (Update): {e}")
            return False

    def delete_ticket(self, ticket_id):
        try:
            # Chamamos o Soft Delete no DAO
            self.dao.soft_delete(ticket_id)
        except Exception as e:
            print(f"Service Error (Delete): {e}")
            
    def add_comment(self, ticket_id, user_id, text):
        return self.comments_dao.add_comment(ticket_id, user_id, text)

    def get_ticket_comments(self, ticket_id):
        return self.comments_dao.get_by_ticket(ticket_id)
    
    def rate_ticket(self, ticket_id, rating, user_id):
        try:
            self.dao.rate_ticket(ticket_id, rating, user_id)
            return True
        except Exception as e:
            print(f"Service Error (Rating): {e}")
            return False
        
    def get_history(self, ticket_id):
        # O Service apenas repassa o pedido para o DAO
        return self.dao.get_history(ticket_id)