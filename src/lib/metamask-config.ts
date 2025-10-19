import { MetaMaskSDK } from '@metamask/sdk';

// Create a simple storage implementation that uses localStorage
const createStorage = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
    removeItem: (key: string) => window.localStorage.removeItem(key),
  };
};

// Only initialize on the client side
let MMSDK: any = null;
let ethereum: any = null;

if (typeof window !== 'undefined') {
  MMSDK = new MetaMaskSDK({
    dappMetadata: {
      name: 'Diwali App',
      url: window.location.href,
    },
    // Force web environment
    shouldShimWeb3: false,
  });
  
  // @ts-ignore - Override the storage with our implementation
  MMSDK._storageManager = createStorage();
  ethereum = MMSDK.getProvider();
}

export { ethereum };
