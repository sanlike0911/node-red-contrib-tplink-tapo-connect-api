import axios from 'axios';
import { createCipheriv, randomBytes, createHash, createDecipheriv } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { TapoCredentials, TapoApiRequest } from '../types';

export interface KlapSession {
  authenticated: boolean;
  timeout: number;
  deviceIp: string;
  sessionCookie: string;
  terminalUUID: string;
  key: Buffer;
  iv: Buffer;
  sig: Buffer;
  seq: Buffer;
  version: 'v1' | 'v2';
}

const AES_CIPHER_ALGORITHM = 'aes-128-cbc';

export class KlapAuth {
  private deviceIp: string;
  private credentials: TapoCredentials;
  private session?: KlapSession | undefined;

  constructor(ip: string, credentials: TapoCredentials) {
    this.deviceIp = ip;
    this.credentials = credentials;
  }

  public async authenticate(): Promise<KlapSession> {
    try {
      console.log(`[KLAP-DEBUG] Starting KLAP authentication for device: ${this.deviceIp}`);
      console.log(`[KLAP-DEBUG] Username: ${this.credentials.username}`);
      console.log(`[KLAP-DEBUG] Password length: ${this.credentials.password.length}`);
      
      const terminalUUID = uuidv4() + '-' + Date.now() + '-' + Math.random().toString(36).substring(2);
      console.log(`[KLAP-DEBUG] Generated terminal UUID: ${terminalUUID}`);
      
      // Try KLAP V2 first (modern standard)
      try {
        console.log(`[KLAP-DEBUG] Attempting KLAP V2 authentication`);
        return await this.authenticateV2(terminalUUID);
      } catch (v2Error) {
        console.log(`[KLAP-DEBUG] KLAP V2 failed, checking for V1 fallback:`, v2Error);
        
        // Check if it's a protocol-level error (404) that suggests trying V1
        // KLAP V1 is for legacy firmware compatibility (PKCS#1 v1.5 vs OAEP padding differences)
        // Enable V1 fallback by default for broader device compatibility
        if (this.shouldTryV1(v2Error as Error)) {
          console.log(`[KLAP-DEBUG] Attempting KLAP V1 authentication for legacy device compatibility`);
          try {
            return await this.authenticateV1(terminalUUID);
          } catch (v1Error) {
            console.log(`[KLAP-DEBUG] KLAP V1 also failed:`, v1Error);
            throw new Error(`KLAP authentication failed. V2: ${(v2Error as Error).message}; V1: ${(v1Error as Error).message}`);
          }
        } else {
          console.log(`[KLAP-DEBUG] V2 error does not suggest trying V1 fallback`);
        }
        
        // If not a protocol error, don't try V1
        throw v2Error;
      }
    } catch (error) {
      console.error('KLAP authentication error:', error);
      throw error;
    }
  }

  private async authenticateV2(terminalUUID: string): Promise<KlapSession> {
    // handshake1
    const localSeed = randomBytes(16);
    console.log(`[KLAP-DEBUG] Generated local seed: ${localSeed.toString('hex')}`);
    
    console.log(`[KLAP-DEBUG] Sending handshake1 request to: http://${this.deviceIp}/app/handshake1`);
    const response = await axios.post(`http://${this.deviceIp}/app/handshake1`, localSeed, {
      responseType: 'arraybuffer',
      withCredentials: true,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'Tapo/1.0'
      }
    }).catch((error) => {
      console.error(`[KLAP-DEBUG] Handshake1 request failed:`, {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        code: error?.code,
        message: error?.message,
        headers: error?.response?.headers
      });
      
      if (error?.response?.status === 404) {
        throw new Error(`KLAP V2 protocol not supported by device at ${this.deviceIp}`);
      }
      if (error?.code === 'ECONNREFUSED') {
        throw new Error(`Device at ${this.deviceIp} refused connection - check if device is powered on and IP is correct`);
      }
      if (error?.code === 'ETIMEDOUT') {
        throw new Error(`Connection to device at ${this.deviceIp} timed out - check network connectivity`);
      }
      throw new Error(`KLAP handshake1 failed: ${error?.message || error}`);
    });
      
      console.log(`[KLAP-DEBUG] Handshake1 response status: ${response.status}`);
      console.log(`[KLAP-DEBUG] Response headers:`, response.headers);
      
      const responseBytes = Buffer.from(response.data);
      console.log(`[KLAP-DEBUG] Response data length: ${responseBytes.length} bytes`);
      console.log(`[KLAP-DEBUG] Response data (hex): ${responseBytes.toString('hex')}`);
      
      const setCookieHeader = response.headers['set-cookie']?.[0];
      if (!setCookieHeader) {
        console.error(`[KLAP-DEBUG] No session cookie received from device`);
        throw new Error('No session cookie received from device');
      }
      
      const sessionCookie = setCookieHeader.substring(0, setCookieHeader.indexOf(';'));
      console.log(`[KLAP-DEBUG] Session cookie: ${sessionCookie}`);
      
      const remoteSeed = responseBytes.slice(0, 16);
      const serverHash = responseBytes.slice(16);
      console.log(`[KLAP-DEBUG] Remote seed: ${remoteSeed.toString('hex')}`);
      console.log(`[KLAP-DEBUG] Server hash: ${serverHash.toString('hex')}`);

      const localAuthHash = this.generateAuthHash(this.credentials.username, this.credentials.password);
      console.log(`[KLAP-DEBUG] Local auth hash: ${localAuthHash.toString('hex')}`);
      
      const localSeedAuthHash = this.handshake1AuthHash(localSeed, remoteSeed, localAuthHash);
      console.log(`[KLAP-DEBUG] Local seed auth hash: ${localSeedAuthHash.toString('hex')}`);

      if (!this.compare(localSeedAuthHash, serverHash)) {
        console.error(`[KLAP-DEBUG] Hash comparison failed - authentication error`);
        console.error(`[KLAP-DEBUG] Expected: ${localSeedAuthHash.toString('hex')}`);
        console.error(`[KLAP-DEBUG] Received: ${serverHash.toString('hex')}`);
        throw new Error('Email or password incorrect');
      }
      
      console.log(`[KLAP-DEBUG] Handshake1 hash validation successful`);

      // handshake2
      const payload = this.handshake2AuthHash(localSeed, remoteSeed, localAuthHash);
      console.log(`[KLAP-DEBUG] Handshake2 payload: ${payload.toString('hex')}`);
      console.log(`[KLAP-DEBUG] Sending handshake2 request to: http://${this.deviceIp}/app/handshake2`);
      
      await axios.post(`http://${this.deviceIp}/app/handshake2`, payload, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/octet-stream',
          'User-Agent': 'Tapo/1.0'
        }
      }).catch((error) => {
        console.error(`[KLAP-DEBUG] Handshake2 request failed:`, {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          code: error?.code,
          message: error?.message
        });
        throw new Error(`KLAP handshake2 failed: ${error?.message || error}`);
      });
      
      console.log(`[KLAP-DEBUG] Handshake2 completed successfully`);

      // Create encryption session
      const key = this.deriveKey(localSeed, remoteSeed, localAuthHash);
      const iv = this.deriveIv(localSeed, remoteSeed, localAuthHash);
      const sig = this.deriveSig(localSeed, remoteSeed, localAuthHash);
      const seq = this.deriveSeqFromIv(iv);
      
      console.log(`[KLAP-DEBUG] Derived key: ${key.toString('hex')}`);
      console.log(`[KLAP-DEBUG] Derived IV: ${iv.toString('hex')}`);
      console.log(`[KLAP-DEBUG] Derived signature: ${sig.toString('hex')}`);
      console.log(`[KLAP-DEBUG] Initial sequence: ${seq.toString('hex')}`);

      const session: KlapSession = {
        authenticated: true,
        timeout: Date.now() + (20 * 60 * 1000),
        deviceIp: this.deviceIp,
        sessionCookie,
        terminalUUID,
        key,
        iv,
        sig,
        seq,
        version: 'v2'
      };

      this.session = session;
      console.log(`[KLAP-DEBUG] KLAP V2 session established successfully`);
      return session;
  }

  private async authenticateV1(terminalUUID: string): Promise<KlapSession> {
    console.log(`[KLAP-DEBUG] Starting KLAP V1 authentication`);
    console.log(`[KLAP-DEBUG] V1 uses single handshake step with /app/handshake endpoint`);
    
    // V1 uses single handshake endpoint (not /app/handshake1)
    const localSeed = randomBytes(16);
    console.log(`[KLAP-DEBUG] Generated local seed for V1: ${localSeed.toString('hex')}`);
    
    console.log(`[KLAP-DEBUG] Sending single handshake request to: http://${this.deviceIp}/app/handshake`);
    const response = await axios.post(`http://${this.deviceIp}/app/handshake`, localSeed, {
      responseType: 'arraybuffer',
      withCredentials: true,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'Tapo/1.0'
      }
    }).catch((error) => {
      console.error(`[KLAP-DEBUG] V1 Handshake request failed:`, {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        code: error?.code,
        message: error?.message
      });
      
      if (error?.response?.status === 404) {
        throw new Error(`KLAP V1 protocol not supported by device at ${this.deviceIp}`);
      }
      if (error?.code === 'ECONNREFUSED') {
        throw new Error(`Device at ${this.deviceIp} refused connection - check if device is powered on and IP is correct`);
      }
      if (error?.code === 'ETIMEDOUT') {
        throw new Error(`Connection to device at ${this.deviceIp} timed out - check network connectivity`);
      }
      throw new Error(`KLAP V1 handshake failed: ${error?.message || error}`);
    });
    
    console.log(`[KLAP-DEBUG] V1 Handshake response status: ${response.status}`);
    console.log(`[KLAP-DEBUG] V1 Response headers:`, response.headers);
    
    const responseBytes = Buffer.from(response.data);
    console.log(`[KLAP-DEBUG] V1 Response data length: ${responseBytes.length} bytes`);
    
    const setCookieHeader = response.headers['set-cookie']?.[0];
    if (!setCookieHeader) {
      console.error(`[KLAP-DEBUG] No session cookie received from V1 handshake`);
      throw new Error('No session cookie received from V1 handshake');
    }
    
    const sessionCookie = setCookieHeader.substring(0, setCookieHeader.indexOf(';'));
    console.log(`[KLAP-DEBUG] V1 Session cookie: ${sessionCookie}`);
    
    const remoteSeed = responseBytes.slice(0, 16);
    const serverHash = responseBytes.slice(16);
    console.log(`[KLAP-DEBUG] V1 Remote seed: ${remoteSeed.toString('hex')}`);
    console.log(`[KLAP-DEBUG] V1 Server hash: ${serverHash.toString('hex')}`);

    const localAuthHash = this.generateAuthHash(this.credentials.username, this.credentials.password);
    console.log(`[KLAP-DEBUG] V1 Local auth hash: ${localAuthHash.toString('hex')}`);
    
    const localSeedAuthHash = this.handshake1AuthHash(localSeed, remoteSeed, localAuthHash);
    console.log(`[KLAP-DEBUG] V1 Local seed auth hash: ${localSeedAuthHash.toString('hex')}`);

    if (!this.compare(localSeedAuthHash, serverHash)) {
      console.error(`[KLAP-DEBUG] V1 Hash comparison failed - authentication error`);
      throw new Error('V1 Email or password incorrect');
    }
    
    console.log(`[KLAP-DEBUG] V1 Hash validation successful`);

    // Create encryption session for V1
    const key = this.deriveKey(localSeed, remoteSeed, localAuthHash);
    const iv = this.deriveIv(localSeed, remoteSeed, localAuthHash);
    const sig = this.deriveSig(localSeed, remoteSeed, localAuthHash);
    const seq = this.deriveSeqFromIv(iv);
    
    console.log(`[KLAP-DEBUG] V1 Derived key: ${key.toString('hex')}`);
    console.log(`[KLAP-DEBUG] V1 Derived IV: ${iv.toString('hex')}`);
    console.log(`[KLAP-DEBUG] V1 Derived signature: ${sig.toString('hex')}`);
    console.log(`[KLAP-DEBUG] V1 Initial sequence: ${seq.toString('hex')}`);

    const session: KlapSession = {
      authenticated: true,
      timeout: Date.now() + (20 * 60 * 1000),
      deviceIp: this.deviceIp,
      sessionCookie,
      terminalUUID,
      key,
      iv,
      sig,
      seq,
      version: 'v1'
    };

    this.session = session;
    console.log(`[KLAP-DEBUG] KLAP V1 session established successfully`);
    return session;
  }

  private shouldTryV1(error: Error): boolean {
    // Try V1 if V2 endpoint is not found (404) or method not allowed (405)
    // This indicates the device might be running legacy firmware that only supports KLAP V1
    const errorMessage = error.message.toLowerCase();
    
    // Protocol-level errors that suggest V1 compatibility
    const protocolErrors = [
      'klap v2 protocol not supported',
      '404',
      '405', 
      'not found',
      'method not allowed',
      'handshake1 failed'
    ];
    
    // Connection errors that should not trigger V1 fallback
    const connectionErrors = [
      'econnrefused',
      'etimedout',
      'enotfound',
      'network',
      'dns'
    ];
    
    // Don't try V1 for connection issues
    for (const connError of connectionErrors) {
      if (errorMessage.includes(connError)) {
        console.log(`[KLAP-DEBUG] Connection error detected, skipping V1 fallback: ${connError}`);
        return false;
      }
    }
    
    // Try V1 for protocol-level errors
    for (const protError of protocolErrors) {
      if (errorMessage.includes(protError)) {
        console.log(`[KLAP-DEBUG] Protocol error detected, will try V1 fallback: ${protError}`);
        return true;
      }
    }
    
    console.log(`[KLAP-DEBUG] Error type does not suggest V1 compatibility`);
    return false;
  }

  public async secureRequest<T>(request: TapoApiRequest): Promise<T> {
    if (!this.session) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    this.session.seq = this.incrementSeq(this.session.seq);

    const klapRequest = {
      ...request,
      terminalUUID: this.session.terminalUUID,
      requestTimeMils: Date.now(),
    };

    const encryptedRequest = this.encryptAndSign(klapRequest);
    
    // Use appropriate endpoint based on KLAP version
    const endpoint = this.session.version === 'v1' ? '/app/klap' : '/app/request';
    console.log(`[KLAP-DEBUG] Sending ${this.session.version.toUpperCase()} request to: http://${this.session.deviceIp}${endpoint}`);
    
    const requestConfig: any = {
      method: 'post',
      url: `http://${this.session.deviceIp}${endpoint}`,
      data: encryptedRequest,
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'Cookie': this.session.sessionCookie,
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'Tapo/1.0'
      }
    };

    // V2 uses sequence parameter in URL, V1 does not use sequence parameter
    if (this.session.version === 'v2') {
      requestConfig.params = {
        seq: this.session.seq.readInt32BE()
      };
      console.log(`[KLAP-DEBUG] V2 request with sequence: ${this.session.seq.readInt32BE()}`);
    } else {
      console.log(`[KLAP-DEBUG] V1 request without sequence parameter`);
    }
    
    const response = await axios(requestConfig).catch((error) => {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded (HTTP 429). Device is receiving too many requests. Please wait before retrying.');
      } else if (error.code === 'ECONNRESET') {
        throw new Error('Connection reset by device. This may be due to too many concurrent requests or device overload.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Request timeout. Device may be busy or network connection is slow.');
      } else {
        throw new Error(`KLAP ${this.session?.version?.toUpperCase() || 'UNKNOWN'} request failed: ${error.message || error}`);
      }
    });
    
    let decryptedResponse;
    try {
      decryptedResponse = this.decrypt(response.data);
    } catch (decryptError) {
      throw new Error(`Failed to decrypt KLAP response: ${decryptError instanceof Error ? decryptError.message : decryptError}`);
    }
    
    if (!decryptedResponse) {
      throw new Error('Failed to decrypt response or received empty response');
    }
    
    // Check if decryptedResponse has error_code property before accessing it
    if (typeof decryptedResponse !== 'object' || decryptedResponse === null) {
      throw new Error('Invalid response format - expected object but received: ' + typeof decryptedResponse);
    }
    
    if (decryptedResponse.error_code !== undefined && decryptedResponse.error_code !== 0) {
      // Handle specific KLAP error codes
      if (decryptedResponse.error_code === -1012) {
        throw new Error(`Device busy or command timing issue (KLAP -1012). This may be due to rapid successive commands or device state conflicts.`);
      } else if (decryptedResponse.error_code === -1003) {
        throw new Error(`Invalid parameters or malformed request (KLAP -1003)`);
      } else if (decryptedResponse.error_code === -1001) {
        throw new Error(`Authentication or session error (KLAP -1001)`);
      } else if (decryptedResponse.error_code === 1002) {
        throw new Error(`Session expired or invalid (KLAP 1002). Session needs to be re-established.`);
      } else {
        throw new Error(`KLAP request failed: ${decryptedResponse.error_code}`);
      }
    }
    
    // For successful responses, return the entire response if result is undefined
    // This commonly happens with control commands like set_device_info
    if (decryptedResponse.result === undefined) {
      return decryptedResponse;
    }
    
    return decryptedResponse.result;
  }

  public isAuthenticated(): boolean {
    return !!this.session && this.session.timeout > Date.now();
  }

  public clearSession(): void {
    // Force clear the session without trying to logout
    // This is safer when dealing with session errors
    if (this.session) {
      console.log(`[KLAP-DEBUG] Clearing ${this.session.version.toUpperCase()} session`);
    }
    this.session = undefined;
  }

  public getSessionVersion(): 'v1' | 'v2' | null {
    return this.session?.version || null;
  }

  private encrypt(payload: any): Buffer {
    if (!this.session) throw new Error('No session available');
    
    const payloadJson = JSON.stringify(payload);
    const cipher = createCipheriv(AES_CIPHER_ALGORITHM, this.session.key, this.ivWithSeq(this.session.iv, this.session.seq));
    const ciphertext = cipher.update(Buffer.from(payloadJson, 'utf-8'));
    return Buffer.concat([ciphertext, cipher.final()]);
  }

  private decrypt(payload: Buffer): any {
    if (!this.session) throw new Error('No session available');
    
    try {
      const cipher = createDecipheriv(AES_CIPHER_ALGORITHM, this.session.key, this.ivWithSeq(this.session.iv, this.session.seq));
      const ciphertext = cipher.update(payload.slice(32));
      const decryptedText = Buffer.concat([ciphertext, cipher.final()]).toString();
      
      // Validate JSON before parsing
      if (!decryptedText || decryptedText.trim().length === 0) {
        throw new Error('Empty or invalid decrypted response');
      }
      
      return JSON.parse(decryptedText);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON response from device. This may be due to concurrent requests or device communication issues: ${error.message}`);
      } else if (error instanceof Error && error.message.includes('bad decrypt')) {
        throw new Error('Decryption failed. This may be due to session corruption or concurrent requests.');
      } else {
        throw error;
      }
    }
  }

  private encryptAndSign(payload: any): Buffer {
    if (!this.session) throw new Error('No session available');
    
    const ciphertext = this.encrypt(payload);
    const signature = this.sha256(Buffer.concat([this.session.sig, this.session.seq, ciphertext]));
    return Buffer.concat([signature, ciphertext]);
  }

  private handshake1AuthHash(localSeed: Buffer, remoteSeed: Buffer, authHash: Buffer): Buffer {
    return this.sha256(Buffer.concat([localSeed, remoteSeed, authHash]));
  }

  private handshake2AuthHash(localSeed: Buffer, remoteSeed: Buffer, authHash: Buffer): Buffer {
    return this.sha256(Buffer.concat([remoteSeed, localSeed, authHash]));
  }

  private generateAuthHash(email: string, password: string): Buffer {
    return this.sha256(Buffer.concat([this.sha1(email), this.sha1(password)]));
  }

  private deriveKey(localSeed: Buffer, remoteSeed: Buffer, userHash: Buffer): Buffer {
    return this.sha256(Buffer.concat([Buffer.from('lsk', 'utf-8'), localSeed, remoteSeed, userHash])).slice(0, 16);
  }

  private deriveIv(localSeed: Buffer, remoteSeed: Buffer, userHash: Buffer): Buffer {
    return this.sha256(Buffer.concat([Buffer.from('iv', 'utf-8'), localSeed, remoteSeed, userHash]));
  }

  private deriveSig(localSeed: Buffer, remoteSeed: Buffer, userHash: Buffer): Buffer {
    return this.sha256(Buffer.concat([Buffer.from('ldk', 'utf-8'), localSeed, remoteSeed, userHash])).slice(0, 28);
  }

  private deriveSeqFromIv(iv: Buffer): Buffer {
    return iv.slice(iv.length - 4);
  }

  private ivWithSeq(iv: Buffer, seq: Buffer): Buffer {
    return Buffer.concat([iv.slice(0, 12), seq]);
  }

  private incrementSeq(seq: Buffer): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32BE(seq.readInt32BE() + 1);
    return buffer;
  }

  private sha256(data: string | Buffer): Buffer {
    return createHash('sha256').update(data).digest();
  }

  private sha1(data: string | Buffer): Buffer {
    return createHash('sha1').update(data).digest();
  }

  private compare(b1: Buffer, b2: Buffer): boolean {
    return b1.compare(b2) === 0;
  }
}