"""
UrbanVerse Frontend Local Development Server
Role: Member 2 (Frontend + 3D Digital Twin)

Starts a lightweight HTTP server serving frontend/index.html on port 3000.
"""

import http.server
import socketserver
import os
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for local hackathon development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print(f"  UrbanVerse Frontend Digital Twin Server Running!")
        print(f"  Local Web App URL:   http://localhost:{PORT}")
        print(f"  Backend API Target:  http://127.0.0.1:8000")
        print("=" * 60)
        print("  Press Ctrl + C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Stopping frontend server.")
