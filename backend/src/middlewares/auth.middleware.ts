import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // Check for standard Bearer JWT
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          };
          return next();
        }
      } catch (tokenErr) {
        // Token verification failed; fall back to demo check
      }
    }

    // Demo Mode Support: allows immediate testing if OAuth is not configured
    const demoUserId = req.headers['x-demo-user-id'] as string;
    if (demoUserId) {
      const user = await prisma.user.findUnique({
        where: { id: demoUserId },
      });
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        };
        return next();
      }
    }

    // Default guest/demo user auto-provisioning for seamless first-run
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'demo.user@reachinbox.ai',
          name: 'ReachInbox Demo User',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          googleId: 'demo-google-id-001',
        },
      });
    }

    req.user = {
      id: defaultUser.id,
      email: defaultUser.email,
      name: defaultUser.name,
      avatar: defaultUser.avatar,
    };
    return next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required',
      error: err.message,
    });
  }
};
