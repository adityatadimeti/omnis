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
from identification_generation import setup_openai_key, parse_text_from_timestamps, parse_text_from_timestamps_original, parse_timestamps, chunk_str, get_timestamp_from_answer
from backend_database import setup_database_connection


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
            chunk_text = "\n".join(parse_text_from_timestamps_original(chunk_text)).strip()
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



@app.route("/create_class", methods=["POST"])
def create_class():
    """
    Creates a new schema for the user: user_name.class_name
    Optionally create a table as well for chunk embeddings.
    """
    try:
        data = request.json
        user_name = data.get("user_name", "UnknownUser")
        class_name = data.get("class_name", "Untitled")

        # Remove spaces or illegal chars
        safe_user_name = user_name.replace(" ", "")
        safe_class_name = class_name.replace(" ", "")

        # Now we want to create or ensure the schema <safe_user_name>.<safe_class_name>
        # In IRIS we might do: CREATE SCHEMA "Aditya_CS194W"
        # But let's store it as a single schema + table naming approach:
        # e.g., create a SCHEMA named safe_user_name, then a table "class_name"
        # OR directly do safe_user_name.safe_class_name
        conn = setup_database_connection()
        cursor = conn.cursor()

        # 1) Attempt to create the schema if it doesn't exist
        # IRIS may or may not support "CREATE SCHEMA IF NOT EXISTS"
        try:
            cursor.execute(f'CREATE SCHEMA {safe_user_name}')
        except Exception as e:
            # If it already exists or IRIS doesn't support this exact syntax,
            # you can ignore or handle specifically.
            print("Schema creation info:", str(e))

        # 2) Create a table inside that schema for chunk embeddings
        # e.g. {schema}.{classname}_embeddings
        table_ddl = f"""
        CREATE TABLE IF NOT EXISTS {safe_user_name}.{safe_class_name}(
            chunk_url VARCHAR(1000),
            chunk_text VARCHAR(10000),
            embedding VECTOR(DOUBLE, 1536),
            original_file_url VARCHAR(1000)
        )
        """
        cursor.execute(table_ddl)
        conn.commit()

        # Return some success response
        return jsonify({
            "status": "success",
            "message": f"Created or ensured schema {safe_user_name}, and table {safe_class_name}",
            "new_class_id": f"{safe_user_name}.{safe_class_name}"
        }), 200

    except Exception as e:
        print("Error in /create_class:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


# app.py (or similar)
@app.route('/list_classes', methods=['GET'])
def list_classes():
    """
    Lists all tables from the user's schema, 
    e.g. AdityaTadimeti.CS194W_embeddings => className: "CS194W"
    """
    try:
        user_name = request.args.get('user_name', 'UnknownUser')
        safe_user_name = user_name.replace(" ", "")  # or any other sanitization

        conn = setup_database_connection()
        cursor = conn.cursor()

        # IRIS typically stores table info in INFORMATION_SCHEMA or a dictionary table.
        # Example query using INFORMATION_SCHEMA:
        sql = """
        SELECT table_name 
        FROM INFORMATION_SCHEMA.TABLES
        WHERE table_schema = ?
        """
        cursor.execute(sql, [safe_user_name])
        rows = cursor.fetchall()

        class_list = []
        for (table_name,) in rows:
            # e.g. table_name might be 'CS194W_embeddings'
            # We'll remove '_embeddings' suffix to get 'CS194W'.
            print(table_name)
            if "classes" in table_name:
                continue
            if table_name.endswith("_embeddings"):
                raw_class_name = table_name.replace("_embeddings", "")
            else:
                raw_class_name = table_name  # or skip if you only want _embeddings

            class_list.append(raw_class_name)

        return jsonify({
            "status": "success",
            "classes": class_list
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


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
    final_output = generated_content + "\n\n\n" #+ "Reference Material: " + "\n"

    #for doc_url, doc_name in zip(top_k_urls, top_k_names):
    #    final_output += f"{doc_name} \n" #<a href={doc_url}>{doc_name}</a> \n"

    return jsonify({
        "status": "success",
        "answer": final_output
    })

@app.route('/get_video_timestamp', methods=['POST'])
def get_video_timestamp():
    data = request.json

    file_types = data['file_types']
    ans_timestamps = []

    for idx, file_type in enumerate(file_types):
        if file_type == "video":
            parsed_text = parse_text_from_timestamps(data['transcript_content_chunks'][idx])
            timestamps = parse_timestamps(parsed_text)
            clean_text_list = [chunk["text"] for chunk in parsed_text]
            ans_timestamps.append((data['file_urls'][idx], data['file_names'][idx], get_timestamp_from_answer(data["top_k_ids"][idx], dict(zip(clean_text_list, timestamps)))))
        
    if ans_timestamps:
        return jsonify({
            "status": "success",
            "timestamp": ans_timestamps,
        })
    else:
        return jsonify({
            "status": "success",
            "timestamp": 0
        })
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5010)