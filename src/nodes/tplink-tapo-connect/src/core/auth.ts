import { TapoHttpClient } from './http-client';
import { TapoCrypto } from './crypto';
import { TapoCredentials, TapoHandshakeResponse, TapoApiRequest } from '../types';

export interface AuthSession {
  sessionKey: string;
  sessionId: string;
  token: string;
}

export class TapoAuth {
  private httpClient: TapoHttpClient;
  private credentials: TapoCredentials;
  private session?: AuthSession | undefined;

  constructor(ip: string, credentials: TapoCredentials) {
    this.httpClient = new TapoHttpClient(ip);
    this.credentials = credentials;
  }

  public async authenticate(): Promise<AuthSession> {
    try {
      console.log('Starting authentication...');
      const handshakeResponse = await this.performHandshake();
      console.log('Handshake successful, performing login...');
      const loginResponse = await this.performLogin(handshakeResponse);
      console.log('Login successful');
      
      this.session = {
        sessionKey: handshakeResponse.key,
        sessionId: handshakeResponse.session,
        token: loginResponse.token
      };

      return this.session;
    } catch (error) {
      console.error('Authentication error details:', error);
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  private async performHandshake(): Promise<TapoHandshakeResponse> {
    const keyPair = TapoCrypto.generateKeyPair();
    
    const handshakeRequest: TapoApiRequest = {
      method: 'handshake',
      params: {
        key: TapoCrypto.base64Encode(keyPair.publicKey)
      }
    };

    const response = await this.httpClient.post<TapoHandshakeResponse>(
      '/app',
      handshakeRequest
    );

    return response.result;
  }

  private async performLogin(handshake: TapoHandshakeResponse): Promise<{ token: string }> {
    console.log('Preparing login with username:', this.credentials.username);
    
    // Try different credential encoding methods for compatibility
    const credentials = {
      username: this.credentials.username,
      password: this.credentials.password
    };

    const loginRequest: TapoApiRequest = {
      method: 'login_device',
      params: credentials
    };

    const encryptedRequest = this.encryptRequest(loginRequest, handshake.key);
    
    const response = await this.httpClient.post<{ token: string }>(
      '/app',
      { method: 'securePassthrough', params: encryptedRequest },
      { Cookie: `TP_SESSIONID=${handshake.session}` }
    );

    return response.result;
  }

  public async secureRequest<T>(request: TapoApiRequest): Promise<T> {
    if (!this.session) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const encryptedRequest = this.encryptRequest(request, this.session.sessionKey);
    
    const response = await this.httpClient.post<T>(
      '/app',
      { method: 'securePassthrough', params: encryptedRequest },
      { 
        Cookie: `TP_SESSIONID=${this.session.sessionId}`,
        Authorization: `Bearer ${this.session.token}`
      }
    );

    return response.result;
  }

  private encryptRequest(request: TapoApiRequest, key: string): { request: string } {
    const requestString = JSON.stringify(request);
    const iv = TapoCrypto.generateRandomString(16);
    const encrypted = TapoCrypto.aesEncrypt(requestString, key, iv);
    
    return {
      request: encrypted
    };
  }

  public getSession(): AuthSession | undefined {
    return this.session;
  }

  public isAuthenticated(): boolean {
    return !!this.session;
  }

  public clearSession(): void {
    this.session = undefined as undefined;
  }
}