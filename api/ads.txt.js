// api/ads.txt.js
export default function handler(req, res) {
  // Set the correct content type for a text file
  res.setHeader('Content-Type', 'text/plain');
  
  // Send the required ads.txt content
  res.status(200).send('google.com, pub-5915198635376645, DIRECT, f08c47fec0942fa0');
}
