from flask import Flask, jsonify
from kafka import KafkaConsumer

app = Flask(__name__)

@app.route('/analytics', methods=['GET'])
def get_analytics():
    # Fetch only the latest message from Kafka
    consumer = KafkaConsumer(
        'video-analytics',
        bootstrap_servers='localhost:9092',
        auto_offset_reset='latest',
        enable_auto_commit=True,
        value_deserializer=lambda x: x.decode('utf-8')
    )
    
    # Poll for the latest message
    message = None
    for msg in consumer:
        message = msg.value  # Get the latest message
        break  # Exit after fetching one message

    consumer.close()
    return jsonify({'latest_frame_data': message})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)