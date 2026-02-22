const boardElement = document.getElementById("board");

/* =========================
   VARIÁVEIS GLOBAIS
========================= */

let selected = null;
let turn = "white";

let whiteScore = localStorage.getItem("whiteScore") ? parseInt(localStorage.getItem("whiteScore")) : 0;
let blackScore = localStorage.getItem("blackScore") ? parseInt(localStorage.getItem("blackScore")) : 0;

let whiteTime = 300;
let blackTime = 300;
let timerInterval = null;

const moveSound = new Audio("/static/sounds/move.mp3");

/* =========================
   TABULEIRO INICIAL
========================= */

function initialBoard() {
    return [
        ["r","n","b","q","k","b","n","r"],
        ["p","p","p","p","p","p","p","p"],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["P","P","P","P","P","P","P","P"],
        ["R","N","B","Q","K","B","N","R"]
    ];
}

let board = initialBoard();

let castlingRights = {
    whiteKingMoved: false,
    blackKingMoved: false,
    whiteLeftRookMoved: false,
    whiteRightRookMoved: false,
    blackLeftRookMoved: false,
    blackRightRookMoved: false
};

const pieces = {
    "r":"♜","n":"♞","b":"♝","q":"♛","k":"♚","p":"♟",
    "R":"♖","N":"♘","B":"♗","Q":"♕","K":"♔","P":"♙"
};

/* =========================
   CRIAR TABULEIRO
========================= */

function createBoard() {
    boardElement.innerHTML = "";

    for (let r=0;r<8;r++){
        for (let c=0;c<8;c++){
            const square=document.createElement("div");
            square.classList.add("square");
            square.classList.add((r+c)%2===0?"white":"black");
            square.dataset.row=r;
            square.dataset.col=c;
            square.textContent=pieces[board[r][c]]||"";
            square.addEventListener("click",handleClick);
            boardElement.appendChild(square);
        }
    }
}

/* =========================
   CLIQUE
========================= */

function handleClick(e){
    const r=parseInt(e.target.dataset.row);
    const c=parseInt(e.target.dataset.col);

    if(selected){
        if(isValidMove(selected.r,selected.c,r,c)){
            movePiece(selected.r,selected.c,r,c);
            turn = turn==="white"?"black":"white";

            if(isKingInCheck(turn)){
                if(!hasAnyValidMove(turn)){
                    alert("XEQUE-MATE!");
                    if(turn==="white") blackScore++;
                    else whiteScore++;
                    updateScore();
                    restartGame();
                    return;
                } else {
                    alert("XEQUE!");
                }
            }

            selected=null;
            createBoard();
        }else{
            selected=null;
            createBoard();
        }
    }else{
        const piece=board[r][c];
        if(piece && isCorrectTurn(piece)){
            selected={r,c};
            e.target.classList.add("selected");
        }
    }
}

/* =========================
   MOVIMENTAÇÃO
========================= */

function isCorrectTurn(piece){
    return (turn==="white" && piece===piece.toUpperCase()) ||
           (turn==="black" && piece===piece.toLowerCase());
}

function isEnemy(p1,p2){
    if(!p2) return false;
    return (p1===p1.toUpperCase() && p2===p2.toLowerCase()) ||
           (p1===p1.toLowerCase() && p2===p2.toUpperCase());
}

function isValidMove(fr,fc,tr,tc){
    const piece=board[fr][fc];
    const target=board[tr][tc];
    if(fr===tr && fc===tc) return false;
    if(target && !isEnemy(piece,target)) return false;

    const dr=tr-fr;
    const dc=tc-fc;

    switch(piece.toLowerCase()){
        case "p": return pawnMove(piece,fr,fc,tr,tc,dr,dc,target);
        case "r": return rookMove(fr,fc,tr,tc);
        case "n": return knightMove(dr,dc);
        case "b": return bishopMove(fr,fc,tr,tc);
        case "q": return rookMove(fr,fc,tr,tc) || bishopMove(fr,fc,tr,tc);
        case "k": return kingMove(piece,fr,fc,tr,tc,dr,dc);
    }
    return false;
}

function pawnMove(piece,fr,fc,tr,tc,dr,dc,target){
    const dir=piece==="P"?-1:1;
    const startRow=piece==="P"?6:1;

    if(dc===0 && !target){
        if(dr===dir) return true;
        if(fr===startRow && dr===2*dir && !board[fr+dir][fc]) return true;
    }
    if(Math.abs(dc)===1 && dr===dir && target) return true;
    return false;
}

function rookMove(fr,fc,tr,tc){
    if(fr!==tr && fc!==tc) return false;
    return isPathClear(fr,fc,tr,tc);
}

function bishopMove(fr,fc,tr,tc){
    if(Math.abs(tr-fr)!==Math.abs(tc-fc)) return false;
    return isPathClear(fr,fc,tr,tc);
}

function knightMove(dr,dc){
    return (Math.abs(dr)===2 && Math.abs(dc)===1) ||
           (Math.abs(dr)===1 && Math.abs(dc)===2);
}

function kingMove(piece,fr,fc,tr,tc,dr,dc){
    if(Math.abs(dr)<=1 && Math.abs(dc)<=1) return true;
    return false;
}

function isPathClear(fr,fc,tr,tc){
    const stepR=Math.sign(tr-fr);
    const stepC=Math.sign(tc-fc);
    let r=fr+stepR;
    let c=fc+stepC;
    while(r!==tr || c!==tc){
        if(board[r][c]) return false;
        r+=stepR;
        c+=stepC;
    }
    return true;
}

function movePiece(fr,fc,tr,tc){
    const piece=board[fr][fc];
    board[tr][tc]=piece;
    board[fr][fc]="";

    // promoção
    if(piece==="P" && tr===0) board[tr][tc]="Q";
    if(piece==="p" && tr===7) board[tr][tc]="q";

    moveSound.play();
}

/* =========================
   XEQUE
========================= */

function findKing(color){
    const king = color==="white"?"K":"k";
    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){
            if(board[r][c]===king) return {r,c};
        }
    }
}

function isKingInCheck(color){
    const kingPos=findKing(color);

    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){
            const piece=board[r][c];
            if(piece && ((color==="white" && piece===piece.toLowerCase()) ||
                         (color==="black" && piece===piece.toUpperCase()))){
                if(isValidMove(r,c,kingPos.r,kingPos.c)){
                    return true;
                }
            }
        }
    }
    return false;
}

function hasAnyValidMove(color){
    for(let fr=0;fr<8;fr++){
        for(let fc=0;fc<8;fc++){
            const piece=board[fr][fc];
            if(piece && isCorrectTurn(piece)){
                for(let tr=0;tr<8;tr++){
                    for(let tc=0;tc<8;tc++){
                        if(isValidMove(fr,fc,tr,tc)) return true;
                    }
                }
            }
        }
    }
    return false;
}

/* =========================
   TIMER
========================= */

function startTimer(){
    if(timerInterval) clearInterval(timerInterval);

    timerInterval=setInterval(()=>{
        if(turn==="white") whiteTime--;
        else blackTime--;

        updateTimerDisplay();

        if(whiteTime<=0){
            alert("Tempo das brancas acabou!");
            blackScore++;
            updateScore();
            restartGame();
        }

        if(blackTime<=0){
            alert("Tempo das pretas acabou!");
            whiteScore++;
            updateScore();
            restartGame();
        }

    },1000);
}

function updateTimerDisplay(){
    document.getElementById("whiteTimer").textContent=formatTime(whiteTime);
    document.getElementById("blackTimer").textContent=formatTime(blackTime);
}

function formatTime(time){
    let min=Math.floor(time/60);
    let sec=time%60;
    return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function resetTimer(){
    whiteTime=300;
    blackTime=300;
    updateTimerDisplay();
}

/* =========================
   PLACAR
========================= */

function updateScore(){
    document.getElementById("whiteScore").textContent=whiteScore;
    document.getElementById("blackScore").textContent=blackScore;

    localStorage.setItem("whiteScore",whiteScore);
    localStorage.setItem("blackScore",blackScore);
}

function resetScore(){
    whiteScore=0;
    blackScore=0;
    updateScore();
}

/* =========================
   REINICIAR PARTIDA
========================= */

function restartGame(){
    board=initialBoard();
    turn="white";
    selected=null;
    resetTimer();
    createBoard();
    startTimer();
}

/* =========================
   INICIAR
========================= */

createBoard();
updateScore();
updateTimerDisplay();
startTimer();