import { Response } from 'express';

export interface SSEClient {
  id: string;
  role: 'PLAYER' | 'DM' | 'TV';
  res: Response;
}

class SSEHub {
  private clients: SSEClient[] = [];

  public addClient(client: SSEClient) {
    this.clients.push(client);
    
    // Heartbeat timer every 30s to keep connection alive
    const interval = setInterval(() => {
      client.res.write(': heartbeat\n\n');
    }, 30000);

    client.res.on('close', () => {
      clearInterval(interval);
      this.removeClient(client.id);
    });
  }

  public removeClient(id: string) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  public broadcast(event: string, data: any, targetRole?: 'PLAYER' | 'DM' | 'TV') {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      if (!targetRole || client.role === targetRole || targetRole === 'TV') {
        client.res.write(payload);
      }
    });
  }
}

export const sseHub = new SSEHub();
