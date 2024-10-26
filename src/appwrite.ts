import { Client, Account, Databases, Messaging, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_PROJECT_ID); 

export const account = new Account(client);
export const databases = new Databases(client);
export const messaging = new Messaging(client);
export const storage = new Storage(client);