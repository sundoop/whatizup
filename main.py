from flask import Flask, render_template
import logging
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

@app.route('/')
def index():
    stadia_api_key = os.environ.get('STADIA_MAPS_API_KEY')
    return render_template('index.html', stadia_api_key=stadia_api_key)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)