document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#game-board');
    const startButton = document.getElementById('start-game');
    const API_ENDPOINT = 'https://bpp0o4ugy1.execute-api.us-west-2.amazonaws.com/dev';
    let cardsChosen = [];
    let cardsChosenId = [];
    let cardsWon = [];
    let gameStartTime = null;
    let moves = 0;
    
    // Lambda API endpoint - replace with your actual API Gateway URL
    
    const cardArray = [
        { name: 'card1', img: 'images/distracted.png' },
        { name: 'card1', img: 'images/distracted.png' },
        { name: 'card2', img: 'images/drake.png' },
        { name: 'card2', img: 'images/drake.png' },
        { name: 'card3', img: 'images/fine.png' },
        { name: 'card3', img: 'images/fine.png' },
        { name: 'card4', img: 'images/rollsafe.png' },
        { name: 'card4', img: 'images/rollsafe.png' },
        { name: 'card5', img: 'images/success.png' },
        { name: 'card5', img: 'images/success.png' },
    ];

    function shuffle(array) {
        array.sort(() => 0.5 - Math.random());
    }

    function createBoard() {
        shuffle(cardArray);
        grid.innerHTML = '';
        cardsWon = [];
        moves = 0;
        gameStartTime = new Date();
        
        for (let i = 0; i < cardArray.length; i++) {
            const card = document.createElement('img');
            card.setAttribute('src', 'images/blank.png');
            card.setAttribute('data-id', i);
            card.addEventListener('click', flipCard);
            grid.appendChild(card);
        }
        
        // Add score display
        updateScoreDisplay();
    }

    function flipCard() {
        let cardId = this.getAttribute('data-id');
        if (!cardsChosenId.includes(cardId)) {
            cardsChosen.push(cardArray[cardId].name);
            cardsChosenId.push(cardId);
            this.setAttribute('src', cardArray[cardId].img);
            if (cardsChosen.length === 2) {
                moves++;
                updateScoreDisplay();
                setTimeout(checkForMatch, 500);
            }
        }
    }

    function checkForMatch() {
        const cards = document.querySelectorAll('#game-board img');
        const firstCardId = cardsChosenId[0];
        const secondCardId = cardsChosenId[1];
        
        if (cardsChosen[0] === cardsChosen[1] && firstCardId !== secondCardId) {
            cards[firstCardId].style.visibility = 'hidden';
            cards[secondCardId].style.visibility = 'hidden';
            cards[firstCardId].removeEventListener('click', flipCard);
            cards[secondCardId].removeEventListener('click', flipCard);
            cardsWon.push(cardsChosen);
        } else {
            cards[firstCardId].setAttribute('src', 'images/blank.png');
            cards[secondCardId].setAttribute('src', 'images/blank.png');
        }
        
        cardsChosen = [];
        cardsChosenId = [];
        
        if (cardsWon.length === cardArray.length / 2) {
            
            gameCompleted();
        }
    }

    function gameCompleted() {
        const gameEndTime = new Date();
        const timeTaken = Math.floor((gameEndTime - gameStartTime) / 1000);

 
        var enteredName = prompt(`Congratulations! You found them all! Time: ${timeTaken} seconds\nMoves: ${moves} \nEnter your name: `)
        if (enteredName == "" || enteredName == null || enteredName == undefined || enteredName == " " ) {
            enteredName = "Anonymous";
        }
        // Send score to Lambda
        submitScore(timeTaken, moves,enteredName);
    }

    function updateScoreDisplay() {
        let scoreDisplay = document.getElementById('score-display');
        if (!scoreDisplay) {
            scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'score-display';
            scoreDisplay.className = 'score-display';
            document.querySelector('.container').insertBefore(scoreDisplay, grid);
        }else{
            scoreDisplay.style.display = 'block';
        }
        
        const timeElapsed = gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0;
        scoreDisplay.innerHTML = `
            <p>Time: ${timeElapsed}s | Moves: ${moves} | Matches: ${cardsWon.length}/${cardArray.length / 2}</p>
        `;
    }



    async function loadLeaderboard() {
        try {
            const response = await fetch(`${API_ENDPOINT}/leaderboard`);
            if (response.ok) {
                const leaderboard = await response.json();
                displayLeaderboard(leaderboard);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    function displayLeaderboard(leaderboard) {
        let leaderboardDiv = document.getElementById('leaderboard');
        if (!leaderboardDiv) {
            leaderboardDiv = document.createElement('div');
            leaderboardDiv.id = 'leaderboard';
            leaderboardDiv.className = 'leaderboard';
            document.querySelector('.container').appendChild(leaderboardDiv);
        }
        
        leaderboardDiv.innerHTML = `
            <h3>Leaderboard</h3>
            <div class="leaderboard-content">
                ${leaderboard.map((score, index) => `
                    <div class="leaderboard-item">
                        <span>${index + 1}. Time: ${score.time}s, Moves: ${score.moves}, Score: ${score.score}, Name: ${score.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Add these functions to your existing script.js
    async function submitScore(time, moves,name) {
        try {

            const response = await fetch(`${API_ENDPOINT}/submit-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time: time,
                    moves: moves,
                    timestamp: new Date().toISOString(),
                    name: name
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Score submitted successfully:', result);
                loadLeaderboard(); // Refresh leaderboard
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }





    startButton.addEventListener('click', () => {
        createBoard();
        loadLeaderboard();
    });

    // Update timer every second during game
    setInterval(() => {
        if (gameStartTime && cardsWon.length < cardArray.length / 2) {
            updateScoreDisplay();
        }
    }, 1000);
});