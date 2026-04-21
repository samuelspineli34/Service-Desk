class TicketDTO:
    def __init__(self, id, title, description, status, priority, user_id, user_name, created_at, rating, resolution=None):
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.priority = priority
        self.user_id = user_id
        self.user_name = user_name
        self.created_at = created_at
        self.rating = rating
        self.resolution = resolution

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "rating": self.rating,
            "resolution": self.resolution 
        }