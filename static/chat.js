
document.addEventListener('DOMContentLoaded', () => {

  // Update URL.
  history.pushState({
    id: "chat"
  }, "Chat", "/chat");

  // Welcome user.
  const username = localStorage.getItem("displayName");
  if (username == null){
      window.location = "/";
      alert("Please enter username!")
  };
  document.getElementById("displayName").innerHTML = username;

  // Initialize websocket.
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // Add new channels to drop down.
  function appendChannel(channel) {
      let option = document.createElement("option")
      option.innerHTML = channel;
      document.querySelector("#channel").append(option);
  }

  // Users can join a new room.
  function joinRoom(channel) {
      document.getElementById("channelHeader").innerHTML = channel;
      localStorage.setItem('channel', channel)
      socket.emit("join", {"channel": channel, "username": username})
  }

  // Users can leave a room.
  function leaveRoom(channel) {
      socket.emit("leave", {"channel": channel, "username": username})
      document.getElementById("messages").innerHTML = ""
  }

  // Print messages to chat window.
  function appendMessage(message) {
      let li = document.createElement("li");
      li.innerHTML = message;
      document.querySelector("#messages").append(li);
      var chatWindow = document.getElementById("chatWindow");
      chatWindow.scrollIntoView({ behavior: 'smooth', block: 'end' });
      chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Print users to user window.
  function appendUser(user) {
      let li = document.createElement("li");
      li.innerHTML = user;
      document.querySelector("#users").append(li);
      var chatWindow = document.getElementById("chatWindow");
      chatWindow.scrollIntoView({ behavior: 'smooth', block: 'end' });
      chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Load user's last channel.
  let lastChannel = localStorage.getItem("channel");
  if (lastChannel != null) {
    joinRoom(lastChannel)
  }; 

  // Enter default channel if none.
  if (channel.value == "") {
      let channel = "Home Room";
      socket.emit("addChannel", {"newChannel": channel});
      joinRoom(channel);
    };

  // Users can create new room.
  document.querySelector("#createChannel").onsubmit = () => {
      let newChannel = document.querySelector("#newChannel").value;
      socket.emit("addChannel", {"newChannel": newChannel});
      document.querySelector("#newChannel").value = "";
      return false;
  };
  
  socket.on('newChannel', data => {
      appendChannel(data);
  });

  // Users can join an existing room.
  document.querySelector("#go").onclick = () => {
      leaveRoom(localStorage.getItem("channel"));
      let joinChannel = document.getElementById("channel").value;
      joinRoom(joinChannel);
  };

  // Accept user's messages.
  document.querySelector("#sendbutton").onclick = () =>  {
      let message = document.querySelector('#myMessage').value;
      let channel = (localStorage.getItem("channel"));
      socket.emit('message', {
          'channel': channel,
          'username': username,
          'message': message
      });
      document.querySelector("#myMessage").value = "";
      return false;
  };

  // Add messages to chat window.
  socket.on('message', data => {
      appendMessage(data.username + " (" + data.timestamp + "): " + data.message);
  });

  // Load previous messages.
  socket.on('messageHistory', data => {
      for (index = 0; index < data.length; index++) {
          let messageHistory = data[index][0] + " (" + data[index][1] + "): " + data[index][2];
          appendMessage(messageHistory);
      };
  });

  // Add users to room when they join.
  socket.on('userJoined', data => {
      message = data.username + " has joined " + data.channel + "."
      appendMessage(message);
      document.getElementById("users").innerHTML = ""
      for (index = 0; index < data.onlineUsers.length; index++) {
          appendUser(data.onlineUsers[index]);
      };       
  });

  // Remove users from room when they leave.
  socket.on('userLeft', data => {
      message = data.username + " has left " + data.channel + "."
      appendMessage(message);
      document.getElementById("users").innerHTML = ""
      for (index = 0; index < data.onlineUsers.length; index++) {
          appendUser(data.onlineUsers[index]);
      };
  });

  // Send errors from the server.
  socket.on('error', data => {
      alert(data.error)
  });
  
  // User leaves room when leaving page.
  window.addEventListener('unload', function(event) {
    leaveRoom(localStorage.getItem('channel'))
  });

});
