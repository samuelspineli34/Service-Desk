import psycopg2
from src.config.config import Config

class CommentDAO:
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

    def add_comment(self, ticket_id, user_id, text):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Insere o comentário
        cursor.execute(
            "INSERT INTO ticket_comments (ticket_id, user_id, comment_text) VALUES (%s, %s, %s)",
            (ticket_id, user_id, text)
        )
        # Regra de Negócio: Se comentar, o ticket passa para 'IN_PROGRESS'
        cursor.execute("UPDATE tickets SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = %s AND status = 'OPEN'", (ticket_id,))
        conn.commit()
        cursor.close()
        conn.close()

    def get_by_ticket(self, ticket_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT c.comment_text, u.name, c.created_at 
            FROM ticket_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.ticket_id = %s
            ORDER BY c.created_at ASC
        """
        cursor.execute(query, (ticket_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [{"text": r[0], "user": r[1], "date": r[2].strftime("%d/%m %H:%M")} for r in rows]