# 🎰 Telegram Casino

Полнофункциональное веб-приложение казино для Telegram бота с интеграцией Telegram Web App API.

## 🎮 Игры

- **🎯 Рулетка** - Классическая рулетка с тремя цветами (красный, черный, зеленый)
- **📦 Кейсы** - Открытие кейсов с различными призами
- **🎰 Слоты** - Трехбарабанные слоты с различными символами
- **🎲 Кости** - Игра в кости с ставками на малые/большие числа

## ⭐ Система звезд

- Покупка звезд через Telegram Stars
- Различные пакеты с бонусами
- Безопасное хранение баланса

## 🚀 Развертывание на GitHub Pages

1. Создайте новый репозиторий на GitHub
2. Загрузите все файлы в репозиторий
3. Перейдите в Settings → Pages
4. Выберите Source: Deploy from a branch
5. Выберите Branch: main
6. Нажмите Save

Ваш сайт будет доступен по адресу: `https://yourusername.github.io/your-repo-name`

## 🔧 Настройка для Telegram бота

### 1. Создание бота

1. Найдите @BotFather в Telegram
2. Создайте нового бота командой `/newbot`
3. Получите токен бота

### 2. Настройка Web App

1. Отправьте команду `/newapp` боту @BotFather
2. Выберите вашего бота
3. Укажите название приложения
4. Загрузите иконку (512x512px)
5. Укажите URL вашего GitHub Pages сайта
6. Добавьте описание

### 3. Интеграция с ботом

```python
# Пример кода для бота (Python)
import telebot
from telebot.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

bot = telebot.TeleBot('YOUR_BOT_TOKEN')

@bot.message_handler(commands=['start'])
def start(message):
    keyboard = InlineKeyboardMarkup()
    web_app = WebAppInfo(url="https://yourusername.github.io/your-repo-name")
    keyboard.add(InlineKeyboardButton("🎰 Открыть казино", web_app=web_app))
    
    bot.send_message(
        message.chat.id,
        "🎰 Добро пожаловать в казино!\n\n"
        "Нажмите кнопку ниже, чтобы открыть игровое приложение:",
        reply_markup=keyboard
    )

bot.polling()
```

## 💳 Настройка платежей

### 1. Получение Provider Token

1. Обратитесь к @BotFather
2. Отправьте команду `/mybots`
3. Выберите вашего бота
4. Выберите Bot Settings → Payments
5. Настройте платежного провайдера

### 2. Обновление кода

В файле `script.js` замените `YOUR_PROVIDER_TOKEN` на ваш токен:

```javascript
provider_token: 'YOUR_ACTUAL_PROVIDER_TOKEN',
```

## 🎨 Кастомизация

### Изменение цветовой схемы

Отредактируйте CSS переменные в `styles.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #ffd700;
    --success-color: #00ff00;
    --error-color: #ff0000;
}
```

### Добавление новых игр

1. Добавьте новую секцию в HTML
2. Создайте стили в CSS
3. Реализуйте логику в JavaScript
4. Добавьте навигационную кнопку

## 🔒 Безопасность

- Все игровые результаты генерируются на клиенте
- Для продакшена рекомендуется серверная валидация
- Используйте HTTPS для всех запросов
- Реализуйте rate limiting для предотвращения спама

## 📱 Мобильная оптимизация

Приложение полностью адаптировано для мобильных устройств:
- Responsive дизайн
- Touch-friendly интерфейс
- Оптимизированные анимации
- Поддержка жестов

## 🛠️ Технологии

- **HTML5** - Структура приложения
- **CSS3** - Стили и анимации
- **JavaScript ES6+** - Логика игр
- **Telegram Web App API** - Интеграция с Telegram
- **GitHub Pages** - Хостинг

## 📄 Лицензия

MIT License - используйте свободно для коммерческих и некоммерческих проектов.

## 🤝 Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.

---

**Внимание**: Это демонстрационное приложение. Для продакшена необходимо добавить серверную валидацию и дополнительные меры безопасности.
