import os
from dotenv import load_dotenv
import urllib.parse as up

load_dotenv()

class Config:
    # --- CONFIGURAÇÕES DE AMBIENTE ---
    ENV = os.getenv('FLASK_ENV', 'development')
    
    # --- SEGREDOS CRÍTICOS ---
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        raise ValueError("ERRO CRÍTICO: JWT_SECRET_KEY não definida")

    # --- LÓGICA DE BANCO DE DADOS ---
    # No Render, essa variável existirá automaticamente se você conectar o banco ao serviço
    DATABASE_URL = os.getenv('DATABASE_URL')

    if DATABASE_URL:
        # Se estamos no Render/Produção usando DATABASE_URL
        # (Opcional: correção de protocolo para o SQLAlchemy/Psycopg2 se necessário)
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    else:
        # Fallback para Configurações Locais (Desenvolvimento)
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD')
        DB_NAME = os.getenv('DB_NAME', 'servicedeskdb_dev')
        
        if not DB_PASSWORD and ENV == 'development':
             print("Aviso: DB_PASSWORD não definida, tentando conexão sem senha...")

    @classmethod
    def get_db_config(cls):
        # 1. Se existe a URL (Render), usa ela
        if cls.DATABASE_URL:
            return cls.DATABASE_URL
        
        # 2. Se não, monta o dicionário com o que está no .env
        # Aqui garantimos que o DB_NAME pegue o valor do .env se existir, 
        # ou o default dependendo do ENV
        db_name = os.getenv('DB_NAME') 
        if not db_name:
            db_name = 'servicedeskdb_prod' if cls.ENV == 'production' else 'servicedeskdb_dev'

        return {
            "host": cls.DB_HOST,
            "port": cls.DB_PORT,
            "user": cls.DB_USER,
            "password": cls.DB_PASSWORD,
            "database": db_name
        }