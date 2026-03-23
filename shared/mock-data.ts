import type { User, Chat, ChatMessage } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'userA@example.com',
    phone: '+15550101',
    preferences: {
      promoEmails: true,
      emailAlerts: true,
      smsAlerts: true,
    },
  },
  {
    id: 'u2',
    email: 'userB@example.com',
    phone: '',
    preferences: {
      promoEmails: false,
      emailAlerts: true,
      smsAlerts: false,
    },
  },
];

export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
  