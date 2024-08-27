import asyncio
import websockets
import json

# Buffer to hold the received data
data_buffer = {
    'gx': 0.0,
    'gy': 0.0,
    'gz': 0.0
}

# Update visualization function (implement according to your visualization library)
def update_visualization(data):
    # Example: print the data
    print(f"Gyroscope Data - gx: {data['gx']}, gy: {data['gy']}, gz: {data['gz']}")
    # Here you would update your visualization logic

async def receive_gyro_data():
    async with websockets.connect("ws://localhost:5678") as websocket:
        try:
            while True:
                # Receive data from the WebSocket server
                response = await websocket.recv()
                data = json.loads(response)
                
                # Update the buffer
                data_buffer.update(data)
                
                # Update the visualization
                update_visualization(data_buffer)
        except websockets.exceptions.ConnectionClosedOK:
            print("Connection to server closed gracefully.")
        except Exception as e:
            print(f"An error occurred: {e}")

# Start the WebSocket client
asyncio.run(receive_gyro_data())
