import psycopg2
from config.config import Config
from dto.user_dto import UserDTO

class UserDAO:
    def get_connection(self):
        db_params = Config.get_db_config()
        return psycopg2.connect(**db_params, application_name='ServiceDesk', client_encoding='utf8')

    def get_all_users(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, department FROM users ORDER BY name ASC")
        rows = cursor.fetchall()
        users = [UserDTO(row[0], row[1], row[2], row[3]) for row in rows]
        cursor.close()
        conn.close()
        return users

    def get_by_id(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Buscamos o password_hash também
        cursor.execute("SELECT id, name, email, department, role, password_hash FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        
        user = None
        if row:
            user = UserDTO(row[0], row[1], row[2], row[3], row[4], row[5])
            
        cursor.close()
        conn.close()
        return user

    def create(self, name, email, department):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, department) VALUES (%s, %s, %s)", (name, email, department))
        conn.commit()
        cursor.close()
        conn.close()

    def update(self, user_id, name, email, department):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET name=%s, email=%s, department=%s WHERE id=%s", (name, email, department, user_id))
        conn.commit()
        cursor.close()
        conn.close()

    def delete(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
    
    def soft_delete(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Soft delete do usuário
        cursor.execute("UPDATE users SET deleted_at = NOW() WHERE id = %s", (user_id,))
        conn.commit()
        cursor.close()
        conn.close()

    def get_by_email(self, email):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, department, role, password_hash FROM users WHERE email = %s AND deleted_at IS NULL", (email,))
        row = cursor.fetchone()
        
        user = None
        if row:
            # Passamos o role (row[4]) diretamente para o DTO
            user = UserDTO(row[0], row[1], row[2], row[3], row[4])
            user.password_hash = row[5]
            
        cursor.close()
        conn.close()
        return user
    
    def update_password(self, user_id, new_hash):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user_id))
        conn.commit()
        cursor.close()
        conn.close()