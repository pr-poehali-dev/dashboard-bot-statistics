# Backend API Specification для Bot Analytics Dashboard

## Требования к стеку

### Технологии:
- **Python 3.9+**
- **FastAPI** (рекомендуется) или Flask
- **SQLAlchemy 2.0** с Alembic для миграций
- **MySQL 8.0+** 
- **Pydantic** для валидации данных
- **python-telegram-bot** для работы с Telegram API

### Дополнительные пакеты:
```bash
pip install fastapi uvicorn sqlalchemy pymysql python-multipart python-jose[cryptography] passlib[bcrypt] python-telegram-bot pydantic-settings alembic
```

## Структура базы данных

Ваши модели SQLAlchemy уже готовы. Необходимо создать миграции:

```python
# alembic/env.py
from models import Base  # Импорт ваших моделей
target_metadata = Base.metadata
```

## API Endpoints

### 1. Авторизация через Telegram Mini App

**POST `/api/auth/telegram`**

```python
from fastapi import FastAPI, HTTPException, Depends, Header
import hashlib
import hmac
import json
from urllib.parse import unquote, parse_qsl

class TelegramAuthRequest(BaseModel):
    init_data: str

async def verify_telegram_auth(auth_data: TelegramAuthRequest):
    """
    Проверяет подлинность данных от Telegram WebApp
    """
    try:
        # Парсим init_data
        parsed_data = dict(parse_qsl(unquote(auth_data.init_data)))
        
        # Извлекаем hash и остальные данные
        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            raise HTTPException(400, "Missing hash")
        
        # Создаем строку для проверки
        data_check_string = '\n'.join([f"{k}={v}" for k, v in sorted(parsed_data.items())])
        
        # Получаем секретный ключ (SHA256 от bot token)
        BOT_TOKEN = "YOUR_BOT_TOKEN"  # Из переменных окружения
        secret_key = hmac.new("WebAppData".encode(), BOT_TOKEN.encode(), hashlib.sha256).digest()
        
        # Вычисляем hash
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if not hmac.compare_digest(received_hash, calculated_hash):
            raise HTTPException(401, "Invalid hash")
        
        # Парсим данные пользователя
        user_data = json.loads(parsed_data.get('user', '{}'))
        
        # Создаем или обновляем пользователя в БД
        user = await create_or_update_user(user_data)
        
        # Создаем JWT токен
        token = create_access_token(data={"sub": str(user.user_id)})
        
        return {"user": user, "token": token}
        
    except Exception as e:
        raise HTTPException(401, f"Authentication failed: {str(e)}")
```

### 2. Получение списка ботов пользователя

**GET `/api/bots`**

```python
async def get_user_bots(current_user: User = Depends(get_current_user)):
    """
    Возвращает список ботов, где пользователь является админом
    """
    async with AsyncSession() as session:
        result = await session.execute(
            select(Bots).where(Bots.admin_id == current_user.user_id)
        )
        bots = result.scalars().all()
        
        return [
            {
                "uid": bot.uid,
                "bot_id": bot.bot_id,
                "username": bot.username,
                "admin_id": bot.admin_id,
                "ref_percent": bot.ref_percent,
                "balance": bot.balance,
                "status": bot.status,
                "meta": bot.meta
            }
            for bot in bots
        ]
```

### 3. Получение аналитики бота

**GET `/api/analytics?bot_id=123&start_date=2024-01-01&end_date=2024-01-31`**

```python
async def get_bot_analytics(
    bot_id: int,
    start_date: date,
    end_date: date,
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает аналитику по дням для указанного периода
    """
    # Проверяем доступ к боту
    await verify_bot_access(bot_id, current_user.user_id)
    
    async with AsyncSession() as session:
        # Запросы для каждой метрики
        
        # Регистрации пользователей по дням
        registrations_query = select(
            func.date(Users.reg_date).label('date'),
            func.count(Users.user_id).label('count')
        ).where(
            Users.bot_id == bot_id,
            Users.reg_date >= start_date,
            Users.reg_date <= end_date
        ).group_by(func.date(Users.reg_date))
        
        # Оплаты по дням
        payments_query = select(
            func.date(Payments.date).label('date'),
            func.count(Payments.bill_id).label('count')
        ).where(
            Payments.bot_id == bot_id,
            Payments.status == 'PAID',
            Payments.date >= start_date,
            Payments.date <= end_date
        ).group_by(func.date(Payments.date))
        
        # Активации пробников (новые подписки)
        trials_query = select(
            func.date(Subscription.start_date).label('date'),
            func.count(Subscription.uid).label('count')
        ).where(
            Subscription.bot_id == bot_id,
            Subscription.start_date >= start_date,
            Subscription.start_date <= end_date,
            # Условие для пробников (можно добавить в meta)
        ).group_by(func.date(Subscription.start_date))
        
        # Выполняем запросы
        registrations_result = await session.execute(registrations_query)
        payments_result = await session.execute(payments_query)
        trials_result = await session.execute(trials_query)
        
        # Формируем результат по дням
        analytics_data = []
        current_date = start_date
        
        while current_date <= end_date:
            analytics_data.append({
                "date": current_date.isoformat(),
                "registrations": get_count_for_date(registrations_result, current_date),
                "payments": get_count_for_date(payments_result, current_date),
                "trials": get_count_for_date(trials_result, current_date),
                "keys": 0,  # Логика для покупок ключей
                "renewals": 0  # Логика для продлений
            })
            current_date += timedelta(days=1)
        
        return analytics_data
```

### 4. Получение пользователей бота

**GET `/api/users?bot_id=123&page=1&limit=100`**

```python
async def get_bot_users(
    bot_id: int,
    page: int = 1,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает список пользователей бота с пагинацией
    """
    await verify_bot_access(bot_id, current_user.user_id)
    
    async with AsyncSession() as session:
        # Подсчет общего количества
        count_query = select(func.count(Users.user_id)).where(Users.bot_id == bot_id)
        total = await session.scalar(count_query)
        
        # Получение пользователей с пагинацией
        users_query = select(Users).where(
            Users.bot_id == bot_id
        ).offset((page - 1) * limit).limit(limit).order_by(Users.reg_date.desc())
        
        result = await session.execute(users_query)
        users = result.scalars().all()
        
        return {
            "users": [
                {
                    "uid": user.uid,
                    "user_id": user.user_id,
                    "username": user.username,
                    "reg_date": user.reg_date.isoformat() if user.reg_date else None,
                    "ref_percent": user.ref_percent,
                    "meta": user.meta
                }
                for user in users
            ],
            "total": total,
            "page": page,
            "limit": limit
        }
```

### 5. Получение платежей

**GET `/api/payments?bot_id=123&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=100`**

```python
async def get_bot_payments(
    bot_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = 1,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает список платежей бота
    """
    await verify_bot_access(bot_id, current_user.user_id)
    
    async with AsyncSession() as session:
        query = select(Payments).where(Payments.bot_id == bot_id)
        
        if start_date:
            query = query.where(Payments.date >= start_date)
        if end_date:
            query = query.where(Payments.date <= end_date)
        
        # Подсчет
        count_query = select(func.count()).select_from(query.subquery())
        total = await session.scalar(count_query)
        
        # Данные с пагинацией
        result = await session.execute(
            query.offset((page - 1) * limit).limit(limit).order_by(Payments.date.desc())
        )
        payments = result.scalars().all()
        
        return {
            "payments": [
                {
                    "bill_id": payment.bill_id,
                    "user_id": payment.user_id,
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "status": payment.status,
                    "provider": payment.provider,
                    "date": payment.date.isoformat(),
                    "meta": payment.meta
                }
                for payment in payments
            ],
            "total": total,
            "page": page,
            "limit": limit
        }
```

### 6. Получение подписок

**GET `/api/subscriptions?bot_id=123&status=Active&page=1&limit=100`**

```python
async def get_bot_subscriptions(
    bot_id: int,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает список подписок бота
    """
    await verify_bot_access(bot_id, current_user.user_id)
    
    async with AsyncSession() as session:
        query = select(Subscription).where(Subscription.bot_id == bot_id)
        
        if status:
            query = query.where(Subscription.status == status)
        
        # Подсчет
        count_query = select(func.count()).select_from(query.subquery())
        total = await session.scalar(count_query)
        
        # Данные
        result = await session.execute(
            query.offset((page - 1) * limit).limit(limit).order_by(Subscription.start_date.desc())
        )
        subscriptions = result.scalars().all()
        
        return {
            "subscriptions": [
                {
                    "uid": sub.uid,
                    "sub_uid": sub.sub_uid,
                    "user_id": sub.user_id,
                    "status": sub.status,
                    "start_date": sub.start_date.isoformat(),
                    "stop_date": sub.stop_date.isoformat() if sub.stop_date else None,
                    "meta": sub.meta,
                    "keys": sub.keys
                }
                for sub in subscriptions
            ],
            "total": total,
            "page": page,
            "limit": limit
        }
```

### 7. Сводная статистика

**GET `/api/bots/{bot_id}/summary`**

```python
async def get_bot_summary(
    bot_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает сводную статистику по боту
    """
    await verify_bot_access(bot_id, current_user.user_id)
    
    async with AsyncSession() as session:
        # Общее количество пользователей
        total_users = await session.scalar(
            select(func.count(Users.user_id)).where(Users.bot_id == bot_id)
        )
        
        # Активные пользователи (с активными подписками)
        active_users = await session.scalar(
            select(func.count(func.distinct(Subscription.user_id))).where(
                Subscription.bot_id == bot_id,
                Subscription.status == 'Active'
            )
        )
        
        # Новые пользователи за месяц
        month_ago = datetime.now() - timedelta(days=30)
        new_users_month = await session.scalar(
            select(func.count(Users.user_id)).where(
                Users.bot_id == bot_id,
                Users.reg_date >= month_ago
            )
        )
        
        # Общий доход
        total_revenue = await session.scalar(
            select(func.sum(Payments.amount)).where(
                Payments.bot_id == bot_id,
                Payments.status == 'PAID'
            )
        ) or 0
        
        # Доход за месяц
        monthly_revenue = await session.scalar(
            select(func.sum(Payments.amount)).where(
                Payments.bot_id == bot_id,
                Payments.status == 'PAID',
                Payments.date >= month_ago
            )
        ) or 0
        
        # Средний чек
        avg_payment = await session.scalar(
            select(func.avg(Payments.amount)).where(
                Payments.bot_id == bot_id,
                Payments.status == 'PAID'
            )
        ) or 0
        
        return {
            "total_users": total_users or 0,
            "active_users": active_users or 0,
            "new_users_month": new_users_month or 0,
            "total_revenue": float(total_revenue),
            "monthly_revenue": float(monthly_revenue),
            "average_check": float(avg_payment)
        }
```

## Утилиты

### Проверка доступа к боту

```python
async def verify_bot_access(bot_id: int, user_id: int):
    """
    Проверяет, что пользователь имеет доступ к боту
    """
    async with AsyncSession() as session:
        bot = await session.scalar(
            select(Bots).where(
                Bots.uid == bot_id,
                Bots.admin_id == user_id
            )
        )
        
        if not bot:
            raise HTTPException(403, "Access denied to this bot")
        
        return bot
```

### JWT Аутентификация

```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"  # Из переменных окружения
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid token")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        
        async with AsyncSession() as session:
            user = await session.scalar(
                select(Users).where(Users.user_id == user_id)
            )
            
            if not user:
                raise HTTPException(401, "User not found")
            
            return user
            
    except JWTError:
        raise HTTPException(401, "Invalid token")
```

## Конфигурация для production

### Переменные окружения:
```env
DATABASE_URL=mysql+pymysql://user:password@localhost/bot_analytics
SECRET_KEY=your-super-secret-key
BOT_TOKEN=your-telegram-bot-token
ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Compose:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql+pymysql://user:password@db/bot_analytics
    depends_on:
      - db
  
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: bot_analytics
      MYSQL_USER: user
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## Развертывание

1. Клонируйте репозиторий
2. Установите зависимости: `pip install -r requirements.txt`
3. Создайте базу данных и примените миграции: `alembic upgrade head`
4. Запустите сервер: `uvicorn main:app --host 0.0.0.0 --port 8000`

Готово! API готов для интеграции с фронтендом. 🚀