const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, 'notification.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;

const address = process.env.GRPC_ADDRESS || 'localhost:50051';
const client = new notificationProto.NotificationService(address, grpc.credentials.createInsecure());

function notifyEvent({ title, creator }) {
  return new Promise((resolve, reject) => {
    client.NotifyEvent({ title, creator }, (err, response) => {
      if (err) {
        return reject(err);
      }
      resolve(response);
    });
  });
}

function notifyInvitation({ email, eventTitle }) {
  return new Promise((resolve, reject) => {
    client.NotifyInvitation({ email, eventTitle }, (err, response) => {
      if (err) {
        return reject(err);
      }
      resolve(response);
    });
  });
}

module.exports = { notifyEvent, notifyInvitation };
