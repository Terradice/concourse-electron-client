const net = require('net');
const dns = require('dns');


let $chatWindow = $('#messages');
let me = "";
let nicks = {};
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
                var $user = $('<a class="username">').text(`[${nicks[fromUser] ? nicks[fromUser] : fromUser}]`);
                $user.on('contextmenu', () => {
                    dialogs.prompt(`Set nickname for ${fromUser}`, "", (nick) => {
                        nicks[fromUser] = nick;
                    });
                })

                let mentions  = message.match(/<@(.*)>/gi);
                if(mentions) {
                    mentions.forEach((m) => {
                        if(nicks[m.slice(2, -1)] ) {
                            message = message.replace(m, `@${nicks[m.slice(2, -1)]}`);
                        };

                        if(m.slice(2, -1) == me && fromUser !== me) {
                            var notify = new Notification(fromUser, {
                                body: message
                            });
                        }
                    });
                }

                if (fromUser === me) {
                    $user.addClass('me');
                } else if(fromUser === "server") {
                    $user.addClass('server');
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
                    me = data.id;
                    nicks[me] = c;
                    chat.write(JSON.stringify({intent: "claim", data: data.id}));   
                } catch (error) {
                    throw error
                }
            })
            
            
            chat.on('data', (data) => {
                try {
                    data = JSON.parse(data.toString().trim()).data;
                    if(!data.from) {
                        printMessage("server", data.content);
                    } else {
                        printMessage(data.from, data.content);
                    }
                } catch (error) {
                    throw error;  
                }
            })
        })
    })
})