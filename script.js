// Telegram Web App API Integration
let tg = window.Telegram.WebApp;
let user = null;
let stars = 0;
let selectedPayment = null;
let selectedBet = null;

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
            showMessage(`Выигрыш! +${winAmount} ⭐`, 'success');
        } else {
            showMessage(`Проигрыш! Цвет: ${winColor}`, 'error');
        }
        
        // Reset UI
        wheel.classList.remove('spinning');
        spinBtn.disabled = false;
        spinBtn.textContent = 'Крутить!';
        selectedBet = null;
        document.querySelectorAll('.bet-btn').forEach(btn => btn.classList.remove('selected'));
        
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
                showMessage(`Выигрыш! +${winAmount} ⭐`, 'success');
            } else {
                showMessage('Попробуйте еще раз!', 'error');
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
                showMessage(`Выигрыш! Сумма: ${total}, +${winAmount} ⭐`, 'success');
            } else {
                showMessage(`Проигрыш! Сумма: ${total}`, 'error');
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
    
    // Simulate opening after delay
    setTimeout(() => {
        const prize = calculateCasePrize(caseType, price);
        
        // Show result
        result.querySelector('.prize-amount').textContent = `+${prize} ⭐`;
        result.classList.add('show');
        
        // Add prize to stars
        stars += prize;
        updateStarsDisplay();
        saveUserStars();
        
        showMessage(`Получено: ${prize} ⭐`, 'success');
    }, 2000);
}

function calculateCasePrize(caseType, price) {
    const baseMultiplier = {
        bronze: 0.5,
        silver: 1.2,
        gold: 2.0,
        diamond: 5.0
    };
    
    const multiplier = baseMultiplier[caseType];
    const basePrize = Math.floor(price * multiplier);
    
    // Add some randomness
    const randomFactor = 0.5 + Math.random() * 1.0; // 0.5x to 1.5x
    const finalPrize = Math.floor(basePrize * randomFactor);
    
    // Minimum prize
    return Math.max(finalPrize, Math.floor(price * 0.3));
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
