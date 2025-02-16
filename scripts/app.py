# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from backend_database import add_embeddings, search_files
import os
from video_to_transcript import AudioHandler

app = Flask(__name__)
CORS(app)

@app.route('/add_embedding', methods=['POST'])
def create_embedding():
    """Add embedding for a chunk of text."""
    try:
        data = request.json
        if not data or 'chunk_url' not in data or 'chunk_text' not in data or 'original_file_url' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: chunk_url, chunk_text, and original_file_url"
            }), 400
            
        # Add embeddings (or get existing)
        result = add_embeddings(
            chunk_url=data['chunk_url'],
            chunk_text=data['chunk_text'],
            original_file_url=data['original_file_url']
        )
        
        # Return 200 status regardless of whether chunk was new or existing
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
@app.route('/process_video', methods=['POST'])
def process_video():
    
    video_file = request.files['video']

    file_path = 'temp/video.mp4'
    video_file.save(file_path)

    ah = AudioHandler(file_path)
    transcript_paths = ah.process_audio()
    print("transcript(s) saved to: ", transcript_paths)

    #convert the posix paths to file paths
    transcript_paths = [str(path) for path in transcript_paths]
    transcript_content = []

    for tp in transcript_paths:
        with open(tp, 'r') as file:
            content = file.read()
            transcript_content.append(content)

    return jsonify({
        "status": "success",
        "message": "Video processed successfully",
        "transcript_paths": transcript_paths,
        "transcript_content": transcript_content
    })


@app.route('/search', methods=['POST'])
def search():
    """Search for similar content across all chunks."""
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