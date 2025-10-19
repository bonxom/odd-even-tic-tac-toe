import { useEffect, useRef, useState } from "react";
import Board from "./Board";

function Game(){
    const [board, setBoard] = useState(Array(25).fill(0));
    const [player, setPlayer] = useState(null);
    const [winner, setWinner] = useState(null);
    const [isStart, setIsStart] = useState(false);
    const wsRef = useRef(null);
    const playerRef = useRef(null);

    useEffect( () => {
        playerRef.current = player;
    }, [player])

    useEffect( () => {

        if (wsRef.current) return;

        const ws = new WebSocket("ws://localhost:8082");
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to server");
            ws.send(JSON.stringify({
                type: 'prepare',
            }));
        };

        ws.onmessage = (event) => {
            const { type, data } = JSON.parse(event.data);

            switch (type){
                case 'start':
                    console.log('start ' + data.player);
                    setPlayer(data.player);
                    playerRef.current = data.player;
                    break;
                case 'fight':
                    setIsStart(data.isStart);
                    break;
                case 'update':
                    console.log(data);
                    setBoard(data.board);
                    setWinner(data.winner);
                    break;
                default:
                    break;
            }
        };

        return () => {
            // ws.close();
            ws.current = null;
        };
        
    }, []);

    const handleClick = (index) => {
        console.log(isStart + ' and ' + winner);
        if (!isStart || winner) return;

        let tmpBoard = [...board];
        // tmpBoard[index]++;
        
        setBoard(tmpBoard);
        wsRef.current.send(JSON.stringify({
            type: 'increasement',
            data: {
                board: tmpBoard,
                square: index,
            }
        }))
    }

    return(
        <div className="main">
            <h2>{
                (isStart || player == null) ? 
                    ((winner) ? ("Winner is " + winner) : "Game start!")
                    : ("Not start")
            }
            </h2>
            <div className="game">
                <span className="player">{
                    (!player) ? 
                        "You are the spectator":
                        ("You are player " + player)}</span>
                <span className="turn">{
                    (player != null) ?
                        ((winner) ? 
                            ( (player === winner)? "You win" : "You lose" )
                            :"")
                        :"Keep watching!    "
                }
                </span>
                <Board board={board} handleClick={handleClick}></Board>
            </div>
        </div>
    )
}

export default Game;