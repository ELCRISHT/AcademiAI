from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
# from flask_limiter import Limiter
# from flask_limiter.util import get_remote_address

# Limiter = None
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging
from datetime import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
class Config:
    DEBUG = False
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5000"]
    RATE_LIMIT = "100 per day"
    MODEL_PATH = 'model.h5'
    SCALER_PATH = 'scaler.pkl'
    JWT_SECRET_KEY = 'your-secret-key'  # Change this to a secure key in production

app = Flask(__name__, static_folder='../frontend', static_url_path='/')
app.config.from_object(Config)

# Setup CORS with specific origins
CORS(app, resources={
    r"/*": {
        "origins": Config.CORS_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Setup rate limiting
# limiter = None

# Setup JWT
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
jwt = JWTManager(app)

# Initialize scaler and model
scaler = None
model = None

# In-memory user store (for demo purposes)
users_db = {}

def error_response(message, status_code):
    """Utility function to create error responses"""
    response = jsonify({
        'error': message,
        'timestamp': datetime.utcnow().isoformat()
    })
    response.status_code = status_code
    return response

def validate_input(required_fields):
    """Decorator for input validation"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.json
            if not data:
                return error_response('No input data provided', 400)
            
            for field in required_fields:
                if field not in data:
                    return error_response(f'Missing field: {field}', 400)
                if not isinstance(data[field], (int, float)):
                    return error_response(f'Invalid type for field: {field}, expected number', 400)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def load_ml_models():
    """Load ML models with proper error handling"""
    global scaler, model
    try:
        scaler = joblib.load(Config.SCALER_PATH)
        # Load model with custom_objects to handle 'mse' metric
        model = tf.keras.models.load_model(Config.MODEL_PATH, custom_objects={'mse': tf.keras.losses.MeanSquaredError()})
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.error(f"Error loading ML models: {str(e)}")
        raise

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None
    })

# User registration endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data:
        return error_response('No input data provided', 400)
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if not name or not email or not password:
        return error_response('Missing name, email, or password', 400)
    if email in users_db:
        return error_response('User already exists', 400)
    hashed_password = generate_password_hash(password)
    users_db[email] = {
        'name': name,
        'email': email,
        'password': hashed_password
    }
    logger.info(f"User registered: {email}")
    return jsonify({'message': 'User registered successfully'})

# User login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data:
        return error_response('No input data provided', 400)
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return error_response('Missing email or password', 400)
    user = users_db.get(email)
    if not user or not check_password_hash(user['password'], password):
        return error_response('Invalid credentials', 401)
    access_token = create_access_token(identity=email)
    logger.info(f"User logged in: {email}")
    return jsonify({'access_token': access_token, 'name': user['name']})

@app.route('/predict', methods=['POST'])
# @limiter.limit(Config.RATE_LIMIT)
@jwt_required()
@validate_input([
    'academicLevel', 'aiUsageTime', 'aiDependencyLevel',
    'courseDifficulty', 'studyHoursNoAI', 'aiUnderstanding'
])
def predict():
    try:
        data = request.json
        features = np.array([
            data['academicLevel'],
            data['aiUsageTime'],
            data['aiDependencyLevel'],
            data['courseDifficulty'],
            data['studyHoursNoAI'],
            data['aiUnderstanding']
        ]).reshape(1, -1)
        
        scaled_features = scaler.transform(features)
        prediction = model.predict(scaled_features)
        bounded_gpa = np.clip(prediction[0][0], 1.0, 5.0)

        # Example feature importance explanation (dummy values)
        feature_importance = {
            'academicLevel': 0.2,
            'aiUsageTime': 0.15,
            'aiDependencyLevel': 0.25,
            'courseDifficulty': 0.1,
            'studyHoursNoAI': 0.2,
            'aiUnderstanding': 0.1
        }
        
        response = {
            'predictedGPA': float(bounded_gpa),
            'timestamp': datetime.utcnow().isoformat(),
            'confidence': 0.95,
            'featureImportance': feature_importance
        }
        
        logger.info(f"Successful prediction for input: {data}")
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return error_response(f'Error during prediction: {str(e)}', 500)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return error_response('Resource not found', 404)

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return error_response('Resource not found', 404)

@app.errorhandler(500)
def internal_error(error):
    return error_response('Internal server error', 500)

@app.errorhandler(429)
def ratelimit_error(error):
    return error_response('Rate limit exceeded', 429)

if __name__ == '__main__':
    load_ml_models()
    app.run(debug=Config.DEBUG)
