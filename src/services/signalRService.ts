import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '@/utils/constants';
import { tokenManager } from '@/utils/tokenManager';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds

  /**
   * Get or create the SignalR connection
   */
  async getConnection(): Promise<signalR.HubConnection | null> {
    // If connection exists and is connected, return it
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    // If already connecting, wait a bit and return existing connection
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return this.connection;
    }

    // Start new connection
    return this.startConnection();
  }

  /**
   * Start the SignalR connection
   */
  private async startConnection(): Promise<signalR.HubConnection | null> {
    if (this.isConnecting) return this.connection;

    try {
      this.isConnecting = true;
      const token = tokenManager.getToken();

      if (!token) {
        console.warn('No authentication token found. SignalR connection will not be established.');
        this.isConnecting = false;
        return null;
      }

      const hubUrl = `${API_BASE_URL}/hubs/sales`;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return this.reconnectDelay;
            }
            return null; // Stop reconnecting
          },
        })
        .build();

      // Set up connection event handlers
      this.connection.onclose((error) => {
        console.log('SignalR connection closed', error);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      });

      this.connection.onreconnecting((error) => {
        console.log('SignalR reconnecting...', error);
        this.reconnectAttempts++;
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR reconnected', connectionId);
        this.reconnectAttempts = 0;
      });

      // Start the connection
      await this.connection.start();
      console.log('SignalR connected to sales hub');
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      return this.connection;
    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
      this.isConnecting = false;
      this.connection = null;
      return null;
    }
  }

  /**
   * Stop the SignalR connection
   */
  async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      } finally {
        this.connection = null;
        this.isConnecting = false;
      }
    }
  }

  /**
   * Subscribe to sales events
   */
  async onSalesCreated(callback: (data: any) => void): Promise<void> {
    const connection = await this.getConnection();
    if (connection) {
      connection.on('SalesCreated', callback);
    }
  }

  /**
   * Subscribe to sales finalized events
   */
  async onSalesFinalized(callback: (data: any) => void): Promise<void> {
    const connection = await this.getConnection();
    if (connection) {
      connection.on('SalesFinalized', callback);
    }
  }

  /**
   * Unsubscribe from sales events
   */
  async offSalesCreated(callback: (data: any) => void): Promise<void> {
    if (this.connection) {
      this.connection.off('SalesCreated', callback);
    }
  }

  /**
   * Unsubscribe from sales finalized events
   */
  async offSalesFinalized(callback: (data: any) => void): Promise<void> {
    if (this.connection) {
      this.connection.off('SalesFinalized', callback);
    }
  }

  /**
   * Get connection state
   */
  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }
}

export const signalRService = new SignalRService();

