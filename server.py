import http.server
import socketserver

PORT = 9999

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers to support cross-origin isolation
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

httpd = socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler)
print(f"Serving at port {PORT}")
httpd.serve_forever()
