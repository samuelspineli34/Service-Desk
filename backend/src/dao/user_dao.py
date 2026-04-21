import psycopg2
from src.config.config import Config
from src.dto.user_dto import UserDTO

class UserDAO:
    def get_connection(self):
        config = Config.get_db_config()
        
        try:
            # Se o config for uma STRING (caso do Render/DATABASE_URL)
            if isinstance(config, str):
                return psycopg2.connect(config, application_name='ServiceDesk')
            
            # Se o config for um DICIONÁRIO (caso do seu PC local)
            else:
                return psycopg2.connect(**config, application_name='ServiceDesk')
                
        except Exception as e:
            # Tratamento de erro para mensagens com acento no Windows
            try:
                error_msg = str(e).encode('cp1252', errors='ignore').decode('cp1252')
            except:
                error_msg = str(e)
            
            print(f"DEBUG: Erro real do Postgres: {error_msg}")
            raise Exception(f"O PostgreSQL rejeitou a conexão: {error_msg}")
        

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

    def get_by_email_with_permissions(self, email):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Esta query busca o usuário e faz o JOIN com Roles e Permissions
        query = """
            SELECT 
                u.id, u.name, u.email, u.department, u.password_hash, 
                r.name as role_name, 
                p.code as permission_code
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE u.email = %s AND u.deleted_at IS NULL
        """
        cursor.execute(query, (email,))
        rows = cursor.fetchall()
        
        if not rows:
            return None

        # Como a query retorna uma linha por permissão, agrupamos as permissões em uma lista
        permissions = [row[6] for row in rows if row[6] is not None]
        first_row = rows[0]

        user_data = {
            "id": str(first_row[0]),
            "password_hash": first_row[4],
            "role_name": first_row[5] or "USER",
            "permissions": permissions,
            "info": {
                "id": str(first_row[0]),
                "name": first_row[1],
                "email": first_row[2],
                "department": first_row[3],
                "role": first_row[5] or "USER",
                "permissions": permissions
            }
        }
        
        cursor.close()
        conn.close()
        return user_data
    
    def update_password(self, user_id, new_hash):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user_id))
        conn.commit()
        cursor.close()
        conn.close()