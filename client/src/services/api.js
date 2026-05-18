const BASE_URL = '/api';

async function request(method, path, { body, headers = {}, isFormData = false } = {}) {
  const token = localStorage.getItem('cg_token');
  const config = {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...headers,
    },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return { data, status: response.status };
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
  upload: (path, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('cg_token');
      const xhr = new XMLHttpRequest();

      xhr.open('POST', `${BASE_URL}${path}`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ data, status: xhr.status });
          } else {
            reject({ status: xhr.status, data });
          }
        } catch {
          reject({ status: xhr.status, data: { error: 'Parse error' } });
        }
      });

      xhr.addEventListener('error', () => reject({ status: 0, data: { error: 'Network error' } }));
      xhr.send(formData);
    });
  },
};
