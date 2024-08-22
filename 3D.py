import asyncio
import websockets
import json
import numpy as np
from time import sleep
from math import sin, cos

# Buffer to hold the received data
data_buffer = {
    'gx': 0.0,
    'gy': 0.0,
    'gz': 0.0
}

# Calibration offsets
calibration = {
    'gx_offset': 0.0,
    'gy_offset': 0.0,
    'gz_offset': 0.0
}

# Update visualization function (implement according to your visualization library)
def update_visualization(data):
    # Example: print the data
    print(f"Gyroscope Data - gx: {data['gx']}, gy: {data['gy']}, gz: {data['gz']}")
    # Here you would update your visualization logic

# Function to calibrate the gyroscope data
def calibrate_gyro(data):
    calibration['gx_offset'] = data['gx']
    calibration['gy_offset'] = data['gy']
    calibration['gz_offset'] = data['gz']
    print("Calibration complete:", calibration)

# Apply calibration to the data
def apply_calibration(data):
    data['gx'] -= calibration['gx_offset']
    data['gy'] -= calibration['gy_offset']
    data['gz'] -= calibration['gz_offset']

async def receive_gyro_data():
    async with websockets.connect("ws://localhost:3000") as websocket:
        try:
            # Perform calibration
            print("Starting calibration... Please keep the sensor still.")
            response = await websocket.recv()
            initial_data = json.loads(response)
            calibrate_gyro(initial_data)

            while True:
                # Receive data from the WebSocket server
                response = await websocket.recv()
                data = json.loads(response)
                
                # Apply calibration to the received data
                apply_calibration(data)

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
