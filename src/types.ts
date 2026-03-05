export interface Agent {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKey?: string;
  isDefault: boolean;
  costPerToken: number;
  role?: string;
  depth?: number;
  hardBoundaries?: string;
  personality?: string;
  skills?: string[];
  memory?: string;
  soul?: string;
  identity?: string;
  useSoul?: boolean;
  useIdentity?: boolean;
  negativePrompt?: string;
  shortMemory?: string[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  agentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  orderIndex: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  taskId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
  documents?: Document[];
}
