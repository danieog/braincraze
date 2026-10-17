export type Visibility = "public" | "anonymous" | "private";

export interface Victory {
  id: string;
  userId: string;
  author: string;
  content: string;
  visibility: Visibility;
  createdAt: string;
  reactions: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  anonymous: boolean;
  category: string;
  content: string;
  reactions: number;
  comments: number;
}

export type AIProvider = "groq" | "gemini";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Temporary demo data

const mockVictories: Victory[] = [
  {
    id: "1",
    userId: "demo-user",
    author: "You",
    content: "I finally went to office hours and asked for help!",
    visibility: "public",
    createdAt: new Date().toISOString(),
    reactions: 12,
  },
];

const mockPosts: CommunityPost[] = [
  {
    id: "1",
    author: "Anonymous Possum",
    anonymous: true,
    category: "Campus Life",
    content: "Does anyone else get nervous making friends in college?",
    reactions: 24,
    comments: 5,
  },
];

// Frontend API functions

export async function getVictories(): Promise<Victory[]> {
  return [...mockVictories];
}

export async function createVictory(
  victory: Omit<Victory, "id" | "createdAt" | "reactions">
): Promise<Victory> {
  const newVictory: Victory = {
    ...victory,
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    reactions: 0,
  };

  mockVictories.unshift(newVictory);
  return newVictory;
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  return [...mockPosts];
}

export async function sendOzzieMessage(
  message: string,
  provider: AIProvider
): Promise<ChatMessage> {
  return {
    id: `${Date.now()}`,
    role: "assistant",
    content: `[Demo: ${provider}] Ozzie says: Let's break "${message}" into smaller steps. You've got this!`,
  };
}