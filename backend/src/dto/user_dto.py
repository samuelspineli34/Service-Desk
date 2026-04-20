class UserDTO:
    def __init__(self, id, name, email, department, role='USER', password_hash=None):
        self.id = str(id)
        self.name = name
        self.email = email
        self.department = department
        self.role = role
        self.password_hash = password_hash 

    def to_dict(self):
        # Retornamos apenas o que o Frontend pode ver.
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "department": self.department,
            "role": self.role
        }