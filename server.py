#!/usr/bin/env python

import asyncio
import websockets
import random
import json
import time
from datetime import datetime

SHAPE = (10, 10)

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

def get_available_players():
    is_waiting = lambda x: users[x] is None
    return list(filter(is_waiting, users))

async def wait_players():
    while len(get_available_players()) - 1 < 1:
        await user_event.wait()

def create_game():
    game_id = random.randint(0, 1000)
    games[game_id] = {
        "users": [],
        "grid": [[None]*SHAPE[0]]*SHAPE[1],
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

async def end_game(game_id, winner_id):
    print(f"game {game_id}: winner {winner_id}")
    loser_id = [x for x in games[game_id]["users"] if x != winner_id][0]
    await user_socket[winner_id].send(json.dumps({'state': 'winner!'}))
    await user_socket[loser_id].send(json.dumps({'state': 'loser!'}))
    games[game_id]['winner'] = winner_id
    games[game_id]['player_event'].set()
    games[game_id]['player_event'].clear()

async def start_game(uid, game_id):
    print(f"user {uid} started in {game_id}")
    users[uid] = game_id
    current_game = games[game_id]
    current_game["users"].append(uid)

    if len(current_game["users"]) < 2:
        current_game['active_player'] = uid
        current_game['player_event'] = asyncio.Event()
        await current_game['player_event'].wait()
    else:
        current_game['player_event'].set()
        current_game['player_event'].clear()
    
    await user_socket[uid].send(json.dumps({'game_id': game_id}))

    while current_game['winner'] is None:
        current_game['step'] += 1
        while current_game['active_player'] != uid:
            await current_game['player_event'].wait()
            if current_game['winner'] is not None:
                return

        await user_socket[uid].send(json.dumps({'msg': 'ping'}))

        res = await user_socket[uid].recv()
        movement = json.loads(res)
        if current_game["step"] > 10:
            await end_game(game_id, uid)
            return

        if not is_valid_movement(game_id, movement):
            await end_game(game_id, [x for x in current_game["users"] if x != uid][0])
            return

        current_game['active_player'] = [x for x in current_game["users"] if x != uid][0]
        current_game['player_event'].set()
        current_game['player_event'].clear()


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
            await notify_available_users(uid)
            await wait_players()
            await notify_available_users(uid)
            await websocket.send("Click to play!")
            res = await websocket.recv()
            game_id = get_available_game()
            await start_game(uid, game_id)
            print(f"end game {uid}")
            users[uid] = None
        except websockets.exceptions.ConnectionClosedOK as e:
            if users[uid] is not None:
                await end_game(users[uid], [x for x in games[users[uid]]["users"] if x != uid][0])
                
            print(f"user {uid} disconnected")
            del users[uid]
            del user_socket[uid]
            user_event.set()
            user_event.clear()
            return


async def main():
    async with websockets.serve(wait_game, "localhost", 8765):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
