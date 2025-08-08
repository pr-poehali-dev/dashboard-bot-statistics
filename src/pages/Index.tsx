import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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
  const [selectedBot, setSelectedBot] = useState('bot-1');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const bots = [
    { id: 'bot-1', name: 'Telegram Bot Alpha', status: 'active' },
    { id: 'bot-2', name: 'Discord Bot Beta', status: 'active' },
    { id: 'bot-3', name: 'WhatsApp Bot Gamma', status: 'inactive' },
    { id: 'bot-4', name: 'Slack Bot Delta', status: 'active' },
  ];

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

  const selectedBotData = bots.find(bot => bot.id === selectedBot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bot Analytics Dashboard</h1>
            <p className="text-gray-600">Мониторинг и аналитика ботов в реальном времени</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedBot} onValueChange={setSelectedBot}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Выберите бота" />
              </SelectTrigger>
              <SelectContent>
                {bots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${bot.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {bot.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge variant={selectedBotData?.status === 'active' ? 'default' : 'secondary'}>
              {selectedBotData?.status === 'active' ? 'Активен' : 'Неактивен'}
            </Badge>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200 animate-scale-in" style={{animationDelay: `${index * 100}ms`}}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon name={metric.icon} size={24} className="text-primary" />
                  <div className={`text-sm font-medium ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value.toLocaleString()}</div>
                <p className="text-sm text-gray-600">{metric.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Calendar Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BarChart3" size={20} />
                Динамика метрик по дням
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    Регистрации
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Оплаты
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                    Пробники
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                    Ключи
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    Продления
                  </Button>
                </div>
                
                {/* Simple Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-2 border-b border-gray-200 pb-4">
                  {chartData.map((data, index) => {
                    const maxValue = Math.max(...chartData.map(d => d.registrations));
                    const height = (data.registrations / maxValue) * 200;
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-2 flex-1">
                        <div className="relative group">
                          <div 
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                            style={{ height: `${height}px`, minHeight: '4px' }}
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {data.registrations}
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{data.day}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-sm text-gray-500 text-center">
                  Последние 7 дней • Регистрации пользователей
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Calendar" size={20} />
                Календарь
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border-none"
              />
              
              {selectedDate && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {selectedDate.toLocaleDateString('ru-RU', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Регистрации: 45</div>
                    <div>Оплаты: 12</div>
                    <div>Активации: 8</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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