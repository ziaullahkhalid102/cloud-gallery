import { useState } from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';

const examples = {
  javascript: {
    label: 'JavaScript (Fetch)',
    lang: 'javascript',
    upload: `const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('fileName', 'my-photo.jpg');

const response = await fetch('https://your-server.com/api/external/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
  },
  body: formData,
});

const data = await response.json();
console.log('Uploaded:', data.file);`,
    list: `const response = await fetch('https://your-server.com/api/external/files', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
  },
});

const data = await response.json();
console.log('Files:', data.files);`,
  },
  nodejs: {
    label: 'Node.js (Axios)',
    lang: 'javascript',
    upload: `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('./photo.jpg'));
form.append('fileName', 'my-photo.jpg');

const response = await axios.post(
  'https://your-server.com/api/external/upload',
  form,
  {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      ...form.getHeaders(),
    },
  }
);

console.log('Uploaded:', response.data.file);`,
    list: `const axios = require('axios');

const response = await axios.get(
  'https://your-server.com/api/external/files',
  {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
    },
  }
);

console.log('Files:', response.data.files);`,
  },
  php: {
    label: 'PHP (cURL)',
    lang: 'php',
    upload: `<?php
$ch = curl_init();
$file = new CURLFile('./photo.jpg', 'image/jpeg', 'my-photo.jpg');

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://your-server.com/api/external/upload',
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: YOUR_API_KEY',
    ],
    CURLOPT_POSTFIELDS => [
        'file' => $file,
        'fileName' => 'my-photo.jpg',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo 'Uploaded: ' . $data['file']['name'];
?>`,
    list: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://your-server.com/api/external/files',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: YOUR_API_KEY',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data['files']);
?>`,
  },
};

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState('javascript');
  const [copiedBlock, setCopiedBlock] = useState(null);

  function copyCode(code, blockId) {
    navigator.clipboard.writeText(code);
    setCopiedBlock(blockId);
    setTimeout(() => setCopiedBlock(null), 2000);
  }

  const example = examples[activeTab];

  return (
    <div className="api-docs-page">
      <div className="page-header">
        <div>
          <h1>API Documentation</h1>
          <p className="text-muted">Integrate CloudGallery with your apps and services</p>
        </div>
      </div>

      <div className="docs-content">
        <div className="card">
          <div className="card-header">
            <h3><BookOpen size={18} /> Getting Started</h3>
          </div>
          <div className="card-body docs-intro">
            <p>
              Use your API key to upload files directly to your Google Drive from any application.
              All files are stored in your <code>CloudGallery</code> folder.
            </p>
            <h4>Base URL</h4>
            <code className="code-block">https://your-server.com/api/external</code>

            <h4>Authentication</h4>
            <p>Include your API key in the request header:</p>
            <code className="code-block">X-API-Key: YOUR_API_KEY</code>

            <h4>Rate Limits</h4>
            <ul>
              <li>200 API requests per hour</li>
              <li>50 uploads per hour</li>
              <li>Max file size: 100 MB</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Endpoints</h3>
          </div>
          <div className="card-body">
            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method post">POST</span>
                <code>/api/external/upload</code>
              </div>
              <p>Upload a file to the user&apos;s Google Drive.</p>
              <table className="params-table">
                <thead>
                  <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>file</code></td><td>File</td><td>The file to upload (required)</td></tr>
                  <tr><td><code>fileName</code></td><td>String</td><td>Custom file name (optional)</td></tr>
                </tbody>
              </table>

              <h5>Response</h5>
              <pre className="code-block">{`{
  "success": true,
  "file": {
    "id": "abc123",
    "name": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": "1048576",
    "category": "image",
    "webViewLink": "https://drive.google.com/...",
    "webContentLink": "https://drive.google.com/..."
  }
}`}</pre>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/api/external/files</code>
              </div>
              <p>List all files in the user&apos;s CloudGallery folder.</p>

              <h5>Response</h5>
              <pre className="code-block">{`{
  "files": [
    {
      "id": "abc123",
      "name": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": "1048576",
      "category": "image",
      "webViewLink": "https://drive.google.com/...",
      "createdTime": "2025-01-01T00:00:00.000Z"
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Code Examples</h3>
            <div className="tab-group">
              {Object.entries(examples).map(([key, val]) => (
                <button
                  key={key}
                  className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <h4>Upload a File</h4>
            <div className="code-block-wrap">
              <button
                className="copy-btn"
                onClick={() => copyCode(example.upload, 'upload')}
              >
                {copiedBlock === 'upload' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <pre className="code-block">{example.upload}</pre>
            </div>

            <h4>List Files</h4>
            <div className="code-block-wrap">
              <button
                className="copy-btn"
                onClick={() => copyCode(example.list, 'list')}
              >
                {copiedBlock === 'list' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <pre className="code-block">{example.list}</pre>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Error Codes</h3>
          </div>
          <div className="card-body">
            <table className="params-table">
              <thead>
                <tr><th>Code</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>400</code></td><td>Bad request - missing file or invalid parameters</td></tr>
                <tr><td><code>401</code></td><td>Unauthorized - invalid or missing API key</td></tr>
                <tr><td><code>413</code></td><td>File too large (max 100 MB)</td></tr>
                <tr><td><code>429</code></td><td>Rate limit exceeded</td></tr>
                <tr><td><code>500</code></td><td>Internal server error</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
