document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded. Setting up button events...'); // This confirms that the DOM is fully loaded

    document.getElementById('addOne').addEventListener('click', function() {
        console.log('Adding one player...'); // This will log when the +1 user button is clicked
        addPlayers(1);
    });

    document.getElementById('addTen').addEventListener('click', function() {
        console.log('Adding ten players...'); // This will log when the +10 users button is clicked
        addPlayers(10);
    });

    document.getElementById('addHundred').addEventListener('click', function() {
        console.log('Adding one hundred players...'); // This will log when the +100 users button is clicked
        addPlayers(100);
    });
});


let players = [];
let nextId = 1;
let currentLevel = 0;
let playersAtCurrentLevel = 0;
let maxPlayersAtCurrentLevel = 1;
let parentIds = [[]];
let piggybank = 0; // Initialize the piggybank for excess commissions

function addPlayers(count) {
    const container = document.getElementById('players');
    for (let i = 0; i < count; i++) {
        if (playersAtCurrentLevel >= maxPlayersAtCurrentLevel) {
            currentLevel++;
            playersAtCurrentLevel = 0;
            maxPlayersAtCurrentLevel *= 3;
            parentIds[currentLevel] = [];
        }

        let parentId = null;
        if (currentLevel > 0) {
            let parentIndex = Math.floor(playersAtCurrentLevel / 3);
            parentId = parentIds[currentLevel - 1][parentIndex];
        }

        const purchaseDetails = calculatePurchase();
        const newPlayer = {
            id: nextId,
            level: currentLevel,
            parentId: parentId,
            purchase: purchaseDetails.total,
            initialPurchase: purchaseDetails.total,
            commissions: 0,
            maxCommissions: purchaseDetails.total * 2,
            frozen: false,
            commissionCalculated: false
        };
        players.push(newPlayer);
        parentIds[currentLevel].push(newPlayer.id);
        distributeCommissions(newPlayer);
        displayPlayer(newPlayer, container);
        nextId++;
        playersAtCurrentLevel++;
    }
    updateSummary();
}

function distributeCommissions(newPlayer) {
    let currentId = newPlayer.parentId;
    const commissionFromNew = newPlayer.purchase * 0.02;

    while (currentId !== null) {
        const parent = players.find(p => p.id === currentId);
        if (parent) {
            if (!parent.frozen) {
                const commissionToTake = Math.min(commissionFromNew, parent.maxCommissions - parent.commissions);
                parent.commissions += commissionToTake;
                piggybank += (commissionFromNew - commissionToTake); // Only add the difference to the piggybank if the parent is not frozen and can take less than the full commission

                if (parent.commissions >= parent.maxCommissions) {
                    freezePlayer(parent);
                }
                updatePlayerDisplay(parent);
            }
            currentId = parent.parentId;  // Continue up the pyramid regardless of the frozen state
        } else {
            break;  // Stop if no more parents found
        }
    }
}

function updateCommissions() {
    players.forEach(player => {
        if (!player.frozen) {
            const descendants = findAllDescendants(player.id);
            descendants.forEach(descId => {
                const desc = players.find(p => p.id === descId);
                if (!desc.commissionCalculated) { // Check if commission from this descendant has been calculated
                    const commissionValue = desc.purchase * 0.02;
                    const commissionToTake = Math.min(commissionValue, player.maxCommissions - player.commissions);
                    player.commissions += commissionToTake;
                    piggybank += (commissionValue - commissionToTake);
                    desc.commissionCalculated = true; // Mark this commission as calculated
                    if (player.commissions >= player.maxCommissions) {
                        freezePlayer(player);
                    }
                    updatePlayerDisplay(player);
                }
            });
        }
    });
}

function freezePlayer(player) {
    player.frozen = true;
    updatePlayerDisplay(player);
}

function findAllDescendants(playerId) {
    let descendants = [];
    let queue = [playerId];
    while (queue.length > 0) {
        let currentId = queue.shift();
        let children = players.filter(p => p.parentId === currentId).map(p => p.id);
        descendants = descendants.concat(children);
        queue = queue.concat(children);
    }
    return descendants;
}

function updatePlayerDisplay(player) {
    const playerDiv = document.getElementById(`player-${player.id}`);
    if (playerDiv) {
        playerDiv.innerHTML = `
            ID: ${player.id}<br>
            Parent ID: ${player.parentId || 'None'}<br>
            Total: $${player.purchase.toFixed(2)}<br>
            Commissions: $${player.commissions.toFixed(2)}
        `;
        if (player.frozen) {
            playerDiv.style.backgroundColor = 'red';
        } else {
            playerDiv.style.backgroundColor = ''; // Reset background color if not frozen
        }
    }
}

function displayPlayer(player, container) {
    let levelDiv = document.getElementById(`level-${player.level}`);
    if (!levelDiv) {
        levelDiv = document.createElement('div');
        levelDiv.id = `level-${player.level}`;
        levelDiv.className = 'level';
        container.appendChild(levelDiv);
    }
    let playerDiv = document.createElement('div');
    playerDiv.className = 'player';
    playerDiv.id = `player-${player.id}`;
    playerDiv.innerHTML = `
        ID: ${player.id}<br>
        Parent ID: ${player.parentId || 'None'}<br>
        Total: $${player.purchase.toFixed(2)}<br>
        Commissions: $${player.commissions.toFixed(2)}
    `;
    if (player.frozen) {
        playerDiv.style.backgroundColor = 'red';
    }
    levelDiv.appendChild(playerDiv);
}

function calculatePurchase() {
    const prices = [10, 100, 250, 500, 1000, 2500, 5000];
    const probabilities = [0.99, 0.20, 0.15, 0.10, 0.05, 0.02, 0.01];
    let total = 0;

    prices.forEach((price, index) => {
        if (Math.random() < probabilities[index]) {
            total += price;
        }
    });

    if (total === 0) {
        total = 10;  // Ensure a minimum purchase of $10
    }

    return {
        total: total,
        details: 'Purchases: ' + total + '$'
    };
}

function updateSummary() {
    const totalPlayers = document.getElementById('totalPlayers');
    const totalPurchases = document.getElementById('totalPurchases');
    const totalCommissions = document.getElementById('totalCommissions'); // Removed the incorrect 'the'
    const piggybankTotal = document.getElementById('piggybankTotal'); // Removed the incorrect 'the'

    totalPlayers.textContent = players.length;
    totalPurchases.textContent = `$${players.reduce((sum, p) => sum + p.purchase, 0).toFixed(2)}`;
    totalCommissions.textContent = `$${players.reduce((sum, p) => sum + p.commissions, 0).toFixed(2)}`;
    piggybankTotal.textContent = `$${piggybank.toFixed(2)}`;
    document.getElementById('activeLines').textContent = currentLevel + 1;
}
