// Telegram Web App API Integration
let tg = window.Telegram.WebApp;
let user = null;
let stars = 0;
let selectedPayment = null;
let selectedBet = null;

// User statistics
let userStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalWon: 0,
    totalLost: 0,
    referrals: 0,
    achievements: []
};

// Initialize Telegram Web App
function initTelegram() {
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Get user data
        user = tg.initDataUnsafe?.user;
        if (user) {
            document.getElementById('user-name').textContent = user.first_name || 'Игрок';
            if (user.photo_url) {
                document.getElementById('user-avatar').src = user.photo_url;
            }
        }
        
        // Load user stars from Telegram
        loadUserStars();
        
        // Load user statistics
        loadUserStats();
        
        // Set theme
        if (tg.colorScheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // Handle back button
        tg.onEvent('backButtonClicked', () => {
            if (document.getElementById('payment-modal').style.display === 'block') {
                hidePaymentModal();
            } else if (document.getElementById('case-modal').style.display === 'block') {
                hideCaseModal();
            } else {
                tg.close();
            }
        });
    } else {
        // Fallback for testing outside Telegram
        console.log('Telegram Web App not available, using test mode');
        user = { first_name: 'Тестовый игрок', id: 12345 };
        stars = 1000; // Test stars
        updateStarsDisplay();
        loadUserStats();
    }
}

// Load user stars from Telegram
async function loadUserStars() {
    try {
        // In real implementation, you would fetch from your backend
        // For now, we'll use localStorage as fallback
        const savedStars = localStorage.getItem('user_stars');
        if (savedStars) {
            stars = parseInt(savedStars);
        } else {
            stars = 100; // Starting stars
        }
        updateStarsDisplay();
    } catch (error) {
        console.error('Error loading user stars:', error);
        stars = 100;
        updateStarsDisplay();
    }
}

// Save user stars
async function saveUserStars() {
    try {
        localStorage.setItem('user_stars', stars.toString());
        // In real implementation, you would save to your backend
        // await fetch('/api/save-stars', { method: 'POST', body: JSON.stringify({ stars }) });
    } catch (error) {
        console.error('Error saving user stars:', error);
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        const savedStats = localStorage.getItem('user_stats');
        if (savedStats) {
            userStats = { ...userStats, ...JSON.parse(savedStats) };
        }
        
        // Request stats from bot
        if (tg && tg.initDataUnsafe) {
            const statsRequest = {
                type: 'get_stats'
            };
            tg.sendData(JSON.stringify(statsRequest));
        }
        
        updateProfileDisplay();
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Save user statistics
async function saveUserStats() {
    try {
        localStorage.setItem('user_stats', JSON.stringify(userStats));
        // In real implementation, you would save to your backend
        // await fetch('/api/save-stats', { method: 'POST', body: JSON.stringify(userStats) });
    } catch (error) {
        console.error('Error saving user stats:', error);
    }
}

// Update profile display
function updateProfileDisplay() {
    if (user) {
        document.getElementById('profile-name').textContent = user.first_name || 'Игрок';
        document.getElementById('profile-user-id').textContent = user.id;
        document.getElementById('profile-stars').textContent = stars;
        
        if (user.photo_url) {
            document.getElementById('profile-avatar').src = user.photo_url;
        }
    }
    
    // Update statistics
    document.getElementById('games-played').textContent = userStats.gamesPlayed;
    document.getElementById('total-won').textContent = userStats.totalWon;
    document.getElementById('referrals-count').textContent = userStats.referrals;
    
    // Calculate win rate
    const winRate = userStats.gamesPlayed > 0 ? 
        Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100) : 0;
    document.getElementById('win-rate').textContent = winRate + '%';
    
    // Update achievements
    updateAchievements();
    
    // Update referral link
    updateReferralLink();
}

// Update achievements
function updateAchievements() {
    const achievements = document.querySelectorAll('.achievement');
    
    // First game achievement
    if (userStats.gamesPlayed >= 1) {
        achievements[0].classList.remove('locked');
        achievements[0].classList.add('unlocked');
    }
    
    // First win achievement
    if (userStats.gamesWon >= 1) {
        achievements[1].classList.remove('locked');
        achievements[1].classList.add('unlocked');
    }
    
    // Gambler achievement (10 games)
    if (userStats.gamesPlayed >= 10) {
        achievements[2].classList.remove('locked');
        achievements[2].classList.add('unlocked');
    }
    
    // Friendly achievement (1 referral)
    if (userStats.referrals >= 1) {
        achievements[3].classList.remove('locked');
        achievements[3].classList.add('unlocked');
    }
}

// Update referral link
function updateReferralLink() {
    if (user) {
        const referralLink = `https://t.me/your_bot_username?start=ref_${user.id}`;
        document.getElementById('referral-link').value = referralLink;
    }
}

// Copy referral link
function copyReferralLink() {
    const referralInput = document.getElementById('referral-link');
    referralInput.select();
    referralInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        showMessage('Реферальная ссылка скопирована!', 'success');
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(referralInput.value).then(() => {
            showMessage('Реферальная ссылка скопирована!', 'success');
        }).catch(() => {
            showMessage('Не удалось скопировать ссылку', 'error');
        });
    }
}

// Open profile section
function openProfile() {
    // Hide all game sections
    const gameSections = document.querySelectorAll('.game-section');
    gameSections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show profile section
    document.getElementById('profile-section').classList.remove('hidden');
    
    // Update profile display
    updateProfileDisplay();
}

// Record game result
function recordGameResult(betAmount, winAmount, won) {
    userStats.gamesPlayed++;
    userStats.totalLost += betAmount;
    
    if (won) {
        userStats.gamesWon++;
        userStats.totalWon += winAmount;
    }
    
    saveUserStats();
    updateProfileDisplay();
    
    // Send data to bot
    if (tg && tg.initDataUnsafe) {
        const gameData = {
            type: 'game_result',
            bet_amount: betAmount,
            stars_change: won ? winAmount - betAmount : -betAmount,
            won: won
        };
        
        tg.sendData(JSON.stringify(gameData));
    }
}

// Update stars display
function updateStarsDisplay() {
    document.getElementById('stars-count').textContent = stars;
}

// Show message
function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Game Navigation
document.addEventListener('DOMContentLoaded', function() {
    initTelegram();
    
    // Navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    const gameSections = document.querySelectorAll('.game-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const game = button.dataset.game;
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding section
            gameSections.forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(`${game}-section`).classList.remove('hidden');
        });
    });
    
    // Case items
    const caseItems = document.querySelectorAll('.case-item');
    caseItems.forEach(item => {
        item.addEventListener('click', () => {
            const caseType = item.dataset.case;
            const price = parseInt(item.dataset.price);
            openCase(caseType, price);
        });
    });
    
    // Payment options
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedPayment = {
                amount: parseInt(option.dataset.amount),
                stars: parseInt(option.dataset.stars)
            };
        });
    });
    
    // Bet buttons
    const betButtons = document.querySelectorAll('.bet-btn');
    betButtons.forEach(button => {
        button.addEventListener('click', () => {
            const parent = button.closest('.bet-options');
            if (parent) {
                parent.querySelectorAll('.bet-btn').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                selectedBet = {
                    type: button.dataset.bet,
                    multiplier: parseFloat(button.dataset.multiplier)
                };
            }
        });
    });
});

// Roulette Game
function spinRoulette() {
    const betAmount = parseInt(document.getElementById('roulette-bet').value);
    
    if (!selectedBet) {
        showMessage('Выберите ставку!', 'error');
        return;
    }
    
    if (betAmount > stars) {
        showMessage('Недостаточно звезд!', 'error');
        return;
    }
    
    if (betAmount < 1) {
        showMessage('Минимальная ставка: 1 звезда', 'error');
        return;
    }
    
    // Deduct bet
    stars -= betAmount;
    updateStarsDisplay();
    saveUserStars();
    
    // Disable button during spin
    const spinBtn = document.querySelector('#roulette-section .spin-btn');
    spinBtn.disabled = true;
    spinBtn.textContent = 'Крутится...';
    
    // Spin animation
    const wheel = document.getElementById('roulette-wheel');
    wheel.classList.add('spinning');
    
    // Determine result
    setTimeout(() => {
        const result = Math.random();
        let winColor;
        
        if (result < 0.47) {
            winColor = 'red';
        } else if (result < 0.94) {
            winColor = 'black';
        } else {
            winColor = 'green';
        }
        
        // Check if player won
        const won = selectedBet.type === winColor;
        let winAmount = 0;
        
        if (won) {
            winAmount = Math.floor(betAmount * selectedBet.multiplier);
            stars += winAmount;
            showMessage(`Поздравляем с выигрышем в ${winAmount} ⭐!`, 'success');
            recordGameResult(betAmount, winAmount, true);
        } else {
            showMessage(`Проигрыш! Цвет: ${winColor}`, 'error');
            recordGameResult(betAmount, 0, false);
        }
        
        // Reset UI
        wheel.classList.remove('spinning');
        spinBtn.disabled = false;
        spinBtn.textContent = 'Крутить!';
        selectedBet = null;
        document.querySelectorAll('#roulette-section .bet-btn').forEach(btn => btn.classList.remove('selected'));
        
        updateStarsDisplay();
        saveUserStars();
    }, 3000);
}

// Slots Game
function spinSlots() {
    const betAmount = parseInt(document.getElementById('slots-bet').value);
    
    if (betAmount > stars) {
        showMessage('Недостаточно звезд!', 'error');
        return;
    }
    
    if (betAmount < 1) {
        showMessage('Минимальная ставка: 1 звезда', 'error');
        return;
    }
    
    // Deduct bet
    stars -= betAmount;
    updateStarsDisplay();
    saveUserStars();
    
    // Disable button during spin
    const spinBtn = document.querySelector('#slots-section .spin-btn');
    spinBtn.disabled = true;
    spinBtn.textContent = 'Крутится...';
    
    // Spin animation
    const reels = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];
    const reelElements = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    
    // Animate reels
    let spinCount = 0;
    const spinInterval = setInterval(() => {
        reelElements.forEach(reel => {
            reel.textContent = reels[Math.floor(Math.random() * reels.length)];
        });
        spinCount++;
        
        if (spinCount > 20) {
            clearInterval(spinInterval);
            
            // Final result
            const results = [
                reels[Math.floor(Math.random() * reels.length)],
                reels[Math.floor(Math.random() * reels.length)],
                reels[Math.floor(Math.random() * reels.length)]
            ];
            
            reelElements.forEach((reel, index) => {
                reel.textContent = results[index];
            });
            
            // Check for wins
            let winAmount = 0;
            if (results[0] === results[1] && results[1] === results[2]) {
                // Three of a kind
                if (results[0] === '💎') {
                    winAmount = betAmount * 50; // Diamond jackpot
                } else if (results[0] === '7️⃣') {
                    winAmount = betAmount * 20; // Lucky 7
                } else {
                    winAmount = betAmount * 5; // Regular three of a kind
                }
            } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
                // Two of a kind
                winAmount = betAmount * 2;
            }
            
            if (winAmount > 0) {
                stars += winAmount;
                showMessage(`Поздравляем с выигрышем в ${winAmount} ⭐!`, 'success');
                recordGameResult(betAmount, winAmount, true);
            } else {
                showMessage('Попробуйте еще раз!', 'error');
                recordGameResult(betAmount, 0, false);
            }
            
            // Reset UI
            spinBtn.disabled = false;
            spinBtn.textContent = 'Крутить!';
            
            updateStarsDisplay();
            saveUserStars();
        }
    }, 100);
}

// Dice Game
function rollDice() {
    const betAmount = parseInt(document.getElementById('dice-bet').value);
    
    if (!selectedBet) {
        showMessage('Выберите ставку!', 'error');
        return;
    }
    
    if (betAmount > stars) {
        showMessage('Недостаточно звезд!', 'error');
        return;
    }
    
    if (betAmount < 1) {
        showMessage('Минимальная ставка: 1 звезда', 'error');
        return;
    }
    
    // Deduct bet
    stars -= betAmount;
    updateStarsDisplay();
    saveUserStars();
    
    // Disable button during roll
    const rollBtn = document.querySelector('#dice-section .spin-btn');
    rollBtn.disabled = true;
    rollBtn.textContent = 'Бросается...';
    
    // Roll animation
    const dice1 = document.getElementById('dice1');
    const dice2 = document.getElementById('dice2');
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    if (!dice1 || !dice2) {
        showMessage('Ошибка: элементы костей не найдены!', 'error');
        return;
    }
    
    dice1.classList.add('rolling');
    dice2.classList.add('rolling');
    
    // Animate dice
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        dice1.textContent = diceFaces[Math.floor(Math.random() * 6)];
        dice2.textContent = diceFaces[Math.floor(Math.random() * 6)];
        rollCount++;
        
        if (rollCount > 10) {
            clearInterval(rollInterval);
            
            // Final result
            const result1 = Math.floor(Math.random() * 6) + 1;
            const result2 = Math.floor(Math.random() * 6) + 1;
            const total = result1 + result2;
            
            dice1.textContent = diceFaces[result1 - 1];
            dice2.textContent = diceFaces[result2 - 1];
            
            dice1.classList.remove('rolling');
            dice2.classList.remove('rolling');
            
            // Check for wins
            let won = false;
            let winAmount = 0;
            
            switch (selectedBet.type) {
                case 'low':
                    won = total >= 2 && total <= 6;
                    break;
                case 'high':
                    won = total >= 8 && total <= 12;
                    break;
                case 'seven':
                    won = total === 7;
                    break;
            }
            
            if (won) {
                winAmount = Math.floor(betAmount * selectedBet.multiplier);
                stars += winAmount;
                showMessage(`Поздравляем с выигрышем в ${winAmount} ⭐!`, 'success');
                recordGameResult(betAmount, winAmount, true);
            } else {
                showMessage(`Проигрыш! Сумма: ${total}`, 'error');
                recordGameResult(betAmount, 0, false);
            }
            
            // Reset UI
            rollBtn.disabled = false;
            rollBtn.textContent = 'Бросать!';
            selectedBet = null;
            document.querySelectorAll('#dice-section .bet-btn').forEach(btn => btn.classList.remove('selected'));
            
            updateStarsDisplay();
            saveUserStars();
        }
    }, 100);
}

// Case Opening
function openCase(caseType, price) {
    if (price > stars) {
        showMessage('Недостаточно звезд!', 'error');
        return;
    }
    
    // Deduct price
    stars -= price;
    updateStarsDisplay();
    saveUserStars();
    
    // Show case modal
    showCaseModal(caseType, price);
}

function showCaseModal(caseType, price) {
    const modal = document.getElementById('case-modal');
    const preview = document.getElementById('case-preview');
    const result = document.getElementById('case-result');
    
    // Set case icon
    const caseIcons = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        diamond: '💎'
    };
    
    preview.querySelector('.case-icon').textContent = caseIcons[caseType];
    
    // Hide result initially
    result.classList.remove('show');
    
    modal.style.display = 'block';
    
    // Calculate prize first (bot knows the result)
    const prize = calculateCasePrize(caseType, price);
    
    // Start spinning animation
    startPrizeSpinning(result, prize, price);
    
    // Show final result after spinning
    setTimeout(() => {
        // Show result
        result.querySelector('.prize-amount').textContent = `+${prize} ⭐`;
        result.querySelector('.prize-icon').textContent = prize >= price ? '🏆' : '⭐';
        result.classList.add('show');
        
        // Add prize to stars
        stars += prize;
        updateStarsDisplay();
        saveUserStars();
        
        if (prize >= price) {
            showMessage(`🎉 Поздравляем с выигрышем в ${prize} ⭐! (Окупа!)`, 'success');
        } else if (prize > 0) {
            showMessage(`Поздравляем с выигрышем в ${prize} ⭐!`, 'success');
        } else {
            showMessage(`К сожалению, вы ничего не выиграли`, 'error');
        }
    }, 3000);
}

function startPrizeSpinning(resultElement, finalPrize, casePrice) {
    const prizeElement = resultElement.querySelector('.prize-amount');
    const prizeIcon = resultElement.querySelector('.prize-icon');
    
    // Create spinning effect with random prizes
    const possiblePrizes = [
        Math.floor(casePrice * 0.1),
        Math.floor(casePrice * 0.2),
        Math.floor(casePrice * 0.3),
        Math.floor(casePrice * 0.5),
        Math.floor(casePrice * 0.8),
        casePrice,
        Math.floor(casePrice * 1.5),
        Math.floor(casePrice * 2.0),
        Math.floor(casePrice * 3.0)
    ];
    
    const possibleIcons = ['⭐', '💰', '💎', '🏆', '🎁', '💵', '💸', '💳', '🪙'];
    
    let spinCount = 0;
    let spinSpeed = 50; // Начальная скорость
    
    const spinInterval = setInterval(() => {
        const randomPrize = possiblePrizes[Math.floor(Math.random() * possiblePrizes.length)];
        const randomIcon = possibleIcons[Math.floor(Math.random() * possibleIcons.length)];
        
        prizeElement.textContent = `+${randomPrize} ⭐`;
        prizeIcon.textContent = randomIcon;
        
        spinCount++;
        
        // Замедляем прокрутку
        if (spinCount > 15) {
            spinSpeed += 20;
        }
        
        // Останавливаемся
        if (spinCount > 25) {
            clearInterval(spinInterval);
            
            // Final result
            prizeElement.textContent = `+${finalPrize} ⭐`;
            prizeIcon.textContent = finalPrize >= casePrice ? '🏆' : '⭐';
        }
    }, spinSpeed);
}

function calculateCasePrize(caseType, price) {
    const random = Math.random();
    
    // 5% шанс на окупа или больше
    if (random < 0.05) {
        const profitMultiplier = 1.0 + Math.random() * 2.0; // 1x to 3x
        return Math.floor(price * profitMultiplier);
    }
    
    // 15% шанс на минимальную сумму (30-50% от цены)
    if (random < 0.20) {
        const minMultiplier = 0.3 + Math.random() * 0.2; // 0.3x to 0.5x
        return Math.floor(price * minMultiplier);
    }
    
    // 80% шанс на 0 или очень маленькую сумму
    if (random < 0.95) {
        const tinyMultiplier = Math.random() * 0.1; // 0x to 0.1x
        return Math.floor(price * tinyMultiplier);
    }
    
    // 5% шанс на полный окупа
    return price;
}

function hideCaseModal() {
    document.getElementById('case-modal').style.display = 'none';
}

// Payment System
function showPaymentModal() {
    document.getElementById('payment-modal').style.display = 'block';
    selectedPayment = null;
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
}

function hidePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
}

function processPayment() {
    if (!selectedPayment) {
        showMessage('Выберите пакет звезд!', 'error');
        return;
    }
    
    if (tg && tg.initDataUnsafe) {
        // Real Telegram payment
        const invoice = {
            title: `Покупка ${selectedPayment.stars} звезд`,
            description: `Получите ${selectedPayment.stars} звезд для игры в казино`,
            payload: JSON.stringify({
                user_id: user.id,
                stars: selectedPayment.stars,
                amount: selectedPayment.amount
            }),
            provider_token: 'YOUR_PROVIDER_TOKEN', // Replace with your payment provider token
            currency: 'RUB',
            prices: [{
                label: `${selectedPayment.stars} звезд`,
                amount: selectedPayment.amount * 100 // Amount in kopecks
            }]
        };
        
        tg.showPopup({
            title: 'Оплата',
            message: `Оплатить ${selectedPayment.amount} ₽ за ${selectedPayment.stars} звезд?`,
            buttons: [
                { id: 'pay', type: 'default', text: 'Оплатить' },
                { id: 'cancel', type: 'cancel', text: 'Отмена' }
            ]
        }, (buttonId) => {
            if (buttonId === 'pay') {
                // In real implementation, you would process payment through Telegram
                // For demo purposes, we'll simulate successful payment
                simulatePaymentSuccess();
            }
        });
    } else {
        // Demo mode - simulate payment
        simulatePaymentSuccess();
    }
}

function simulatePaymentSuccess() {
    stars += selectedPayment.stars;
    updateStarsDisplay();
    saveUserStars();
    hidePaymentModal();
    showMessage(`Получено ${selectedPayment.stars} ⭐!`, 'success');
    
    // Send purchase data to bot
    if (tg && tg.initDataUnsafe) {
        const purchaseData = {
            type: 'purchase',
            stars: selectedPayment.stars,
            amount: selectedPayment.amount
        };
        
        tg.sendData(JSON.stringify(purchaseData));
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const paymentModal = document.getElementById('payment-modal');
    const caseModal = document.getElementById('case-modal');
    
    if (event.target === paymentModal) {
        hidePaymentModal();
    }
    if (event.target === caseModal) {
        hideCaseModal();
    }
});

// Handle Telegram events
if (tg) {
    tg.onEvent('mainButtonClicked', () => {
        // Handle main button click if needed
    });
    
    tg.onEvent('backButtonClicked', () => {
        // Handle back button click
        if (document.getElementById('payment-modal').style.display === 'block') {
            hidePaymentModal();
        } else if (document.getElementById('case-modal').style.display === 'block') {
            hideCaseModal();
        } else {
            tg.close();
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Additional initialization if needed
    console.log('Telegram Casino initialized');
});
