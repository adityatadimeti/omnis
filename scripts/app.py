# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from backend_database import add_embeddings, search_files
import os

app = Flask(__name__)
CORS(app)

@app.route('/add_embedding', methods=['POST'])
def create_embedding():
    """Add embedding for an uploaded file if not already processed."""
    try:
        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No file part in the request"
            }), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "status": "error",
                "message": "No file selected"
            }), 400

        # Read file content
        file_content = file.read().decode('utf-8')
        file_url = file.filename
            
        # Add embeddings (or get existing)
        result = add_embeddings(
            file_url=file_url,
            file_text=file_content
        )
        
        # Return 200 status regardless of whether file was new or existing
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/search', methods=['POST'])
def search():
    """Search across all files for relevant content."""
    try:
        data = request.json
        if not data or 'query' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required field: query"
            }), 400
            
        num_results = data.get('num_results', 3)
        
        result = search_files(
            search_phrase=data['query'],
            num_results=num_results
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5010)