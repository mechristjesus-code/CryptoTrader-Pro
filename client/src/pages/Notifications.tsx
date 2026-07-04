import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Bell, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'deal_completed' | 'loss_threshold' | 'bot_error' | 'market_alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export default function Notifications() {
  const { data: response, refetch } = trpc.notifications.list.useQuery({
    limit: 50,
    unreadOnly: false,
  });

  const notifications = (response?.data || []) as Notification[];
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery();

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Marked as read');
    },
  });

  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Notification deleted');
    },
  });

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'deal_completed':
        return 'bg-green-500/10 text-green-700 border-green-500';
      case 'loss_threshold':
        return 'bg-red-500/10 text-red-700 border-red-500';
      case 'bot_error':
        return 'bg-red-500/10 text-red-700 border-red-500';
      case 'market_alert':
        return 'bg-blue-500/10 text-blue-700 border-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount?.count || 0} unread notifications
            </p>
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead.mutate({ notificationId: notification.id })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification.mutate({ notificationId: notification.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

