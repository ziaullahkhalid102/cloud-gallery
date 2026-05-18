const { google } = require('googleapis');
const { Readable } = require('stream');

const APP_FOLDER_NAME = 'CloudGallery';

async function getOrCreateAppFolder(oauth2Client) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const res = await drive.files.list({
    q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return folder.data.id;
}

async function uploadFileToDrive(oauth2Client, fileBuffer, fileName, mimeType, folderId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, mimeType, size, createdTime, webViewLink, thumbnailLink, webContentLink',
  });

  // Set file to be viewable by anyone with the link
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Get updated file info with sharing links
  const fileInfo = await drive.files.get({
    fileId: response.data.id,
    fields: 'id, name, mimeType, size, createdTime, webViewLink, thumbnailLink, webContentLink',
  });

  return fileInfo.data;
}

async function listFiles(oauth2Client, folderId, pageSize = 50, pageToken = null) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const params = {
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, webContentLink)',
    pageSize,
    orderBy: 'createdTime desc',
  };

  if (pageToken) {
    params.pageToken = pageToken;
  }

  const res = await drive.files.list(params);
  return res.data;
}

async function deleteFile(oauth2Client, fileId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  await drive.files.delete({ fileId });
}

async function renameFile(oauth2Client, fileId, newName) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const res = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, webContentLink',
  });
  return res.data;
}

async function getFile(oauth2Client, fileId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, webContentLink',
  });
  return res.data;
}

async function getStorageUsage(oauth2Client) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const res = await drive.about.get({
    fields: 'storageQuota',
  });
  return res.data.storageQuota;
}

module.exports = {
  getOrCreateAppFolder,
  uploadFileToDrive,
  listFiles,
  deleteFile,
  renameFile,
  getFile,
  getStorageUsage,
};
