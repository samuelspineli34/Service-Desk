import psycopg2
from src.config.config import Config
from src.dto.ticket_dto import TicketDTO
from datetime import datetime

class TicketDAO:
    def get_connection(self):
        config = Config.get_db_config()
        
        try:
            if isinstance(config, str):
                # Se for a URL do Render
                return psycopg2.connect(config, application_name='ServiceDesk')
            else:
                # Se for o dicionário local
                return psycopg2.connect(**config, application_name='ServiceDesk')
        except UnicodeDecodeError:
            # Esse try/except resolve o problema do erro com acento do Postgres no Windows
            raise Exception("ERRO FATAL: O PostgreSQL recusou a conexão. Verifique se DB_USER, DB_PASSWORD e DB_NAME estão corretos no seu arquivo .env")

    def get_all(self, user_id=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Adicionado t.resolution no final da query
        query = """
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, 
                t.user_id, COALESCE(u.name, 'Unknown User'), t.created_at, t.rating, t.resolution 
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

        # O construtor do TicketDTO precisará aceitar 10 parâmetros agora
        tickets = [TicketDTO(*row) for row in rows]
        
        cursor.close()
        conn.close()
        return tickets
    
    def get_by_id(self, ticket_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Adicionado resolution no final da query e preenchido NULL para o nome do usuário
        query = "SELECT id, title, description, status, priority, user_id, NULL, created_at, rating, resolution FROM tickets WHERE id = %s"
        cursor.execute(query, (ticket_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return TicketDTO(*row) if row else None

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
        
        # Forçamos 'OPEN' na criação se o status não for enviado ou for inválido
        status = data.get('status', 'OPEN')
        if status not in ['OPEN', 'IN_PROGRESS', 'CLOSED']:
            status = 'OPEN'

        cursor.execute(
            "INSERT INTO tickets (title, description, priority, user_id, status) VALUES (%s, %s, %s, %s, %s)",
            (data['title'], data['description'], data['priority'], data['user_id'], status)
        )
        conn.commit()
        cursor.close()
        conn.close()

    def update(self, ticket_id, data):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Adicionado resolution=%s antes de updated_at
        query = """
            UPDATE tickets 
            SET title=%s, description=%s, status=%s, priority=%s, user_id=%s, resolution=%s, updated_at=NOW() 
            WHERE id=%s AND deleted_at IS NULL
        """
        cursor.execute(query, (
            data['title'], 
            data['description'], 
            data['status'], 
            data['priority'], 
            data['user_id'], 
            data.get('resolution'), # Recupera a resolução enviada pelo frontend
            ticket_id
        ))
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
        
    def add_audit_log(self, ticket_id, user_id, action, old_val, new_val):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO ticket_audit_logs (ticket_id, user_id, action_type, old_value, new_value)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (ticket_id, user_id, action, str(old_val), str(new_val)))
        conn.commit()
        cursor.close()
        conn.close()

    def get_history(self, ticket_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT a.action_type, a.old_value, a.new_value, a.created_at, u.name
            FROM ticket_audit_logs a
            JOIN users u ON a.user_id = u.id
            WHERE a.ticket_id = %s
            ORDER BY a.created_at DESC
        """
        cursor.execute(query, (ticket_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [{
            "action": r[0], "old": r[1], "new": r[2], 
            "date": r[3].strftime("%d/%m/%Y %H:%M"), "user": r[4]
        } for r in rows]