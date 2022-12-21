from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
import ssl

if __name__ == "__main__":
    httpd = HTTPServer(('0.0.0.0', 8000), SimpleHTTPRequestHandler)

    httpd.socket = ssl.wrap_socket (httpd.socket,
                                    keyfile="key.pem",
                                    certfile='cert.pem', server_side=True)

    httpd.serve_forever()
