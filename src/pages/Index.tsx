import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { DateRange } from 'react-day-picker';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { apiService, Bot, AnalyticsData } from '@/services/api';

interface MetricData {
  title: string;
  value: number;
  change: number;
  icon: string;
}

interface ChartData {
  day: string;
  registrations: number;
  payments: number;
  trials: number;
  keys: number;
  renewals: number;
}

const Index = () => {
  const { isAuthenticated, user, isLoading, error, getAuthHeaders } = useTelegramAuth();
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 7, 1),
    to: new Date(2024, 7, 7)
  });
  
  const [bots, setBots] = useState<Bot[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [botsLoading, setBotsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Загрузка списка ботов
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const loadBots = async () => {
      setBotsLoading(true);
      try {
        const userBots = await apiService.getUserBots(getAuthHeaders());
        setBots(userBots);
        if (userBots.length > 0) {
          setSelectedBot(userBots[0].uid.toString());
        }
      } catch (err) {
        console.error('Failed to load bots:', err);
      } finally {
        setBotsLoading(false);
      }
    };

    loadBots();
  }, [isAuthenticated, user, getAuthHeaders]);

  // Загрузка аналитики при изменении бота или дат
  useEffect(() => {
    if (!selectedBot || !dateRange?.from || !dateRange?.to || !isAuthenticated) return;

    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const data = await apiService.getBotAnalytics(
          parseInt(selectedBot),
          dateRange.from!.toISOString().split('T')[0],
          dateRange.to!.toISOString().split('T')[0],
          getAuthHeaders()
        );
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedBot, dateRange, isAuthenticated, getAuthHeaders]);

  const metrics: MetricData[] = [
    { title: 'Регистрации пользователей', value: 1247, change: 12.5, icon: 'UserPlus' },
    { title: 'Оплаты', value: 342, change: 8.3, icon: 'CreditCard' },
    { title: 'Активации пробников', value: 89, change: -2.1, icon: 'Play' },
    { title: 'Покупки ключей', value: 156, change: 15.7, icon: 'Key' },
    { title: 'Продления ключей', value: 78, change: 5.2, icon: 'RotateCcw' },
  ];

  const chartData: ChartData[] = [
    { day: '1', registrations: 45, payments: 12, trials: 8, keys: 5, renewals: 3 },
    { day: '2', registrations: 52, payments: 15, trials: 6, keys: 7, renewals: 4 },
    { day: '3', registrations: 38, payments: 9, trials: 12, keys: 4, renewals: 2 },
    { day: '4', registrations: 61, payments: 18, trials: 10, keys: 9, renewals: 5 },
    { day: '5', registrations: 48, payments: 14, trials: 7, keys: 6, renewals: 3 },
    { day: '6', registrations: 55, payments: 16, trials: 9, keys: 8, renewals: 4 },
    { day: '7', registrations: 43, payments: 11, trials: 5, keys: 3, renewals: 2 },
  ];

  const selectedBotData = bots.find(bot => bot.uid.toString() === selectedBot);

  // Показ экрана загрузки при инициализации
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Инициализация...</h2>
            <p className="text-gray-600">Подключение к Telegram</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Показ ошибки авторизации
  if (!isAuthenticated || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Icon name="AlertTriangle" size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Ошибка авторизации</h2>
            <p className="text-gray-600 mb-4">{error || 'Необходимо запустить приложение через Telegram'}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Конвертируем данные аналитики для графиков
  const chartData = analytics.length > 0 ? analytics.map((item, index) => ({
    day: (index + 1).toString(),
    registrations: item.registrations,
    payments: item.payments,
    trials: item.trials,
    keys: item.keys,
    renewals: item.renewals,
  })) : [
    { day: '1', registrations: 45, payments: 12, trials: 8, keys: 5, renewals: 3 },
    { day: '2', registrations: 52, payments: 15, trials: 6, keys: 7, renewals: 4 },
    { day: '3', registrations: 38, payments: 9, trials: 12, keys: 4, renewals: 2 },
    { day: '4', registrations: 61, payments: 18, trials: 10, keys: 9, renewals: 5 },
    { day: '5', registrations: 48, payments: 14, trials: 7, keys: 6, renewals: 3 },
    { day: '6', registrations: 55, payments: 16, trials: 9, keys: 8, renewals: 4 },
    { day: '7', registrations: 43, payments: 11, trials: 5, keys: 3, renewals: 2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{selectedBotData?.username || 'Bot Analytics Dashboard'}</h1>
            <p className="text-sm md:text-base text-gray-600">Мониторинг и аналитика ботов в реальном времени</p>
            {user && (
              <div className="flex items-center gap-2 mt-2">
                <Icon name="User" size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">{user.first_name} {user.last_name}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Select value={selectedBot} onValueChange={setSelectedBot} disabled={botsLoading}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder={botsLoading ? "Загрузка..." : "Выберите бота"} />
              </SelectTrigger>
              <SelectContent>
                {bots.map((bot) => (
                  <SelectItem key={bot.uid} value={bot.uid.toString()}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${bot.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      @{bot.username}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge variant={selectedBotData?.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {selectedBotData?.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
            </Badge>
            
            {analyticsLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin w-4 h-4 border border-gray-300 border-t-transparent rounded-full"></div>
                Загрузка данных...
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200 animate-scale-in" style={{animationDelay: `${index * 100}ms`}}>
              <CardHeader className="pb-2 md:pb-3">
                <div className="flex items-center justify-between">
                  <Icon name={metric.icon} size={16} className="text-primary md:w-6 md:h-6" />
                  <div className={`text-xs md:text-sm font-medium ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{metric.value.toLocaleString()}</div>
                <p className="text-xs md:text-sm text-gray-600">{metric.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Registrations Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon name="UserPlus" size={18} className="text-blue-500" />
                Регистрации
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-end justify-between gap-1">
                {chartData.map((data, index) => {
                  const maxValue = Math.max(...chartData.map(d => d.registrations));
                  const height = (data.registrations / maxValue) * 100;
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div className="relative group">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                          style={{ height: `${height}px`, minHeight: '3px' }}
                        />
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.registrations}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{data.day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payments Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon name="CreditCard" size={18} className="text-green-500" />
                Оплаты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-end justify-between gap-1">
                {chartData.map((data, index) => {
                  const maxValue = Math.max(...chartData.map(d => d.payments));
                  const height = (data.payments / maxValue) * 100;
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div className="relative group">
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-300 hover:from-green-600 hover:to-green-500 cursor-pointer"
                          style={{ height: `${height}px`, minHeight: '3px' }}
                        />
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.payments}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{data.day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Combined Subscriptions Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Icon name="Key" size={16} className="text-purple-500 md:w-5 md:h-5" />
                Подписки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">Пробники</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Ключи</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Продления</span>
                  </div>
                </div>
                
                <div className="h-24 md:h-32 flex items-end justify-between gap-0.5 md:gap-1">
                  {chartData.map((data, index) => {
                    const maxValue = Math.max(
                      ...chartData.map(d => Math.max(d.trials, d.keys, d.renewals))
                    );
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-1 flex-1">
                        <div className="relative group flex flex-col gap-0.5 w-full">
                          {/* Trials */}
                          <div 
                            className="w-full bg-gradient-to-t from-yellow-500 to-yellow-400 transition-all duration-300 hover:from-yellow-600 hover:to-yellow-500 cursor-pointer rounded-t"
                            style={{ height: `${(data.trials / maxValue) * 25}px`, minHeight: '2px' }}
                          />
                          {/* Keys */}
                          <div 
                            className="w-full bg-gradient-to-t from-purple-500 to-purple-400 transition-all duration-300 hover:from-purple-600 hover:to-purple-500 cursor-pointer"
                            style={{ height: `${(data.keys / maxValue) * 25}px`, minHeight: '2px' }}
                          />
                          {/* Renewals */}
                          <div 
                            className="w-full bg-gradient-to-t from-orange-500 to-orange-400 transition-all duration-300 hover:from-orange-600 hover:to-orange-500 cursor-pointer"
                            style={{ height: `${(data.renewals / maxValue) * 25}px`, minHeight: '2px' }}
                          />
                          
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-1 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <div>П: {data.trials}</div>
                            <div>К: {data.keys}</div>  
                            <div>Пр: {data.renewals}</div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{data.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Icon name="Calendar" size={16} className="md:w-5 md:h-5" />
                Диапазон дат
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                className="rounded-md border-none text-xs md:text-sm mx-auto"
                numberOfMonths={1}
              />
              
              {dateRange?.from && (
                <div className="mt-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                    Период:
                  </div>
                  <div className="text-xs text-gray-600 mb-1 md:mb-2">
                    {dateRange.from.toLocaleDateString('ru-RU')} - {dateRange.to?.toLocaleDateString('ru-RU') || 'выберите дату'}
                  </div>
                  {dateRange.to && (
                    <div className="space-y-0.5 md:space-y-1 text-xs text-gray-600">
                      <div>Дней: {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1}</div>
                      <div>Всего событий: 142</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" size={20} />
                База пользователей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Всего пользователей</span>
                  <span className="font-semibold">12,847</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Активные пользователи</span>
                  <span className="font-semibold">8,432</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Новые за месяц</span>
                  <span className="font-semibold text-green-600">+1,247</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="DollarSign" size={20} />
                Финансовая сводка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Общий доход</span>
                  <span className="font-semibold">₽847,320</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Доход за месяц</span>
                  <span className="font-semibold">₽124,670</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Средний чек</span>
                  <span className="font-semibold text-blue-600">₽2,475</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;