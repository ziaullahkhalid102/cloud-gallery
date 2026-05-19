import { useState } from 'react';
import { BookOpen, Copy, Check, Code, Key, Zap } from 'lucide-react';

function getBaseUrl() {
  return window.location.origin;
}

const getExamples = () => {
  const baseUrl = getBaseUrl();
  return {
    javascript: {
      label: 'JavaScript',
      lang: 'javascript',
      upload: `const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('fileName', 'my-photo.jpg');

const response = await fetch('${baseUrl}/api/external/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
  },
  body: formData,
});

const data = await response.json();
console.log('Uploaded:', data.file);`,
      list: `const response = await fetch('${baseUrl}/api/external/files', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
  },
});

const data = await response.json();
console.log('Files:', data.files);`,
    },
    nodejs: {
      label: 'Node.js',
      lang: 'javascript',
      upload: `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('./photo.jpg'));
form.append('fileName', 'my-photo.jpg');

const response = await axios.post(
  '${baseUrl}/api/external/upload',
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
  '${baseUrl}/api/external/files',
  {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
    },
  }
);

console.log('Files:', response.data.files);`,
    },
    python: {
      label: 'Python',
      lang: 'python',
      upload: `import requests

url = '${baseUrl}/api/external/upload'
headers = {'X-API-Key': 'YOUR_API_KEY'}

with open('photo.jpg', 'rb') as f:
    files = {'file': ('photo.jpg', f, 'image/jpeg')}
    data = {'fileName': 'my-photo.jpg'}
    response = requests.post(url, headers=headers, files=files, data=data)

print('Uploaded:', response.json()['file'])`,
      list: `import requests

url = '${baseUrl}/api/external/files'
headers = {'X-API-Key': 'YOUR_API_KEY'}

response = requests.get(url, headers=headers)
print('Files:', response.json()['files'])`,
    },
    curl: {
      label: 'cURL',
      lang: 'bash',
      upload: `curl -X POST '${baseUrl}/api/external/upload' \\
  -H 'X-API-Key: YOUR_API_KEY' \\
  -F 'file=@./photo.jpg' \\
  -F 'fileName=my-photo.jpg'`,
      list: `curl '${baseUrl}/api/external/files' \\
  -H 'X-API-Key: YOUR_API_KEY'`,
    },
    php: {
      label: 'PHP',
      lang: 'php',
      upload: `<?php
$ch = curl_init();
$file = new CURLFile('./photo.jpg', 'image/jpeg', 'my-photo.jpg');

curl_setopt_array($ch, [
    CURLOPT_URL => '${baseUrl}/api/external/upload',
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
    CURLOPT_URL => '${baseUrl}/api/external/files',
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
};

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState('javascript');
  const [copiedBlock, setCopiedBlock] = useState(null);

  function copyCode(code, blockId) {
    navigator.clipboard.writeText(code);
    setCopiedBlock(blockId);
    setTimeout(() => setCopiedBlock(null), 2000);
  }

  const examples = getExamples();
  const example = examples[activeTab];
  const baseUrl = getBaseUrl();

  return (
    <div className="api-docs-page">
      <div className="page-header">
        <div>
          <h1>API Documentation</h1>
          <p className="text-muted">Integrate CloudGallery with your apps and services</p>
        </div>
      </div>

      <div className="docs-content">
        {/* Getting Started */}
        <div className="card">
          <div className="card-header">
            <h3><BookOpen size={18} /> Getting Started</h3>
          </div>
          <div className="card-body docs-intro">
            <p>
              CloudGallery provides two ways to integrate file uploads into your applications:
            </p>
            <div className="integration-options">
              <div className="integration-option">
                <Key size={20} />
                <div>
                  <strong>API Key</strong>
                  <p className="text-muted text-sm">For server-side integrations. Use your API key in HTTP request headers.</p>
                </div>
              </div>
              <div className="integration-option">
                <Code size={20} />
                <div>
                  <strong>Embed SDK</strong>
                  <p className="text-muted text-sm">For websites and apps. Paste a script tag to add an upload widget to any page.</p>
                </div>
              </div>
            </div>

            <h4>Base URL</h4>
            <div className="code-block-wrap">
              <button className="copy-btn" onClick={() => copyCode(`${baseUrl}/api/external`, 'baseurl')}>
                {copiedBlock === 'baseurl' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <code className="code-block">{baseUrl}/api/external</code>
            </div>

            <h4>Authentication</h4>
            <p>Include your API key in the request header:</p>
            <code className="code-block">X-API-Key: cg_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxx...</code>

            <h4>Rate Limits</h4>
            <ul>
              <li>200 API requests per hour</li>
              <li>50 uploads per hour</li>
              <li>Max file size: 100 MB</li>
            </ul>
          </div>
        </div>

        {/* Embed / SDK Section */}
        <div className="card">
          <div className="card-header">
            <h3><Zap size={18} /> Embed SDK (No API Key Needed)</h3>
          </div>
          <div className="card-body docs-intro">
            <p>
              The Embed SDK lets you add a file upload widget to any website with just a script tag.
              No API key needed in headers — just use your embed token.
            </p>

            <h4>Quick Start - Widget Mode</h4>
            <p>Add this to your HTML to get an instant upload widget:</p>
            <div className="code-block-wrap">
              <button className="copy-btn" onClick={() => copyCode(`<!-- CloudGallery Upload Widget -->\n<script\n  src="${baseUrl}/sdk/cloudgallery.js"\n  data-token="YOUR_EMBED_TOKEN"\n  data-mode="widget">\n</script>`, 'embed-widget')}>
                {copiedBlock === 'embed-widget' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <pre className="code-block">{`<!-- CloudGallery Upload Widget -->
<script
  src="${baseUrl}/sdk/cloudgallery.js"
  data-token="YOUR_EMBED_TOKEN"
  data-mode="widget">
</script>`}</pre>
            </div>

            <h4>Programmatic Mode</h4>
            <p>For custom integrations, use the SDK programmatically:</p>
            <div className="code-block-wrap">
              <button className="copy-btn" onClick={() => copyCode(`<script src="${baseUrl}/sdk/cloudgallery.js"></script>\n<script>\n  const gallery = new CloudGallery({\n    token: 'YOUR_EMBED_TOKEN'\n  });\n\n  // Upload a file\n  const input = document.querySelector('#fileInput');\n  input.addEventListener('change', async (e) => {\n    const result = await gallery.upload(e.target.files[0]);\n    console.log('Uploaded:', result);\n  });\n\n  // List all files\n  const files = await gallery.listFiles();\n  console.log('Files:', files);\n</script>`, 'embed-prog')}>
                {copiedBlock === 'embed-prog' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <pre className="code-block">{`<script src="${baseUrl}/sdk/cloudgallery.js"></script>
<script>
  const gallery = new CloudGallery({
    token: 'YOUR_EMBED_TOKEN'
  });

  // Upload a file
  const input = document.querySelector('#fileInput');
  input.addEventListener('change', async (e) => {
    const result = await gallery.upload(e.target.files[0]);
    console.log('Uploaded:', result);
  });

  // List all files
  const files = await gallery.listFiles();
  console.log('Files:', files);
</script>`}</pre>
            </div>

            <h4>SDK Options</h4>
            <table className="params-table">
              <thead>
                <tr><th>Option</th><th>Type</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>token</code></td><td>String</td><td>Your embed token (required)</td></tr>
                <tr><td><code>baseUrl</code></td><td>String</td><td>Server URL (auto-detected from script src)</td></tr>
                <tr><td><code>onUpload</code></td><td>Function</td><td>Callback when upload succeeds</td></tr>
                <tr><td><code>onError</code></td><td>Function</td><td>Callback when an error occurs</td></tr>
              </tbody>
            </table>

            <h4>Script Tag Attributes</h4>
            <table className="params-table">
              <thead>
                <tr><th>Attribute</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>data-token</code></td><td>Your embed token</td></tr>
                <tr><td><code>data-mode</code></td><td>Set to &quot;widget&quot; for auto-rendered upload widget</td></tr>
                <tr><td><code>data-container</code></td><td>ID of the container element (optional, auto-creates if not set)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="card">
          <div className="card-header">
            <h3>API Endpoints</h3>
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
    "id": "abc123def456",
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
      "id": "abc123def456",
      "name": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": "1048576",
      "category": "image",
      "webViewLink": "https://drive.google.com/...",
      "createdTime": "2026-01-01T00:00:00.000Z"
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>

        {/* Code Examples */}
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

        {/* Error Codes */}
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
                <tr><td><code>401</code></td><td>Unauthorized - invalid or missing API key / embed token</td></tr>
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
