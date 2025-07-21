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
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      buffer
    );
    return encrypted.toString('base64');
  }

  public static decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      buffer
    );
    return decrypted.toString('utf8');
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