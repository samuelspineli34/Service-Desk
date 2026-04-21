from src.dao.user_dao import UserDAO
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

class UserService:
    def __init__(self):
        self.dao = UserDAO()

    def get_all_users(self):
        try:
            users_dtos = self.dao.get_all_users()
            
            # Converts the list of DTO objects into a list of dictionaries (to become JSON)
            return [user.to_dict() for user in users_dtos]
            
        except Exception as e:
            print(f"Service Error: {e}")
            return [] # Returns an empty list in case of error
    
    def get_user_by_id(self, user_id):
        user_dto = self.dao.get_by_id(user_id)
        return user_dto.to_dict() if user_dto else None
        
    def authenticate(self, email, password):
        user_data = self.dao.get_by_email_with_permissions(email)
        if user_data and check_password_hash(user_data['password_hash'], password):
            # O Token agora carrega as permissões REAIS do cargo dele
            access_token = create_access_token(
                identity=user_data['id'], 
                additional_claims={
                    "role": user_data['role_name'],
                    "permissions": user_data['permissions'] # ['manage_users', 'view_all_tickets']
                }
            )
            return {"token": access_token, "user": user_data['info']}

    def create_user(self, data):
        # Se não vier senha no form, usa a padrão: Welcome@123
        default_password = "Welcome@123"
        password_hash = generate_password_hash(default_password)
        
        self.dao.create(
            name=data['name'], 
            email=data['email'], 
            department=data['department'], 
            role=data.get('role', 'USER'),
            password_hash=password_hash # Salva o hash no banco
        )

    def update_user(self, user_id, data):
        self.dao.update(user_id, data['name'], data['email'], data['department'])

    def delete_user(self, user_id):
        self.dao.delete(user_id)

    def change_password(self, user_id, old_password, new_password):
        user_dto = self.dao.get_by_id(user_id)
        
        # Agora o user_dto tem o password_hash!
        if user_dto and check_password_hash(user_dto.password_hash, old_password):
            new_hash = generate_password_hash(new_password)
            self.dao.update_password(user_id, new_hash)
            return True
        return False