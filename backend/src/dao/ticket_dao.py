import psycopg2
from config.config import Config
from dto.ticket_dto import TicketDTO
from datetime import datetime

class TicketDAO:
    def get_connection(self):
        return psycopg2.connect(**Config.get_db_config(), application_name='ServiceDesk', client_encoding='utf8')

    def get_all(self, user_id=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Mudamos para LEFT JOIN: se o usuário der erro, o ticket ainda aparece
        # Adicionamos t.rating na query para não dar erro de contagem de colunas
        query = """
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, 
                t.user_id, COALESCE(u.name, 'Unknown User'), t.created_at, t.rating 
            FROM tickets t 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE t.deleted_at IS NULL
        """
        
        if user_id:
            query += " AND t.user_id = %s"
            cursor.execute(query + " ORDER BY t.created_at DESC", (user_id,))
        else:
            cursor.execute(query + " ORDER BY t.created_at DESC")

        rows = cursor.fetchall()

        tickets = [TicketDTO(*row) for row in rows]
        
        cursor.close()
        conn.close()
        return tickets

    def rate_ticket(self, ticket_id, rating, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Só permite dar nota se o ticket estiver CLOSED e pertencer ao usuário
        query = """
            UPDATE tickets 
            SET rating = %s 
            WHERE id = %s AND user_id = %s AND status = 'CLOSED'
        """
        cursor.execute(query, (rating, ticket_id, user_id))
        conn.commit()
        cursor.close()
        conn.close()

    def create(self, data):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tickets (title, description, priority, user_id, status) VALUES (%s, %s, %s, %s, %s)",
            (data['title'], data['description'], data['priority'], data['user_id'], data.get('status', 'OPEN'))
        )
        conn.commit() # ESSENCIAL!
        cursor.close()
        conn.close()

    def update(self, ticket_id, data):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            UPDATE tickets 
            SET title=%s, description=%s, status=%s, priority=%s, user_id=%s, updated_at=NOW() 
            WHERE id=%s AND deleted_at IS NULL
        """
        cursor.execute(query, (data['title'], data['description'], data['status'], data['priority'], data['user_id'], ticket_id))
        conn.commit()
        cursor.close()
        conn.close()

    def soft_delete(self, ticket_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Não removemos a linha, apenas carimbamos a data de deleção
        cursor.execute("UPDATE tickets SET deleted_at = NOW() WHERE id = %s", (ticket_id,))
        conn.commit()
        cursor.close()
        conn.close()