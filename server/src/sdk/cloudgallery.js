/**
 * CloudGallery SDK v1.0
 * Embed file uploads into any website using your CloudGallery account.
 *
 * Usage (Script Tag - auto widget):
 *   <script src="https://YOUR_SERVER/sdk/cloudgallery.js"
 *     data-token="cg_embed_xxxx"
 *     data-mode="widget">
 *   </script>
 *
 * Usage (Programmatic):
 *   <script src="https://YOUR_SERVER/sdk/cloudgallery.js"></script>
 *   <script>
 *     const cg = new CloudGallery({ token: 'cg_embed_xxxx' });
 *     cg.upload(file).then(result => console.log(result));
 *   </script>
 */
(function () {
  'use strict';

  var SCRIPT_TAG = document.currentScript;
  var BASE_URL = SCRIPT_TAG
    ? SCRIPT_TAG.src.replace(/\/sdk\/cloudgallery\.js.*$/, '')
    : '';

  function CloudGallery(opts) {
    opts = opts || {};
    this.token = opts.token || (SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-token')) || '';
    this.baseUrl = opts.baseUrl || BASE_URL;
    this.onUpload = opts.onUpload || null;
    this.onError = opts.onError || null;
  }

  CloudGallery.prototype.upload = function (file, fileName) {
    var self = this;
    return new Promise(function (resolve, reject) {
      if (!self.token) {
        var err = new Error('CloudGallery: No token provided.');
        if (self.onError) self.onError(err);
        return reject(err);
      }

      var formData = new FormData();
      formData.append('file', file);
      if (fileName) formData.append('fileName', fileName);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', self.baseUrl + '/api/external/upload');
      xhr.setRequestHeader('X-Embed-Token', self.token);

      xhr.onload = function () {
        try {
          var data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            if (self.onUpload) self.onUpload(data);
            resolve(data);
          } else {
            var error = new Error(data.error || 'Upload failed');
            if (self.onError) self.onError(error);
            reject(error);
          }
        } catch (e) {
          if (self.onError) self.onError(e);
          reject(e);
        }
      };

      xhr.onerror = function () {
        var error = new Error('Network error');
        if (self.onError) self.onError(error);
        reject(error);
      };

      xhr.send(formData);
    });
  };

  CloudGallery.prototype.listFiles = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      if (!self.token) {
        var err = new Error('CloudGallery: No token provided.');
        if (self.onError) self.onError(err);
        return reject(err);
      }

      var xhr = new XMLHttpRequest();
      xhr.open('GET', self.baseUrl + '/api/external/files');
      xhr.setRequestHeader('X-Embed-Token', self.token);

      xhr.onload = function () {
        try {
          var data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            var error = new Error(data.error || 'Failed to list files');
            if (self.onError) self.onError(error);
            reject(error);
          }
        } catch (e) {
          if (self.onError) self.onError(e);
          reject(e);
        }
      };

      xhr.onerror = function () {
        var error = new Error('Network error');
        if (self.onError) self.onError(error);
        reject(error);
      };

      xhr.send();
    });
  };

  CloudGallery.prototype.createWidget = function (containerId) {
    var self = this;
    var container =
      typeof containerId === 'string'
        ? document.getElementById(containerId)
        : containerId;

    if (!container) {
      console.error('CloudGallery: Container not found:', containerId);
      return;
    }

    var widget = document.createElement('div');
    widget.className = 'cg-widget';
    widget.innerHTML =
      '<div class="cg-widget-inner">' +
      '<div class="cg-drop-zone" id="cg-drop-zone">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
      '<p>Drag & drop files here or <label for="cg-file-input" style="color:#6c63ff;cursor:pointer;text-decoration:underline">browse</label></p>' +
      '<input type="file" id="cg-file-input" multiple style="display:none"/>' +
      '</div>' +
      '<div class="cg-status" id="cg-status"></div>' +
      '</div>';

    var style = document.createElement('style');
    style.textContent =
      '.cg-widget{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:480px}' +
      '.cg-widget-inner{border:2px dashed #d1d5db;border-radius:12px;padding:24px;text-align:center;background:#fafbfc;transition:all .2s}' +
      '.cg-widget-inner.dragover{border-color:#6c63ff;background:#f0eeff}' +
      '.cg-drop-zone p{margin:12px 0 0;color:#6b7280;font-size:14px}' +
      '.cg-status{margin-top:12px}.cg-status-item{display:flex;align-items:center;gap:8px;padding:8px 12px;margin:4px 0;background:#fff;border-radius:8px;border:1px solid #e5e7eb;font-size:13px}' +
      '.cg-status-item.success{border-color:#22c55e;color:#166534}.cg-status-item.error{border-color:#ef4444;color:#991b1b}' +
      '.cg-status-item.uploading{border-color:#6c63ff;color:#6c63ff}';

    container.appendChild(style);
    container.appendChild(widget);

    var dropZone = widget.querySelector('#cg-drop-zone');
    var fileInput = widget.querySelector('#cg-file-input');
    var statusEl = widget.querySelector('#cg-status');

    function handleFiles(files) {
      for (var i = 0; i < files.length; i++) {
        uploadFile(files[i]);
      }
    }

    function uploadFile(file) {
      var item = document.createElement('div');
      item.className = 'cg-status-item uploading';
      item.textContent = 'Uploading ' + file.name + '...';
      statusEl.appendChild(item);

      self
        .upload(file)
        .then(function (result) {
          item.className = 'cg-status-item success';
          item.textContent = file.name + ' uploaded successfully';
        })
        .catch(function (err) {
          item.className = 'cg-status-item error';
          item.textContent = file.name + ' failed: ' + err.message;
        });
    }

    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      widget.querySelector('.cg-widget-inner').classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function () {
      widget.querySelector('.cg-widget-inner').classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      widget.querySelector('.cg-widget-inner').classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function () {
      handleFiles(fileInput.files);
      fileInput.value = '';
    });
  };

  // Auto-init widget if data-mode="widget" is on the script tag
  if (SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-mode') === 'widget') {
    var token = SCRIPT_TAG.getAttribute('data-token');
    var containerId = SCRIPT_TAG.getAttribute('data-container') || null;

    document.addEventListener('DOMContentLoaded', function () {
      var cg = new CloudGallery({ token: token });
      if (containerId) {
        cg.createWidget(containerId);
      } else {
        var div = document.createElement('div');
        div.id = 'cloudgallery-widget';
        SCRIPT_TAG.parentNode.insertBefore(div, SCRIPT_TAG.nextSibling);
        cg.createWidget(div);
      }
    });
  }

  // Export globally
  window.CloudGallery = CloudGallery;
})();
