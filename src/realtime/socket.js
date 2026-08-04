import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { User } from '../models/user/user.model.js';
import { WorkspaceMember } from '../models/workspace-member/workspaceMember.model.js';
import { ProjectMember } from '../models/project-member/projectMember.model.js';
import { WORKSPACE_PERMISSION, hasPermission } from '../constants/rolePermissions.js';

let io;

export const userRoom = (userId) => `user:${userId}`;
export const workspaceRoom = (workspaceId) => `workspace:${workspaceId}`;

export const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const accessToken = cookie.parse(socket.handshake.headers.cookie ?? '').accessToken;
      if (!accessToken) return next(new Error('Authentication required'));
      const { id } = jwt.verify(accessToken, env.jwt.accessSecret);
      const user = await User.findById(id).select('_id status');
      if (!user || user.status === 'SUSPENDED') return next(new Error('Unauthorized'));
      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const typingTimeouts = new Map();
    socket.join(userRoom(socket.userId));

    socket.on('workspace:join', async (workspaceId, acknowledge) => {
      const member = await WorkspaceMember.findOne({ workspaceId, userId: socket.userId }).select(
        'role'
      );
      const hasProjectScopedAccess =
        !member &&
        (await ProjectMember.exists({
          workspaceId,
          userId: socket.userId,
        }));
      if (
        (!member && !hasProjectScopedAccess) ||
        (member && !hasPermission(member.role, WORKSPACE_PERMISSION.VIEW_CHAT))
      ) {
        acknowledge?.({ ok: false });
        return;
      }
      socket.join(workspaceRoom(workspaceId));
      acknowledge?.({ ok: true });
    });

    socket.on('workspace:leave', (workspaceId) => socket.leave(workspaceRoom(workspaceId)));

    socket.on('chat:typing', (workspaceId) => {
      const room = workspaceRoom(workspaceId);
      if (!socket.rooms.has(room)) return;
      clearTimeout(typingTimeouts.get(workspaceId));
      socket.to(room).emit('chat:typing', { userId: socket.userId, isTyping: true });
      typingTimeouts.set(
        workspaceId,
        setTimeout(() => {
          socket.to(room).emit('chat:typing', { userId: socket.userId, isTyping: false });
          typingTimeouts.delete(workspaceId);
        }, 1500)
      );
    });

    socket.on('chat:stop-typing', (workspaceId) => {
      const room = workspaceRoom(workspaceId);
      if (!socket.rooms.has(room)) return;
      clearTimeout(typingTimeouts.get(workspaceId));
      typingTimeouts.delete(workspaceId);
      socket.to(room).emit('chat:typing', { userId: socket.userId, isTyping: false });
    });

    socket.on('disconnect', () => {
      for (const [workspaceId, timeout] of typingTimeouts) {
        clearTimeout(timeout);
        socket.to(workspaceRoom(workspaceId)).emit('chat:typing', {
          userId: socket.userId,
          isTyping: false,
        });
      }
    });
  });

  return io;
};

export const getSocketServer = () => io;
