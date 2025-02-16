import os 
import time
import tempfile
import multiprocessing as mp
from openai import OpenAI
from tqdm import tqdm
from pydub import AudioSegment 
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
class AudioHandler: 
    def __init__(self, filepath: str | Path): 
        if isinstance(filepath, Path): 
            filepath = str(filepath)
        self.fp = str(filepath) if isinstance(filepath, Path) else filepath
    
    
    def _split_audio(self, chunk_length_ms=6000) -> list:
        print(f"Loading audio file: {self.fp}")
        audio = AudioSegment.from_file(self.fp)
        print("done loading")

        chunks = []
        temp_dir = tempfile.mkdtemp()
        print(f"Temporary directory created at: {temp_dir}")


        print("num aydios", len(audio))
        for i, start in tqdm(enumerate(range(0, len(audio), chunk_length_ms))):
            end = start + chunk_length_ms
            chunk = audio[start:end]

            if len(chunk) < 100:  # Check for chunks less than 0.1 second
                print(f"Skipping chunk {i} as it is too short: {len(chunk)} ms")
                continue

            chunk_path = os.path.join(temp_dir, f"chunk_{i}.wav")
            chunk.export(chunk_path, format="wav")
            chunks.append((i, start, end, chunk_path))
    
        print(f"Split audio into {len(chunks)} chunks")
        return chunks
    
    def _transcribe_chunk(self, args: tuple) -> tuple: 
        chunk_index, chunk_start, chunk_end, chunk_path = args
        try:
            open_ai_key = os.getenv("OPENAI_APIKEY")
            client = OpenAI(
                api_key=open_ai_key,
            )
            audio_file = open(chunk_path, "rb")
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
            return chunk_index, chunk_start, chunk_end, transcription.text
        except Exception as e:
            print(f"Error processing chunk {chunk_index}: {str(e)}")
            return chunk_index, ""
        finally:
            try:
                os.remove(chunk_path)
            except:
                pass

    def process_audio(self): 
        try:
            print("in here")
            start_time = time.time()
            
            chunks = self._split_audio()
            process_args = [(i, start, end, path) for i, start, end, path in chunks]
            num_processes = max(1, mp.cpu_count() - 1)

            print(f"Starting parallel transcription with {num_processes} processes...")
            with mp.Pool(num_processes) as pool:
                results = list(tqdm(
                    pool.imap(self._transcribe_chunk, process_args),
                    total=len(process_args),
                    desc="Transcribing chunks"
                ))

            def format_time(ms):
                minutes, seconds = divmod(ms // 1000, 60)
                return f"{minutes:02}:{seconds:02}"

            
            results.sort(key=lambda x: x[0])
            full_transcript_with_timestamps = ""
            full_transcript = ""
            for _, start, end, text in results:
                #make it in 00:00 format
                start = format_time(start)
                end = format_time(end)

                

                full_transcript_with_timestamps += f"{start} - {end}: {text}\n"
                full_transcript += f"{text}\n"

            print("finished transcribing")
            # print(full_transcript)
            
            print(self.fp)
            raw_fp = self.fp.replace(".mp3", "")
            raw_fp += "_timestamps.mp3"
            output_path_timestamps = Path(raw_fp).with_suffix('.txt')
            with open(output_path_timestamps, "w", encoding="utf-8") as f:
                f.write(full_transcript_with_timestamps)

            output_path = Path(self.fp).with_suffix('.txt')
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(full_transcript)
            print("finished writing")
            
            end_time = time.time()
            duration = end_time - start_time

            #delete the temp directory now
            # temp_dir = os.path.dirname(chunks[0][1])
            # for _, _, files in os.walk(temp_dir):
            #     for file in files:
            #         os.remove(os.path.join(temp_dir, file))
            # print("deleted the temp dir")
        
            print(f"\nTranscription completed in {duration:.2f} seconds")
            # print(f"Transcript saved to: {output_path}")
        
            return output_path_timestamps, output_path
        
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            raise
        finally:
            for _, start, end, chunk_path in chunks:
                try:
                    if os.path.exists(chunk_path):
                        os.remove(chunk_path)
                except:
                    pass


# if __name__ == "__main__":
#     fp = './audio_files/videoplayback.mp4'
#     if fp[-4:] == ".mp4": 
#         ah = AudioHandler(fp)
#         fp = ah.process_audio()
#         print("transcript(s) saved to: ", fp)