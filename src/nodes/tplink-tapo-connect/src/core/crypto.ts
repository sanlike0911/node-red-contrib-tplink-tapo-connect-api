import * as crypto from 'crypto';
import CryptoJS from 'crypto-js';

export class TapoCrypto {
  public static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  public static encryptWithPublicKey(data: string, publicKey: string): string {
    const buffer = Buffer.from(data, 'utf8');
    
    // Try OAEP first (modern), then fallback to PKCS#1 v1.5 (legacy)
    try {
      console.log('[CRYPTO-DEBUG] Attempting RSA encryption with OAEP padding');
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha1'  // KLAP uses SHA1 for OAEP
        },
        buffer
      );
      console.log('[CRYPTO-DEBUG] OAEP encryption successful');
      return encrypted.toString('base64');
    } catch (oaepError) {
      console.log('[CRYPTO-DEBUG] OAEP encryption failed, using PKCS#1 v1.5:', oaepError);
      
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        buffer
      );
      console.log('[CRYPTO-DEBUG] PKCS#1 v1.5 encryption successful (legacy mode)');
      return encrypted.toString('base64');
    }
  }

  public static decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Try OAEP first (modern, more secure), then fallback to PKCS#1 v1.5 (legacy compatibility)
    try {
      console.log('[CRYPTO-DEBUG] Attempting RSA decryption with OAEP padding');
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha1'  // KLAP uses SHA1 for OAEP
        },
        buffer
      );
      console.log('[CRYPTO-DEBUG] OAEP decryption successful');
      return decrypted.toString('utf8');
    } catch (oaepError) {
      console.log('[CRYPTO-DEBUG] OAEP decryption failed, trying PKCS#1 v1.5:', oaepError);
      
      try {
        const decrypted = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
          },
          buffer
        );
        console.log('[CRYPTO-DEBUG] PKCS#1 v1.5 decryption successful (legacy mode)');
        return decrypted.toString('utf8');
      } catch (pkcsError) {
        console.error('[CRYPTO-DEBUG] Both OAEP and PKCS#1 v1.5 decryption failed');
        throw new Error(`RSA decryption failed with both padding methods. OAEP: ${oaepError}; PKCS#1: ${pkcsError}`);
      }
    }
  }

  public static aesEncrypt(data: string, key: string, iv: string): string {
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(key), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  }

  public static aesDecrypt(encryptedData: string, key: string, iv: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Utf8.parse(key), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  public static generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  public static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  public static base64Encode(data: string): string {
    return Buffer.from(data, 'utf8').toString('base64');
  }

  public static base64Decode(data: string): string {
    return Buffer.from(data, 'base64').toString('utf8');
  }
}