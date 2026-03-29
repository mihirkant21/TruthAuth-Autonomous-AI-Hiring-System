import sqlite3
import os

# Find the database file
db_path = os.path.join(os.path.dirname(__file__), "database.db")
print(f"Database path: {db_path}")
print(f"File exists: {os.path.exists(db_path)}")

conn = sqlite3.connect(db_path)

# Check current columns
cols = [row[1] for row in conn.execute("PRAGMA table_info(candidates)").fetchall()]
print(f"Current columns: {cols}")

if "created_at" not in cols:
    conn.execute("ALTER TABLE candidates ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
    conn.commit()
    print("SUCCESS: Added created_at column")
else:
    print("ALREADY EXISTS: created_at column is already present")

conn.close()
