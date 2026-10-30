import os

# Keep tests offline: an empty value wins over backend/.env (load_dotenv does not override).
os.environ["SUPABASE_SECRET_KEY"] = ""
