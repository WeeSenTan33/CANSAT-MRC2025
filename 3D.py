import asyncio
import websockets
import json
import numpy as np
from time import sleep
from math import sin, cos

# Simulate real-time gyroscope data
async def send_gyro_data(websocket, path):
    try:
        angle = 0
        while True:
            # Update angle and simulate gyroscope data
            angle += 0.1
            data = {
                'gx': sin(angle),
                'gy': cos(angle),
                'gz': sin(angle) * cos(angle)
            }
            await websocket.send(json.dumps(data))
            await asyncio.sleep(1)
    except websockets.exceptions.ConnectionClosedOK:
        print("Client closed connection gracefully.")
    except Exception as e:
        print(f"An error occurred: {e}")

start_server = websockets.serve(send_gyro_data, "localhost", 5678)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
