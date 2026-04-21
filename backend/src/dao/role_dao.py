import psycopg2
from config.config import Config

class RoleDAO:
    def get_connection(self):
        return psycopg2.connect(**Config.get_db_config(), application_name='ServiceDesk')

    def get_all_with_permissions(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        # Busca todos os cargos e suas permissões
        query = """
            SELECT r.id, r.name, array_agg(p.code) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id, r.name
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [{"id": r[0], "name": r[1], "permissions": r[2] if r[2][0] is not None else []} for r in rows]

    def create_with_permissions(self, name, permission_codes):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            # 1. Cria o Cargo
            cursor.execute("INSERT INTO roles (name) VALUES (%s) RETURNING id", (name,))
            role_id = cursor.fetchone()[0]

            # 2. Vincula as Permissões
            for code in permission_codes:
                cursor.execute("""
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT %s, id FROM permissions WHERE code = %s
                """, (role_id, code))
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()