class TicketDTO:
    # Garanta que a ordem e quantidade de argumentos batem com o SELECT acima
    def __init__(self, id, title, description, status, priority, user_id, user_name, created_at, rating=None):
        self.id = str(id)
        self.title = title
        self.description = description
        self.status = status
        self.priority = priority
        self.user_id = str(user_id)
        self.user_name = user_name
        self.created_at = created_at.strftime("%Y-%m-%d %H:%M") if created_at else None
        self.rating = rating # O rating deve estar aqui!

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "created_at": self.created_at,
            "rating": self.rating
        }