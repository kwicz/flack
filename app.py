import os
import requests
import eventlet
import datetime

from flask import Flask, jsonify, render_template, request, session
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mysecret'
socketio = SocketIO(app)


"""Global Variables"""

channels = []
messageLog = {}
onlineUsers = {}


"""Flask Routes"""

@app.route('/', methods=['GET', 'POST'])
def index():
	if request.method == 'POST':
		session.clear()
		session['username'] = request.form.get('displayName')
		session.permanent = True
		return render_template('chat.html', channels=channels, messageLog=messageLog)
	else:
		return render_template('index.html')

@app.route('/chat')
def chat():
	return render_template('chat.html', channels=channels, messageLog=messageLog)


"""Socket Routes"""

# Add new channels to server side memory.
@socketio.on('addChannel')
def appendChannel(data):
	newChannel = data['newChannel']
	if newChannel in channels:
		channel = newChannel
		emit('error', {
			'error': "That channel already exists!"
			}, channel=channel)
	else: 
		channels.append(newChannel)
		messageLog.setdefault(newChannel, [])
		emit('newChannel', newChannel, broadcast=True)


# Let user join new room.
@socketio.on('join')
def on_join(data):
	username = data['username']
	channel = data['channel']
	session['channel'] = channel
	emit('messageHistory', messageLog[channel])
	onlineUsers.setdefault(channel, [])
	if username not in onlineUsers[channel]:
		onlineUsers[channel].append(username)
	join_room(channel)
	emit('userJoined', {
		'channel': channel, 
		'username': username, 
		'onlineUsers': onlineUsers[channel]
		}, broadcast=True, room=channel)

# Let user leave current room.
@socketio.on('leave')
def on_leave(data):
	username = str(data['username'])
	channel = str(data['channel'])
	onlineUsers[channel].remove(username)
	emit('userLeft', {
		'channel': channel, 
		'username': username, 
		'onlineUsers': onlineUsers[channel]
		}, broadcast=True, room=channel)
	leave_room(channel)

# Handle new messages. 
@socketio.on('message')
def handle_message(data):
	channel = data['channel']
	username = data['username']
	message = data['message']
	now = datetime.now()
	timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
	messageLog[channel].append((username, timestamp, message))
	while(len(messageLog[channel]) > 100):
		messageLog[channel].pop(0)
	emit('message', {
		'username': username, 
		'message': message,
		'timestamp': timestamp
		}, broadcast=True, room=channel)

if __name__ == '__main__':
	socketio.run(app)


