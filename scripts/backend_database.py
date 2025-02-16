# backend_database.py

import iris
import time
import os
import re
from urllib.parse import urlparse
from dotenv import load_dotenv
from langchain.embeddings.openai import OpenAIEmbeddings

def get_table_name_from_url(file_url):
    """Extract and format table name from file URL."""
    parsed_url = urlparse(file_url)
    file_path = parsed_url.path
    file_name = os.path.splitext(os.path.basename(file_path))[0]
    clean_name = re.sub(r'[^a-zA-Z0-9]', '_', file_name)
    if not clean_name[0].isalpha():
        clean_name = 'f_' + clean_name
    return f"Sample.{clean_name}"

def check_table_exists(cursor, table_name):
    """Check if table exists and has data."""
    try:
        cursor.execute(f"""
            SELECT COUNT(*) as count, 
                   COUNT(embedding) as vector_count 
            FROM {table_name}
        """)
        result = cursor.fetchone()
        total_rows = result[0] if result else 0
        rows_with_vectors = result[1] if result else 0
        
        if total_rows > 0 and rows_with_vectors == total_rows:
            return True
        return False
    except:
        return False

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

def add_embeddings(chunk_url, chunk_text, original_file_url):
    """Add a single chunk's embeddings to the database if not already present."""
    try:
        # Setup
        setup_openai_key()
        conn = setup_database_connection()
        cursor = conn.cursor()

        # Get table name from original file URL
        table_name = get_table_name_from_url(original_file_url)

        # Create new embeddings
        embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
        embedding = embeddings_model.embed_documents([chunk_text])[0]
        
        # Create table if it doesn't exist (note: we can have multiple chunks per table)
        try:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    chunk_url VARCHAR(1000),
                    chunk_text VARCHAR(10000),
                    embedding VECTOR(DOUBLE, 1536),
                    original_file_url VARCHAR(1000)
                )
            """)
        except Exception as e:
            print(f"Table creation error: {str(e)}")
            raise e

        # Check if this chunk already exists
        cursor.execute(f"""
            SELECT COUNT(*) FROM {table_name}
            WHERE chunk_url = ?
        """, [chunk_url])
        
        if cursor.fetchone()[0] > 0:
            return {
                "status": "success",
                "message": "Chunk already processed",
                "table_name": table_name,
                "already_exists": True
            }
        
        # Insert new chunk
        sql = f"""
            INSERT INTO {table_name}
            (chunk_url, chunk_text, embedding, original_file_url)
            VALUES (?, ?, TO_VECTOR(?), ?)
        """
        
        cursor.execute(sql, [chunk_url, chunk_text, str(embedding), original_file_url])
        conn.commit()
        
        return {
            "status": "success",
            "message": "New embeddings created and stored",
            "table_name": table_name,
            "already_exists": False
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def search_files(search_phrase, num_results=3):
    """Search across all files for the most relevant content."""
    try:
        # Setup
        setup_openai_key()
        conn = setup_database_connection()
        cursor = conn.cursor()
        
        # Initialize embeddings model
        embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
        
        # Create search vector
        search_vector = embeddings_model.embed_query(search_phrase)
        
        # Get all tables in Sample schema
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Sample'
        """)
        tables = cursor.fetchall()
        
        # Search each table and combine results
        all_results = []
        for (table_name,) in tables:
            full_table_name = f"Sample.{table_name}"
            try:
                # Search within this table
                sql = f"""
                    SELECT chunk_url, chunk_text, original_file_url,
                           VECTOR_DOT_PRODUCT(embedding, TO_VECTOR(?)) as similarity_score
                    FROM {full_table_name}
                """
                cursor.execute(sql, [str(search_vector)])
                table_results = cursor.fetchall()
                
                # Add results to combined list
                all_results.extend([
                    {
                        "chunk_url": chunk_url,
                        "chunk_text": chunk_text,
                        "original_file_url": original_file_url,
                        "score": score
                    }
                    for chunk_url, chunk_text, original_file_url, score in table_results
                ])
            except Exception as e:
                print(f"Error searching table {full_table_name}: {str(e)}")
                continue
        
        # Sort by similarity score and get top results
        sorted_results = sorted(all_results, key=lambda x: x["score"], reverse=True)
        top_results = sorted_results[:num_results]
        
        return {
            "status": "success", 
            "results": top_results
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()