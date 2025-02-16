# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from backend_database import add_embeddings, search_files
import os
from video_to_transcript import AudioHandler
import pandas as pd 
import numpy as np
import os
from openai import OpenAI
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from typing import List 
from tqdm import tqdm
import re
from difflib import SequenceMatcher
from identification_generation import setup_openai_key, parse_text_from_timestamps, parse_timestamps, chunk_str


app = Flask(__name__)
CORS(app)

@app.route('/add_embedding', methods=['POST'])
def create_embedding():
    """Add embedding for a chunk of text."""
    try:
        data = request.json

        # Check all required fields: chunk_url, chunk_text, original_file_url, user_name
        required_fields = ["chunk_url", "chunk_text", "original_file_url", "user_name", "file_type", "file_name"]
        missing_fields = [f for f in required_fields if f not in data or not data[f]]

        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Call add_embeddings with user_name included
        result = add_embeddings(
            chunk_url=data['chunk_url'],
            chunk_text=data['chunk_text'],
            original_file_url=data['original_file_url'],
            user_name=data['user_name'],
            file_type=data['file_type'],
            file_name=data['file_name']
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
    """Search for similar content in the user's chunk database."""
    try:
        data = request.json

        # Ensure 'query' is present
        if not data or 'query' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required field: query"
            }), 400

        # Get user name (fallback if not provided)
        user_name = data.get('user_name', 'UnknownUser')
        num_results = data.get('num_results', 3)

        # Pass 'user_name' to the search_files function
        result = search_files(
            search_phrase=data['query'],
            user_name=user_name,
            num_results=num_results
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/run_identification', methods=['POST'])
def run_identification():
    """
    top_k_queries: text over either video transcript or documents (notes, slides, etc.)
    top_k_types: either video, text, or image
    """
    data = request.json
    top_k_queries = data['top_k_queries']
    top_k_types = data['top_k_types']
    question = data['question']

    client = setup_openai_key()

    print(data)

    top_k_ids = []
    for idx, (chunk_text, chunk_type) in tqdm(enumerate(zip(top_k_queries, top_k_types))):
        if chunk_type == "video":
            # Remove whitespace after joining
            chunk_text = "\n".join(parse_text_from_timestamps(chunk_text)).strip()
        context_artifact_chunks = chunk_str(chunk_text)

        ID_MODEL_SYSTEM_PROMPT = """
        You are a helpful assistant specializing in identifying parts of text documents that best correspond to the answer for a query.
        You specialize in thinking deeply about the answer to a given question and then returning the exact sentences word for word that 
        best contain the answer to the question from the given context. The context is preceded by a section header called CONTEXT.
        """

        # Add context - hacky way of just adding the first chunk if context is too long
        context = f"CONTEXT:\n {context_artifact_chunks[0]}"
        INPUT_MSG = question + context

        # Make the API call to o1-mini
        id_response = client.chat.completions.create(
            model="gpt-4o",
            messages = [
            {"role": "user", "content": f"instructions {ID_MODEL_SYSTEM_PROMPT}\n, question: {INPUT_MSG}"}],
        )

        id_response_content = id_response.choices[0].message.content
        # Post-processing
        id_response_content = id_response_content.replace("\n", " ").replace('`', "")
        top_k_ids.append(id_response_content)
        print(f"Finished attribution for top {idx} query")

    return jsonify({
        "status": "success",
        "top_k_ids": top_k_ids
    })




@app.route('/run_generation', methods=['POST'])
def run_generation():
    """
    top_k_ids: represent context for each of the top k resources 
    """
    client = setup_openai_key()

    data = request.json
    top_k_ids = data['top_k_ids']
    question = data['question']

    ID_GENERATION_SYSTEM_PROMPT = """
    You are a helpful teaching assistant who generates answers to students questions with a kind and helpful tone.
    The way you answer questions is as follows:
    You should first provide any necessary background on the student's question at the level of a high school or college student.
    Then, you should answer the question directly using your knowledge. Integrate all of the document context that is passed in somewhere in your answer. 
    The context is preceded by a section header called CONTEXT.
    """

    #To correctly reference the document context, you will add an HTML hyperlinks in correspondence of the key concepts discussed. 
    #For example, if you have a document describing XYZ and URL to the document, you would discuss XYZ and you will write important words or expressions of the discussion in the form of HTML hyperlink. 
    #In other words, if WORD is an important word of the summary that describes a document having link URL, you will write <a href=URL>WORD</a> instead of WORD in the summary.

    # Add context
    context = "CONTEXT:\n"
    for id_context in top_k_ids:
        context += f"{id_context}\n"
    INPUT_MSG = question + context

    # Make the API call to o3-mini
    generated_response = client.chat.completions.create(
        model="gpt-4o",
        messages = [
        {"role": "user", "content": f"instructions {ID_GENERATION_SYSTEM_PROMPT}\n, question: {INPUT_MSG}"}],
    )

    generated_response_content = generated_response.choices[0].message.content

    return jsonify({
        "status": "success",
        "answer": generated_response_content
    })



@app.route('/postprocess_generation', methods=['POST'])
def postprocess_generation():
    """
    top_k_urls: firebase artifacts for top k objects (original, not chunks)
    """

    data = request.json
    generated_content = data['generated_content']
    top_k_urls = data['top_k_urls']
    top_k_names = data['top_k_names']

    #Add Reference material from top_k_ids 
    final_output = generated_content + "Reference Material" + "\n"

    for doc_url, doc_name in zip(top_k_urls, top_k_names):
        final_output += f"<a href={doc_url}>{doc_name}</a> \n"

    return jsonify({
        "status": "success",
        "answer": final_output
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5010)