export class CreateNotificationDto {
  senderId?: string;
  recipientId?: string;
  type: 'message' | 'alert' | 'system' | 'task';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  relatedType?: string;
  relatedId?: string;
}
