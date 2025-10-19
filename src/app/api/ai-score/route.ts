import { NextRequest, NextResponse } from 'next/server';
import { uploadToIPFS } from '~/lib/ipfs';
import { AI_ORACLE_API_KEY } from '~/lib/constants';

// Mock AI Oracle for now - replace with Openputer AI SDK later
async function mockAIScore(imageBuffer: Buffer): Promise<number> {
  // Simple mock scoring based on image brightness
  // In production, this would use a real AI model

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock scoring logic based on image properties
  // This is a placeholder - replace with actual AI model
  const mockScore = Math.floor(Math.random() * 10) + 1;

  return mockScore;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Upload to IPFS for permanent storage
    const ipfsHash = await uploadToIPFS(imageBuffer);

    // Get AI score (mock for now)
    const aiScore = await mockAIScore(imageBuffer);

    return NextResponse.json({
      success: true,
      score: aiScore,
      ipfsHash,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Oracle error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
