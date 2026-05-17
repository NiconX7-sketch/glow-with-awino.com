// api/get-download.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token, productId } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Decode and validate token
    const decoded = Buffer.from(token, 'base64').toString();
    const [transactionId, timestamp, random] = decoded.split('_');
    
    // Check if token is less than 24 hours old
    if (Date.now() - parseInt(timestamp) > 86400000) {
      return res.status(401).json({ error: 'Download link expired (24h limit)' });
    }

    // Map product IDs to secure Google Drive links (store in Vercel env vars)
    const downloadLinks = {
      'ebook_beginners_guide': process.env.EBOOK_BEGINNERS_URL || 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID',
      'ebook_advanced_guide': process.env.EBOOK_ADVANCED_URL || 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID',
      'ebook_graphic_design': process.env.EBOOK_DESIGN_URL || 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID',
    };

    const downloadUrl = downloadLinks[productId];
    if (!downloadUrl) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Log valid download for analytics (optional)
    console.log(`Download granted: ${productId} for transaction ${transactionId}`);
    
    return res.status(200).json({ 
      success: true,
      downloadUrl: downloadUrl,
      expiresIn: '24 hours'
    });
  } catch (error) {
    console.error('Token error:', error);
    return res.status(401).json({ error: 'Invalid or corrupted token' });
  }
}
