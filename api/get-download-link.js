// api/get-download-link.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token, productId } = req.query;

  // Verify the token (in production, store in database)
  // For now, decode and validate
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [transactionId, timestamp] = decoded.split('_');
    
    // Check if token is less than 24 hours old
    if (Date.now() - parseInt(timestamp) > 86400000) {
      return res.status(401).json({ error: 'Download link expired' });
    }

    // Product download links (store securely in environment variables)
    const downloadLinks = {
      'product_1': process.env.EBOOK_1_URL || 'https://drive.google.com/...',
      'product_2': process.env.EBOOK_2_URL || 'https://drive.google.com/...',
    };

    const downloadUrl = downloadLinks[productId];
    if (!downloadUrl) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ downloadUrl: downloadUrl });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
