const path = require('path');
const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (!module.paths.includes(serverNodeModules)) {
  module.paths.push(serverNodeModules);
}

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const PROTO_PATH = path.join(__dirname, 'notification.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;
const prisma = new PrismaClient();

async function notifyEvent(call, callback) {
  const { title, creator } = call.request;
  console.log(`[gRPC] NotifyEvent: ${title} by ${creator}`);
  try {
    await prisma.notification.create({
      data: {
        type: 'EVENT_CREATED',
        title,
        creator
      }
    });
    callback(null, { status: 'EVENT_NOTIFIED' });
  } catch (error) {
    console.error('[gRPC] notifyEvent error', error.message);
    callback({ code: grpc.status.INTERNAL, message: 'Could not record event notification' });
  }
}

async function notifyInvitation(call, callback) {
  const { email, eventTitle } = call.request;
  console.log(`[gRPC] NotifyInvitation: ${email} invited to ${eventTitle}`);
  try {
    await prisma.notification.create({
      data: {
        type: 'INVITE_SENT',
        email,
        eventTitle
      }
    });
    callback(null, { status: 'INVITATION_NOTIFIED' });
  } catch (error) {
    console.error('[gRPC] notifyInvitation error', error.message);
    callback({ code: grpc.status.INTERNAL, message: 'Could not record invitation notification' });
  }
}

function main() {
  const server = new grpc.Server();
  server.addService(notificationProto.NotificationService.service, {
    NotifyEvent: notifyEvent,
    NotifyInvitation: notifyInvitation
  });
  const address = process.env.GRPC_ADDRESS || '0.0.0.0:50051';
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error('[gRPC] Failed to bind server', err);
      process.exit(1);
    }
    console.log(`[gRPC] NotificationService running on ${address}`);
    server.start();
  });
}

main();
