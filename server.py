#!/usr/bin/env python

import asyncio
import websockets
import random
import json
import time
import click
import http.server
import threading
import socketserver
import pathlib
from datetime import datetime

config = {
    "width": 0,
    "height": 0,
}

users = {}
user_socket = {}
user_event = asyncio.Event()

"""
pieces = {
    "L": {
        "1": [[1,0],
              [2,0],
              [3,4]]
    }
}

games = {
    "1": {
        "users": [2,3],
        "grid": [[None]*SHAPE[0]]*SHAPE[1],
        "active_player": 2,
        "last_movement": datetime.now(),
        "selected_piece": "L",
        "winner": None,
        "hand": {
            "1": [("L", "ABCD")]*4,
            "2": [("L", "ABCD")]*4,
        },
    }
}
"""

games = {}

def get_available_players():
    is_waiting = lambda x: users[x] is None or len(games[users[x]]["users"]) == 1
    return list(filter(is_waiting, users))

async def wait_players():
    while len(get_available_players()) - 1 < 1:
        await user_event.wait()

def create_game():
    game_id = random.randint(0, 1000)
    games[game_id] = {
        "users": [],
        "grid": ['0']*config["width"]*config["height"],
        "active_player": None, 
        "last_movement": None,
        "winner": None,
        "hand": None,
        'step': 0,
    }
    return game_id

def get_available_game():
    is_waiting = lambda x: len(games[x]["users"]) == 1
    waiting_games = list(filter(is_waiting, games))
    if (len(waiting_games) < 1):
        game_id = create_game()
        return game_id
    return waiting_games[0]

def is_valid_movement(game_id, movement):
    return True

def check_winner(game_id):
    grid = games[game_id]["grid"].copy()
    W = config["width"]
    H = config["height"]
    
    # check rows
    for i in range(H):
        row = ''.join(grid[i*W:i*W+W])
        print(row)
        if 'AAA' in row:
            return True

    # check columns
    cols = [[grid[W*x+c] for x in range(H)] for c in range(W)]
    for col in cols:
        col = ''.join(col)
        print(col)
        if 'AAA' in col:
            return True
            
    # check diagonals
    diags = [[(x,y) for x in range(W) for y in range(W) if x - y == c] for c in range(-(W-1), W)]
    diags2 = [[(x,y) for x in range(W) for y in range(W) if x + y == W-c] for c in range(-(W-2), W+1)]
    for diag in diags:
        diag = ''.join([grid[x[0]*W+x[1]] for x in diag])
        print(diag)
        if 'AAA' in diag:
            return True
    for diag in diags2:
        diag = ''.join([grid[x[0]*W+x[1]] for x in diag])
        print(diag)
        if 'AAA' in diag:
            return True
    
    return False

async def end_game(game_id, winner_id):
    print(f"game {game_id}: winner {winner_id}")
    loser_id = [x for x in games[game_id]["users"] if x != winner_id][0]
    await user_socket[winner_id].send(json.dumps({'msg': 'winner'}))
    await user_socket[loser_id].send(json.dumps({'msg': 'loser'}))
    games[game_id]['winner'] = winner_id
    games[game_id]['player_event'].set()
    games[game_id]['player_event'].clear()

async def start_game(uid, game_id):
    print(f"user {uid} started in {game_id}")
    users[uid] = game_id
    games[game_id] = games[game_id]
    games[game_id]["users"].append(uid)

    if len(games[game_id]["users"]) < 2:
        games[game_id]['active_player'] = uid
        games[game_id]['player_event'] = asyncio.Event()
        await user_socket[uid].send(json.dumps({'msg': 'wait'}))
        await games[game_id]['player_event'].wait()
    else:
        games[game_id]['player_event'].set()
        games[game_id]['player_event'].clear()
    
    await user_socket[uid].send(json.dumps({'game_id': game_id}))

    while games[game_id]['winner'] is None:
        games[game_id]['step'] += 1
        while games[game_id]['active_player'] != uid:
            await games[game_id]['player_event'].wait()
            if games[game_id]['winner'] is not None:
                return

        await user_socket[uid].send(json.dumps({'msg': 'ping', 'grid': games[game_id]["grid"]}))

        res = await user_socket[uid].recv()
        movement = json.loads(res)
        games[game_id]['grid'] = movement['grid']
        
        if check_winner(game_id):
            await end_game(game_id, uid)

        if not is_valid_movement(game_id, movement):
            await end_game(game_id, [x for x in games[game_id]["users"] if x != uid][0])
            return

        games[game_id]['active_player'] = [x for x in games[game_id]["users"] if x != uid][0]
        games[game_id]['player_event'].set()
        games[game_id]['player_event'].clear()


async def notify_available_users(uid):
    msg = json.dumps({
        'available_players': len(get_available_players()) - 1
    })
    await user_socket[uid].send(msg)


async def wait_game(websocket):
    uid = random.randint(0, 1000)
    users[uid] = None
    user_socket[uid] = websocket
    while True:
        try:
            user_event.set()
            user_event.clear()
            accepted = False
            while not accepted or len(get_available_players()) < 2:
                await notify_available_users(uid)
                await wait_players()
                await notify_available_users(uid)
                await websocket.send("Click to play!")
                res = await websocket.recv()
                accepted = True

            game_id = get_available_game()
            await start_game(uid, game_id)
            print(f"end game {uid}")
            users[uid] = None
        except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError) as e:
            if users[uid] is not None:
                await end_game(users[uid], [x for x in games[users[uid]]["users"] if x != uid][0])
                
            print(f"user {uid} disconnected")
            del users[uid]
            del user_socket[uid]
            user_event.set()
            user_event.clear()
            return

class webrequests(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.path = f"./static/{self.path}"
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

def static_server(httpport, webrequests):
    webserver = socketserver.TCPServer(("", httpport), webrequests)
    webserver.serve_forever()

async def server(ip, gameport, httpport):
    print(f"starting server on {ip}:{gameport}")
    print(f"grid {config['width']}x{config['height']}")
    print(f"http server listening on http://{ip}:{httpport}/")
    staticserver = threading.Thread(target=static_server, name="http server", args=(httpport, webrequests))
    staticserver.start()
    print(f"-"*40)
    async with websockets.serve(wait_game, ip, gameport):
        await asyncio.Future()  # run forever



@click.command()
@click.option('--width', default=10, help='Grid width')
@click.option('--height', default=10, help='Grid height')
@click.option('--ip', default='0.0.0.0', help='Server IP')
@click.option('--gameport', default=8765, help='Game websocket port')
@click.option('--webport', default=8000, help='Game http port')
def main(width, height, ip, gameport, webport):
    config["width"] = width
    config["height"] = height
    asyncio.run(server(ip, gameport, webport))

if __name__ == "__main__":
    main()
