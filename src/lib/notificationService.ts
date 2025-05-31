import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'task_update' | 'assignment' | 'status_change' | 'blockscout_event';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: any;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      duration: 4000,
    });

    this.notifyListeners();
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Task-specific notification methods
  notifyTaskAssignment(taskTitle: string, assignee: string) {
    this.addNotification({
      type: 'assignment',
      title: 'Task Assigned',
      message: `"${taskTitle}" has been assigned to ${assignee}`,
    });
  }

  notifyStatusChange(taskTitle: string, oldStatus: string, newStatus: string) {
    this.addNotification({
      type: 'status_change',
      title: 'Status Updated',
      message: `"${taskTitle}" moved from ${oldStatus} to ${newStatus}`,
    });
  }

  notifyTaskUpdate(taskTitle: string, updateType: string) {
    this.addNotification({
      type: 'task_update',
      title: 'Task Updated',
      message: `"${taskTitle}" has been ${updateType}`,
    });
  }

  notifyBlockscoutEvent(event: string, details: string) {
    this.addNotification({
      type: 'blockscout_event',
      title: 'Blockchain Event',
      message: `${event}: ${details}`,
    });
  }
}

export const notificationService = new NotificationService();
