#!/usr/bin/env python3
"""
Пример Telegram бота для интеграции с казино
Требует установки: pip install pyTelegramBotAPI
"""

import telebot
import json
import logging
from telebot.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Замените на ваш токен бота
BOT_TOKEN = 'YOUR_BOT_TOKEN'

# URL вашего GitHub Pages сайта
WEB_APP_URL = 'https://yourusername.github.io/your-repo-name'

bot = telebot.TeleBot(BOT_TOKEN)

# Хранилище пользователей (в продакшене используйте базу данных)
user_data = {}

@bot.message_handler(commands=['start'])
def start_command(message):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    user_data[user_id] = {
        'stars': 100,  # Начальные звезды
        'games_played': 0,
        'total_won': 0
    }
    
    # Создаем клавиатуру с Web App
    keyboard = InlineKeyboardMarkup()
    web_app = WebAppInfo(url=WEB_APP_URL)
    keyboard.add(InlineKeyboardButton("🎰 Открыть казино", web_app=web_app))
    
    welcome_text = f"""
🎰 Добро пожаловать в казино, {message.from_user.first_name}!

🎮 Доступные игры:
• 🎯 Рулетка - ставки на цвета
• 📦 Кейсы - открытие призовых коробок  
• 🎰 Слоты - классические игровые автоматы
• 🎲 Кости - ставки на суммы

⭐ У вас есть {user_data[user_id]['stars']} звезд для игры!

Нажмите кнопку ниже, чтобы открыть игровое приложение:
    """
    
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
        user_data[user_id] = {'stars': 100, 'games_played': 0, 'total_won': 0}
    
    stars = user_data[user_id]['stars']
    games_played = user_data[user_id]['games_played']
    total_won = user_data[user_id]['total_won']
    
    balance_text = f"""
💰 Ваш баланс:
⭐ Звезды: {stars}
🎮 Игр сыграно: {games_played}
🏆 Всего выиграно: {total_won} ⭐
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

@bot.message_handler(commands=['help'])
def help_command(message):
    """Справка по командам"""
    help_text = """
📖 Доступные команды:

/start - Начать работу с ботом
/balance - Показать баланс
/buy - Купить звезды
/help - Показать эту справку
/casino - Открыть казино

🎮 Игры в казино:
• Рулетка - ставки на красное/черное/зеленое
• Кейсы - открытие призовых коробок
• Слоты - игровые автоматы
• Кости - ставки на суммы

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
        user_data[user_id] = {'stars': 100, 'games_played': 0, 'total_won': 0}
    
    user_data[user_id]['stars'] += stars_change
    user_data[user_id]['games_played'] += 1
    
    if stars_change > 0:
        user_data[user_id]['total_won'] += stars_change

def get_user_stars(user_id):
    """Получить количество звезд пользователя"""
    if user_id not in user_data:
        user_data[user_id] = {'stars': 100, 'games_played': 0, 'total_won': 0}
    
    return user_data[user_id]['stars']

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
            update_user_stars(user_id, stars_change)
            
            bot.send_message(
                message.chat.id,
                f"🎮 Игра завершена! Изменение баланса: {stars_change:+d} ⭐"
            )
        
        elif data.get('type') == 'purchase':
            stars_purchased = data.get('stars', 0)
            update_user_stars(user_id, stars_purchased)
            
            bot.send_message(
                message.chat.id,
                f"💳 Покупка успешна! Получено: +{stars_purchased} ⭐"
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
    
    try:
        bot.polling(none_stop=True)
    except Exception as e:
        logger.error(f"Bot error: {e}")
        print("❌ Ошибка запуска бота. Проверьте токен и интернет-соединение.")
