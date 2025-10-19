    const WebSocket = require("ws");
    const server = new WebSocket.Server({ port: 8082 });
    console.log("server hello");

    const sockets = new Map(); //socket -> player

    const winnerSet = [
        [0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24],
        [0, 5, 10, 15, 20],
        [1, 6, 11, 16, 21],
        [2, 7, 12, 17, 22],
        [3, 8, 13, 18, 23],
        [4, 9, 14, 19, 24],
        [0, 6, 12, 18, 24],
        [4, 8, 12, 16, 20]
    ]

    const assignPlayer = (ws) => {
        if (sockets.size == 2) return null; //spectator

        if (sockets.size == 0) {
            sockets.set(ws, 'odd');
            return 'odd';
        }
        sockets.set(ws, 'even');
        return 'even';
    }

    const handleWinner = (board) => {
        let cntOdd = 0, cntEven = 0;
        for (const set of winnerSet){
            cntOdd = 0; cntEven = 0;
            for (const i of set){
                if (board[i] === 0) {
                    break;
                } else {
                    if (board[i] % 2 === 0) cntEven++;
                    else cntOdd++;
                    if (cntEven && cntOdd) { //stop early if exit odd and even in one line
                        break;
                    }
                }
            }
            if (cntOdd == 5 || cntEven == 5) break;
        }

        if (cntOdd == 5) return 'odd';
        if (cntEven == 5) return 'even';
        return null;
    }

    server.on("listening", () => console.log("WS listening on :8082"));
    server.on("error", (e) => console.error("WSS error:", e));

    server.on("connection", (ws) => {
        console.log("connected");

        ws.on('message', (msg) => {
            const {type, data} = JSON.parse(msg);

            switch (type){
                case 'prepare':
                    console.log("Hello new client");
                    ws.send(JSON.stringify({
                        type: 'start',
                        data: {
                            player: assignPlayer(ws)
                        },
                    }));

                    for (const wss of sockets.keys()){
                        wss.send(JSON.stringify({
                            type: 'fight',
                            data: {
                                isStart: (sockets.size >= 2)
                            }
                        }))
                    }
                    break;
                case ('increasement'):
                    const tmpBoard = data.board;
                    tmpBoard[data.square] += 1;
                    
                    server.clients.forEach((socket) => {
                        socket.send(JSON.stringify({
                            type: 'update',
                            data: {
                                board: tmpBoard,   
                                winner: handleWinner(tmpBoard) 
                            }      
                        }))
                    })
                    break;
                default:
                    break;
            }
        })

        ws.on('close', () => {
            sockets.delete(ws);
        })
    })

