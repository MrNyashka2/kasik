#!/usr/bin/env python3
"""
Пример Telegram бота для интеграции с казино
Требует установки: pip install pyTelegramBotAPI
"""

import telebot
import json
import logging
import os
from telebot.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Замените на ваш токен бота
BOT_TOKEN = 'YOUR_BOT_TOKEN'

# URL вашего GitHub Pages сайта
WEB_APP_URL = 'https://yourusername.github.io/your-repo-name'

bot = telebot.TeleBot(BOT_TOKEN)

# Файлы для хранения данных
USER_DATA_FILE = 'user_data.json'
REFERRAL_DATA_FILE = 'referral_data.json'

# Хранилище пользователей (в продакшене используйте базу данных)
user_data = {}

# Реферальная система
referral_data = {}  # {referrer_id: [referred_user_ids]}

def load_user_data():
    """Загрузить данные пользователей из файла"""
    global user_data
    try:
        if os.path.exists(USER_DATA_FILE):
            with open(USER_DATA_FILE, 'r', encoding='utf-8') as f:
                user_data = json.load(f)
                # Преобразуем ключи обратно в int (JSON сохраняет их как строки)
                user_data = {int(k): v for k, v in user_data.items()}
                logger.info(f"Загружены данные {len(user_data)} пользователей")
        else:
            user_data = {}
            logger.info("Файл данных пользователей не найден, создаем новый")
    except Exception as e:
        logger.error(f"Ошибка загрузки данных пользователей: {e}")
        user_data = {}

def save_user_data():
    """Сохранить данные пользователей в файл"""
    try:
        with open(USER_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(user_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Сохранены данные {len(user_data)} пользователей")
    except Exception as e:
        logger.error(f"Ошибка сохранения данных пользователей: {e}")

def load_referral_data():
    """Загрузить реферальные данные из файла"""
    global referral_data
    try:
        if os.path.exists(REFERRAL_DATA_FILE):
            with open(REFERRAL_DATA_FILE, 'r', encoding='utf-8') as f:
                referral_data = json.load(f)
                # Преобразуем ключи обратно в int
                referral_data = {int(k): v for k, v in referral_data.items()}
                logger.info(f"Загружены реферальные данные {len(referral_data)} пользователей")
        else:
            referral_data = {}
            logger.info("Файл реферальных данных не найден, создаем новый")
    except Exception as e:
        logger.error(f"Ошибка загрузки реферальных данных: {e}")
        referral_data = {}

def save_referral_data():
    """Сохранить реферальные данные в файл"""
    try:
        with open(REFERRAL_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(referral_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Сохранены реферальные данные {len(referral_data)} пользователей")
    except Exception as e:
        logger.error(f"Ошибка сохранения реферальных данных: {e}")

@bot.message_handler(commands=['start'])
def start_command(message):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    
    # Проверяем реферальный код
    referral_bonus = 0
    if len(message.text.split()) > 1:
        start_param = message.text.split()[1]
        if start_param.startswith('ref_'):
            referrer_id = int(start_param[4:])
            if referrer_id != user_id:  # Нельзя пригласить самого себя
                referral_bonus = 25  # Бонус для реферала
                # Добавляем реферала к списку реферера
                if referrer_id not in referral_data:
                    referral_data[referrer_id] = []
                if user_id not in referral_data[referrer_id]:
                    referral_data[referrer_id].append(user_id)
                    # Бонус для реферера
                    if referrer_id in user_data:
                        user_data[referrer_id]['stars'] += 50
                        user_data[referrer_id]['referrals'] = user_data[referrer_id].get('referrals', 0) + 1
                        save_user_data()
    
    # Инициализация пользователя
    if user_id not in user_data:
        user_data[user_id] = {
            'stars': 100 + referral_bonus,  # Начальные звезды + реферальный бонус
            'games_played': 0,
            'games_won': 0,
            'total_won': 0,
            'total_lost': 0,
            'referrals': 0,
            'achievements': []
        }
    else:
        # Если пользователь уже существует, добавляем реферальный бонус
        if referral_bonus > 0:
            user_data[user_id]['stars'] += referral_bonus
            save_user_data()
    
    # Создаем клавиатуру с Web App
    keyboard = InlineKeyboardMarkup()
    web_app = WebAppInfo(url=WEB_APP_URL)
    keyboard.add(InlineKeyboardButton("🎰 Открыть казино", web_app=web_app))
    
    # Формируем приветственное сообщение
    welcome_text = f"""
🎰 Добро пожаловать в казино, {message.from_user.first_name}!

🎮 Доступные игры:
• 🎯 Рулетка - ставки на цвета
• 📦 Кейсы - открытие призовых коробок  
• 🎰 Слоты - классические игровые автоматы
• 🎲 Кости - ставки на суммы
• 👤 Профиль - статистика и достижения

⭐ У вас есть {user_data[user_id]['stars']} звезд для игры!
"""
    
    # Добавляем информацию о реферальном бонусе
    if referral_bonus > 0:
        welcome_text += f"\n🎁 Реферальный бонус: +{referral_bonus} ⭐"
    
    welcome_text += "\n\nНажмите кнопку ниже, чтобы открыть игровое приложение:"
    
    bot.send_message(
        message.chat.id,
        welcome_text,
        reply_markup=keyboard
    )

@bot.message_handler(commands=['balance'])
def balance_command(message):
    """Показать баланс пользователя"""
    user_id = message.from_user.id
    
    if user_id not in user_data:
        user_data[user_id] = {
            'stars': 100, 'games_played': 0, 'games_won': 0, 
            'total_won': 0, 'total_lost': 0, 'referrals': 0
        }
    
    user = user_data[user_id]
    stars = user['stars']
    games_played = user['games_played']
    games_won = user['games_won']
    total_won = user['total_won']
    total_lost = user['total_lost']
    referrals = user['referrals']
    
    # Вычисляем процент побед
    win_rate = (games_won / games_played * 100) if games_played > 0 else 0
    
    balance_text = f"""
💰 Ваш баланс:
⭐ Звезды: {stars}
🎮 Игр сыграно: {games_played}
🏆 Игр выиграно: {games_won}
📈 Процент побед: {win_rate:.1f}%
💎 Всего выиграно: {total_won} ⭐
💸 Всего проиграно: {total_lost} ⭐
👥 Рефералов: {referrals}
    """
    
    bot.send_message(message.chat.id, balance_text)

@bot.message_handler(commands=['buy'])
def buy_stars_command(message):
    """Команда для покупки звезд"""
    keyboard = InlineKeyboardMarkup()
    web_app = WebAppInfo(url=WEB_APP_URL)
    keyboard.add(InlineKeyboardButton("💳 Купить звезды", web_app=web_app))
    
    buy_text = """
💳 Покупка звезд

Доступные пакеты:
• 100 ⭐ за 100 ₽
• 550 ⭐ за 500 ₽ (+10% бонус)
• 1200 ⭐ за 1000 ₽ (+20% бонус)

Нажмите кнопку ниже для покупки:
    """
    
    bot.send_message(message.chat.id, buy_text, reply_markup=keyboard)

@bot.message_handler(commands=['profile'])
def profile_command(message):
    """Показать профиль пользователя"""
    user_id = message.from_user.id
    
    if user_id not in user_data:
        user_data[user_id] = {
            'stars': 100, 'games_played': 0, 'games_won': 0, 
            'total_won': 0, 'total_lost': 0, 'referrals': 0
        }
    
    user = user_data[user_id]
    
    # Создаем клавиатуру с Web App
    keyboard = InlineKeyboardMarkup()
    web_app = WebAppInfo(url=WEB_APP_URL)
    keyboard.add(InlineKeyboardButton("👤 Открыть профиль", web_app=web_app))
    
    profile_text = f"""
👤 Профиль игрока: {message.from_user.first_name}

📊 Статистика:
🎮 Игр сыграно: {user['games_played']}
🏆 Игр выиграно: {user['games_won']}
📈 Процент побед: {(user['games_won'] / user['games_played'] * 100) if user['games_played'] > 0 else 0:.1f}%
💎 Всего выиграно: {user['total_won']} ⭐
👥 Рефералов: {user['referrals']}

Нажмите кнопку ниже для подробной статистики:
    """
    
    bot.send_message(message.chat.id, profile_text, reply_markup=keyboard)

@bot.message_handler(commands=['referral'])
def referral_command(message):
    """Показать реферальную информацию"""
    user_id = message.from_user.id
    
    # Создаем клавиатуру с Web App
    keyboard = InlineKeyboardMarkup()
    web_app = WebAppInfo(url=WEB_APP_URL)
    keyboard.add(InlineKeyboardButton("🔗 Реферальная программа", web_app=web_app))
    
    referral_text = f"""
🔗 Реферальная программа

Приглашайте друзей и получайте бонусы!

🎁 Награды:
• За каждого реферала: +50 ⭐
• Реферал получает: +25 ⭐

📋 Ваша реферальная ссылка:
https://t.me/your_bot_username?start=ref_{user_id}

Нажмите кнопку ниже для копирования ссылки:
    """
    
    bot.send_message(message.chat.id, referral_text, reply_markup=keyboard)

@bot.message_handler(commands=['admin'])
def admin_command(message):
    """Команда для администратора - показать всех пользователей"""
    user_id = message.from_user.id
    
    # Здесь можно добавить проверку на администратора
    # if user_id not in ADMIN_IDS:
    #     return
    
    if not user_data:
        bot.send_message(message.chat.id, "📊 Пользователей пока нет")
        return
    
    admin_text = f"📊 Статистика пользователей (всего: {len(user_data)}):\n\n"
    
    for uid, data in list(user_data.items())[:10]:  # Показываем первых 10
        admin_text += f"👤 ID: {uid}\n"
        admin_text += f"   ⭐ Звезды: {data['stars']}\n"
        admin_text += f"   🎮 Игр: {data['games_played']}\n"
        admin_text += f"   🏆 Побед: {data['games_won']}\n"
        admin_text += f"   👥 Рефералов: {data['referrals']}\n\n"
    
    if len(user_data) > 10:
        admin_text += f"... и еще {len(user_data) - 10} пользователей"
    
    bot.send_message(message.chat.id, admin_text)

@bot.message_handler(commands=['help'])
def help_command(message):
    """Справка по командам"""
    help_text = """
📖 Доступные команды:

/start - Начать работу с ботом
/profile - Показать профиль
/balance - Показать баланс
/referral - Реферальная программа
/buy - Купить звезды
/admin - Статистика пользователей (админ)
/help - Показать эту справку
/casino - Открыть казино

🎮 Игры в казино:
• Рулетка - ставки на красное/черное/зеленое
• Кейсы - открытие призовых коробок
• Слоты - игровые автоматы
• Кости - ставки на суммы
• Профиль - статистика и достижения

🔗 Реферальная программа:
• Приглашайте друзей и получайте бонусы
• +50 ⭐ за каждого реферала
• +25 ⭐ бонус для реферала

💡 Совет: Начните с малых ставок, чтобы изучить игры!
    """
    
    bot.send_message(message.chat.id, help_text)

@bot.message_handler(commands=['casino'])
def casino_command(message):
    """Открыть казино"""
    keyboard = InlineKeyboardMarkup()
    web_app = WebAppInfo(url=WEB_APP_URL)
    keyboard.add(InlineKeyboardButton("🎰 Открыть казино", web_app=web_app))
    
    bot.send_message(
        message.chat.id,
        "🎰 Нажмите кнопку ниже, чтобы открыть казино:",
        reply_markup=keyboard
    )

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    """Обработчик всех остальных сообщений"""
    if message.text and message.text.startswith('/'):
        bot.send_message(
            message.chat.id,
            "❓ Неизвестная команда. Используйте /help для списка команд."
        )
    else:
        # Предлагаем открыть казино
        keyboard = InlineKeyboardMarkup()
        web_app = WebAppInfo(url=WEB_APP_URL)
        keyboard.add(InlineKeyboardButton("🎰 Открыть казино", web_app=web_app))
        
        bot.send_message(
            message.chat.id,
            "🎰 Хотите поиграть? Нажмите кнопку ниже!",
            reply_markup=keyboard
        )

def update_user_stars(user_id, stars_change):
    """Обновить количество звезд пользователя"""
    if user_id not in user_data:
        user_data[user_id] = {
            'stars': 100, 'games_played': 0, 'games_won': 0, 
            'total_won': 0, 'total_lost': 0, 'referrals': 0
        }
    
    user_data[user_id]['stars'] += stars_change
    user_data[user_id]['games_played'] += 1
    
    if stars_change > 0:
        user_data[user_id]['total_won'] += stars_change
        user_data[user_id]['games_won'] += 1
    else:
        user_data[user_id]['total_lost'] += abs(stars_change)
    
    # Сохраняем данные после каждого изменения
    save_user_data()

def get_user_stars(user_id):
    """Получить количество звезд пользователя"""
    if user_id not in user_data:
        user_data[user_id] = {
            'stars': 100, 'games_played': 0, 'games_won': 0, 
            'total_won': 0, 'total_lost': 0, 'referrals': 0
        }
    
    return user_data[user_id]['stars']

def get_user_stats(user_id):
    """Получить статистику пользователя"""
    if user_id not in user_data:
        user_data[user_id] = {
            'stars': 100, 'games_played': 0, 'games_won': 0, 
            'total_won': 0, 'total_lost': 0, 'referrals': 0
        }
    
    return user_data[user_id]

# Обработчик для Web App данных (если нужно)
@bot.message_handler(content_types=['web_app_data'])
def handle_web_app_data(message):
    """Обработка данных от Web App"""
    try:
        data = json.loads(message.web_app_data.data)
        user_id = message.from_user.id
        
        # Обработка различных типов данных от Web App
        if data.get('type') == 'game_result':
            stars_change = data.get('stars_change', 0)
            bet_amount = data.get('bet_amount', 0)
            won = data.get('won', False)
            
            # Обновляем статистику
            if user_id not in user_data:
                user_data[user_id] = {
                    'stars': 100, 'games_played': 0, 'games_won': 0, 
                    'total_won': 0, 'total_lost': 0, 'referrals': 0
                }
            
            user_data[user_id]['stars'] += stars_change
            user_data[user_id]['games_played'] += 1
            
            if won:
                user_data[user_id]['games_won'] += 1
                user_data[user_id]['total_won'] += stars_change
            else:
                user_data[user_id]['total_lost'] += bet_amount
            
            # Сохраняем данные
            save_user_data()
            
            bot.send_message(
                message.chat.id,
                f"🎮 Игра завершена! Изменение баланса: {stars_change:+d} ⭐"
            )
        
        elif data.get('type') == 'purchase':
            stars_purchased = data.get('stars', 0)
            if user_id not in user_data:
                user_data[user_id] = {
                    'stars': 100, 'games_played': 0, 'games_won': 0, 
                    'total_won': 0, 'total_lost': 0, 'referrals': 0
                }
            
            user_data[user_id]['stars'] += stars_purchased
            
            # Сохраняем данные
            save_user_data()
            
            bot.send_message(
                message.chat.id,
                f"💳 Покупка успешна! Получено: +{stars_purchased} ⭐"
            )
        
        elif data.get('type') == 'get_stats':
            # Отправляем статистику пользователя в Web App
            stats = get_user_stats(user_id)
            bot.send_message(
                message.chat.id,
                f"📊 Ваша статистика обновлена в приложении!"
            )
    
    except Exception as e:
        logger.error(f"Error handling web app data: {e}")
        bot.send_message(
            message.chat.id,
            "❌ Произошла ошибка при обработке данных игры."
        )

if __name__ == '__main__':
    print("🤖 Запуск Telegram бота...")
    print(f"🌐 Web App URL: {WEB_APP_URL}")
    print("📝 Не забудьте заменить BOT_TOKEN на ваш токен!")
    
    # Загружаем данные пользователей при запуске
    load_user_data()
    load_referral_data()
    
    try:
        bot.polling(none_stop=True)
    except Exception as e:
        logger.error(f"Bot error: {e}")
        print("❌ Ошибка запуска бота. Проверьте токен и интернет-соединение.")
