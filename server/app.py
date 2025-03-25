from flask import Flask
from flask_cors import CORS
from routes.simulator_routes import simulator_bp

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)
app.register_blueprint(simulator_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
