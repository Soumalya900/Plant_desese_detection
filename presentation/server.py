import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def start_server():
    global PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("", PORT), Handler) as httpd:
                print(f"🌿 PlantGuard AI Presentation Server running at: http://localhost:{PORT}")
                print("Press Ctrl+C to stop.")
                webbrowser.open(f"http://localhost:{PORT}")
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {PORT} is busy, trying {PORT + 1}...")
            PORT += 1

if __name__ == "__main__":
    start_server()
