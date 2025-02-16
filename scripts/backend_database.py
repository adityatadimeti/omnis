# backend_database.py

import iris
import time
import os
from dotenv import load_dotenv
from langchain.embeddings.openai import OpenAIEmbeddings

def setup_openai_key():
    """Load environment variables and set up OpenAI API key if not present."""
    load_dotenv(override=True)
    if not os.environ.get("OPENAI_API_KEY"):
        raise ValueError("OpenAI API key not found in environment variables")

def setup_database_connection():
    """Setup and return IRIS database connection."""
    username = 'demo'
    password = 'demo'
    hostname = os.getenv('IRIS_HOSTNAME', 'localhost')
    port = '1972'
    namespace = 'USER'
    connection_string = f"{hostname}:{port}/{namespace}"
    return iris.connect(connection_string, username, password)

def ensure_table_exists(cursor, user_name):
    # Replace spaces (and possibly other special chars) with underscores
    safe_user_name = user_name.strip().replace(" ", "_")

    # Then create the schema.table:
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {safe_user_name}.classes (
            chunk_url VARCHAR(1000),
            chunk_text VARCHAR(10000),
            embedding VECTOR(DOUBLE, 1536),
            original_file_url VARCHAR(1000)
        )
    """)
    return True


def check_chunk_exists(cursor, user_name, chunk_url):
    safe_user_name = user_name.strip().replace(" ", "_")
    cursor.execute(f"""
        SELECT COUNT(*) FROM {safe_user_name}.classes
        WHERE chunk_url = ?
    """, [chunk_url])
    return cursor.fetchone()[0] > 0


def add_embeddings(chunk_url, chunk_text, original_file_url, user_name):
    try:
        setup_openai_key()
        conn = setup_database_connection()
        cursor = conn.cursor()

        table_name = user_name  # Use user's name for the table
        ensure_table_exists(cursor, table_name)

        if check_chunk_exists(cursor, table_name, chunk_url):
            return {"status": "success", "message": "Chunk already processed", "already_exists": True}

        embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
        embedding = embeddings_model.embed_documents([chunk_text])[0]

        sql = f"""
            INSERT INTO {table_name}.classes
            (chunk_url, chunk_text, embedding, original_file_url)
            VALUES (?, ?, TO_VECTOR(?), ?)
        """
        
        cursor.execute(sql, [chunk_url, chunk_text, str(embedding), original_file_url])
        conn.commit()
        
        return {"status": "success", "message": "New embeddings created and stored", "already_exists": False}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def search_files(search_phrase, user_name, num_results=3):
    try:
        setup_openai_key()
        conn = setup_database_connection()
        cursor = conn.cursor()
        
        embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
        search_vector = embeddings_model.embed_query(search_phrase)
        
        sql = f"""
            SELECT TOP ? chunk_url, chunk_text, original_file_url,
                   VECTOR_DOT_PRODUCT(embedding, TO_VECTOR(?)) as similarity_score
            FROM {user_name}.classes
            ORDER BY VECTOR_DOT_PRODUCT(embedding, TO_VECTOR(?)) DESC
        """
        
        cursor.execute(sql, [num_results, str(search_vector), str(search_vector)])
        results = cursor.fetchall()
        
        formatted_results = [
            {
                "chunk_url": chunk_url,
                "chunk_text": chunk_text,
                "original_file_url": original_file_url,
                "score": score
            }
            for chunk_url, chunk_text, original_file_url, score in results
        ]
        
        return {"status": "success", "results": formatted_results}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()