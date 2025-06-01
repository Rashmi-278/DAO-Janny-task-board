
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

  // Quirky DAO Janny notification methods
  notifyTaskAssignment(taskTitle: string, assignee: string) {
    this.addNotification({
      type: 'assignment',
      title: '🧹 DAO Janny Alert!',
      message: `DAO Janny has assigned this task to a member "${taskTitle}" - time to clean up the blockchain! 🚀`,
    });
  }

  notifyStatusChange(taskTitle: string, oldStatus: string, newStatus: string) {
    const quirkyMessages = [
      `The DAO Janny is pleased! "${taskTitle}" moved from ${oldStatus} to ${newStatus} 🎉`,
      `Task update detected! "${taskTitle}" evolved from ${oldStatus} to ${newStatus} ✨`,
      `The blockchain spirits whisper: "${taskTitle}" is now ${newStatus} 👻`,
      `DAO Janny's magic wand worked! "${taskTitle}" transformed to ${newStatus} 🪄`
    ];
    
    const randomMessage = quirkyMessages[Math.floor(Math.random() * quirkyMessages.length)];
    
    this.addNotification({
      type: 'status_change',
      title: '📋 Task Evolution!',
      message: randomMessage,
    });
  }

  notifyTaskUpdate(taskTitle?: string, updateType?: string) {
    const quirkyUpdates = {
      'opted in': `You've volunteered for "${taskTitle}" - the DAO Janny approves! 🙋‍♂️`,
      'unassigned': `"${taskTitle}" is now free-floating in the DAO-verse 🌌`,
      'updated': `DAO Janny tweaked "${taskTitle}" with some blockchain magic ✨`
    };

    this.addNotification({
      type: 'task_update',
      title: '⚡ DAO Janny Update',
      message: quirkyUpdates[updateType as keyof typeof quirkyUpdates] || `"${taskTitle}" has been ${updateType} by the DAO Janny`,
    });
  }

  notifyBlockscoutEvent(event: string, details: string) {
    this.addNotification({
      type: 'blockscout_event',
      title: '🔗 Blockchain Shenanigans',
      message: `The DAO Janny spotted some action: ${event} - ${details}`,
    });
  }
}

export const notificationService = new NotificationService();
