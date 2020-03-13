const net = require('net');
const dns = require('dns');


let $chatWindow = $('#messages');
const dialogs = (require('dialogs'))()
dialogs.prompt("auth server address: ", "", (a) => {
    dialogs.prompt("chat server address: ", "", (b) => {
        dialogs.prompt("username", "", (c) => {
            const chat = net.createConnection(8080, a);
            const auth = net.createConnection(8090, b);
    
            dns.lookup(b, {
                family: 4,
                hints: dns.ADDRCONFIG | dns.V4MAPPED}, (err, addr, family) => {
                auth.write(JSON.stringify({intent: "register", data: {id: c, server: addr}}));
            });

            function printMessage(fromUser, message) {
                var $user = $('<span class="username">').text(fromUser + ':');
                if (fromUser === c) {
                  $user.addClass('me');
                }
                var $message = $('<span class="message">').text(message);
                var $container = $('<div class="message-container">');
                $container.append($user).append($message);
                $chatWindow.append($container);
                $chatWindow.scrollTop($chatWindow[0].scrollHeight);
            }
    
            $("#chat-input").on('keyup', function (e) {
                if (e.keyCode === 13) {
                    chat.write(JSON.stringify({intent: "message", data: e.target.value}))
                    e.target.value = "";
                }
            });
            
            auth.on('data', (data) => {
                try {
                    data = JSON.parse(data.toString().trim());
                    chat.write(JSON.stringify({intent: "claim", data: data.id}));   
                } catch (error) {
                    throw error
                }
            })
            
            
            chat.on('data', (data) => {
                try {
                    data = JSON.parse(data.toString().trim()).data;
                    printMessage(data.from, data.content);
                    var notify = new Notification('Hi there!', {
                        body: 'How are you doing?',
                        icon: 'https://bit.ly/2DYqRrh',
                    });
                    
                } catch (error) {
                    throw error;  
                }
            })
        })
    })
})