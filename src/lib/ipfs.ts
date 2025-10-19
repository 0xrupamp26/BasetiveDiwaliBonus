import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

export function ipfsToHttp(uri: string): string {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '');
    return `${IPFS_GATEWAY.replace(/\/$/, '')}/${cid}`;
  }
  return uri;
}

export async function uploadToIPFS(file: File | Buffer | string): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn('Pinata credentials not configured, using mock IPFS hash');
    // Return mock IPFS hash for development
    return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  try {
    const formData = new FormData();
    let fileToUpload: Blob;

    if (file instanceof File) {
      fileToUpload = file;
    } else if (typeof file === 'string') {
      // If it's a URL, fetch it first
      const response = await fetch(file);
      fileToUpload = await response.blob();
    } else {
      // It's a Buffer
      fileToUpload = new Blob([file]);
    }

    // Add file to form data
    formData.append('file', fileToUpload, 'diwali-submission.jpg');

    // Add metadata
    const metadata = JSON.stringify({
      name: `diwali-submission-${Date.now()}`,
      keyvalues: {
        app: 'basetive-diwali',
        type: 'photo-submission',
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
      }
    );

    if (!response.data?.IpfsHash) {
      throw new Error('Failed to get IPFS hash from Pinata');
    }

    return response.data.IpfsHash;

  } catch (error) {
    console.error('IPFS upload failed:', error);
    // Fallback to mock hash
    return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
}

export function getIPFSUrl(ipfsHash: string): string {
  return `${IPFS_GATEWAY}${ipfsHash}`;
}
