import os
from dotenv import load_dotenv

# Carrega o arquivo .env garantindo UTF-8
load_dotenv()

class Config:
    # --- CONFIGURAÇÕES DE AMBIENTE ---
    ENV = os.getenv('FLASK_ENV', 'development')

    # --- DADOS DO BANCO (Defaults apenas para conexão local padrão) ---
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_USER = os.getenv('DB_USER', 'postgres')

    # --- SEGREDOS CRÍTICOS (SEM DEFAULTS - ERRO FATAL SE FALTAR) ---
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')

    # Validação rigorosa: O sistema trava se estas variáveis não existirem no .env
    if not DB_PASSWORD:
        raise ValueError("ERRO CRÍTICO: DB_PASSWORD não definida no arquivo .env")
    
    if not JWT_SECRET_KEY:
        raise ValueError("ERRO CRÍTICO: JWT_SECRET_KEY não definida no arquivo .env")

    # --- LÓGICA DE BANCO POR AMBIENTE ---
    if ENV == 'production':
        DB_NAME = 'servicedeskdb_prod'
    else:
        # Em desenvolvimento, tenta ler do ENV, se não houver, usa o nome padrão de dev
        DB_NAME = os.getenv('DB_NAME', 'servicedeskdb_dev')

    @classmethod
    def get_db_config(cls):
        """Retorna dicionário pronto para o psycopg2.connect()"""
        return {
            "host": cls.DB_HOST,
            "port": cls.DB_PORT,
            "user": cls.DB_USER,
            "password": cls.DB_PASSWORD,
            "database": cls.DB_NAME
        }