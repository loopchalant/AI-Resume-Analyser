from flask import Flask, request, jsonify
from model import analyze_resume

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json

    if not data or 'text' not in data:
        return jsonify({ "error": "No text provided" }), 400

    text = data['text'].strip()

    if len(text) < 10:
        return jsonify({ "error": "Resume text is too short" }), 400

    result = analyze_resume(text)
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ "status": "ok", "message": "Flask ML service is running" })

if __name__ == '__main__':
    app.run(debug=False, port=5000)