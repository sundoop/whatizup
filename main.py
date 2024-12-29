from flask import Flask, render_template
import logging
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    stadia_api_key = os.environ.get('STADIA_MAPS_API_KEY')
    if not stadia_api_key:
        logger.error("STADIA_MAPS_API_KEY environment variable is not set")
        return "Error: Stadia Maps API key is not configured", 500

    logger.info(f"Rendering index with API key configured: {bool(stadia_api_key)}")
    return render_template('index.html', stadia_api_key=stadia_api_key)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)