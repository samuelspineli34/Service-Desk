import os
# Mantemos o encoding do Postgres para o Windows não reclamar
os.environ['PGCLIENTENCODING'] = 'utf-8'

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Import das Rotas (Blueprints)
from src.routes.user_routes import user_bp
from src.routes.ticket_routes import ticket_bp
from src.routes.auth_routes import auth_bp
from src.routes.dashboard_routes import dash_bp
from src.routes.role_routes import role_bp

# Import da sua classe de configuração
from src.config.config import Config

app = Flask(__name__)

# Configuração do CORS para permitir o Bun/Vite acessar o Flask
CORS(app) 

# --- CONFIGURAÇÃO JWT ---
# Agora pegamos a chave de forma segura através da sua classe Config
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
jwt = JWTManager(app)

# --- REGISTRO DE ROTAS ---
# Registramos todas as rotas com o prefixo /api
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(ticket_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(dash_bp, url_prefix='/api') 
app.register_blueprint(role_bp, url_prefix='/api')


# Rota de teste simples para verificar se o servidor está de pé
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        "status": "online",
        "environment": Config.ENV,
        "database": Config.DB_NAME
    }), 200

if __name__ == '__main__':
    # Roda na porta 5000
    print(f"🚀 Server running on http://localhost:5000 in {Config.ENV} mode")
    app.run(debug=True, port=5000)