/**
 * Encryption utilities for secure chat messaging
 * Using Web Crypto API with RSA-OAEP for asymmetric encryption
 */

// Generate a new key pair for encryption
export const generateEncryptionKey = async (): Promise<CryptoKeyPair> => {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
};

// Export public key to string format for storage
export const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey(
    "spki",
    publicKey
  );
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

// Export private key to string format for storage
export const exportPrivateKey = async (privateKey: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey(
    "pkcs8",
    privateKey
  );
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

// Import public key from string format
export const importPublicKey = async (publicKeyString: string): Promise<CryptoKey> => {
  const binaryDer = str2ab(atob(publicKeyString));
  
  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
};

// Import private key from string format
export const importPrivateKey = async (privateKeyString: string): Promise<CryptoKey> => {
  const binaryDer = str2ab(atob(privateKeyString));
  
  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
};

// Encrypt a message using recipient's public key
export const encryptMessage = async (
  message: string,
  publicKey: CryptoKey
): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    data
  );

  return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
};

// Decrypt a message using recipient's private key
export const decryptMessage = async (
  encryptedMessage: string,
  privateKey: CryptoKey
): Promise<string> => {
  try {
    // Validate the private key before attempting decryption
    const isValidKey = await validateKey(privateKey, 'decrypt');
    if (!isValidKey) {
      throw new Error('Invalid private key for decryption');
    }

    // Validate the encrypted message
    if (!encryptedMessage) {
      throw new Error('No encrypted content provided');
    }

    let encryptedData: ArrayBuffer;
    try {
      encryptedData = str2ab(atob(encryptedMessage));
    } catch (error) {
      throw new Error('Invalid encrypted message format');
    }

    // Attempt decryption
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error details:', error);
    throw new Error('Failed to decrypt message: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Helper function to convert string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Helper function to validate a CryptoKey
export const validateKey = async (key: CryptoKey, operation: 'encrypt' | 'decrypt'): Promise<boolean> => {
  try {
    if (!key || typeof key !== 'object' || !('type' in key)) {
      return false;
    }
    
    // Check if the key has the correct usage
    if (!key.usages.includes(operation)) {
      return false;
    }

    // For private keys (decrypt), verify it's a private key
    if (operation === 'decrypt' && key.type !== 'private') {
      return false;
    }

    // For public keys (encrypt), verify it's a public key
    if (operation === 'encrypt' && key.type !== 'public') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Key validation error:', error);
    return false;
  }
}