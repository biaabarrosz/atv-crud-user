from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Para o frontend conseguir acessar a API

# Por enquanto salvo em memoria
users = []

# Consulta usuarios
@app.route('/users', methods=['GET'])
def get_users():
    return jsonify(users), 200

# Salvar usuario
@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    data['id'] = len(users) + 1  # Geração dinamica do ID 
    users.append(data)
    return jsonify(data), 201

# Editar usuario
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    for user in users:
        if user['id'] == user_id:
            user.update(data)
            return jsonify(user), 200
    return jsonify({'error': 'User not found'}), 404

# Deletar usuario
@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    global users
    users = [user for user in users if user['id'] != user_id]
    return jsonify({'message': 'User deleted'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
