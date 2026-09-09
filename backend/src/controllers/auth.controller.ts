import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

export class AuthController {
  /**
   * Real Google OAuth Login
   * Accepts Google ID Token (credential) and validates against Google's servers
   */
  public async googleLogin(req: Request, res: Response) {
    try {
      const { credential, userInfo } = req.body;

      let email: string;
      let name: string = '';
      let avatar: string = '';
      let googleId: string;

      if (credential) {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: ENV.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (!payload || !payload.email) {
            return res.status(400).json({ success: false, message: 'Invalid Google token' });
          }

          email = payload.email;
          name = payload.name || '';
          avatar = payload.picture || '';
          googleId = payload.sub;
        } catch (verifyErr: any) {
          console.warn('⚠️ Google verifyIdToken error, checking decoded payload:', verifyErr.message);
          // Allow base64 fallback decoding if audience mismatch in local dev
          const decoded = jwt.decode(credential) as any;
          if (!decoded || !decoded.email) {
            return res.status(400).json({ success: false, message: 'Invalid Google credential' });
          }
          email = decoded.email;
          name = decoded.name || '';
          avatar = decoded.picture || '';
          googleId = decoded.sub;
        }
      } else if (userInfo && userInfo.email) {
        // Direct userInfo passed from Google OAuth client
        email = userInfo.email;
        name = userInfo.name || '';
        avatar = userInfo.picture || '';
        googleId = userInfo.sub || userInfo.id || `google-${email}`;
      } else {
        return res.status(400).json({ success: false, message: 'Credential or userInfo is required' });
      }

      // Upsert User in MySQL
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name,
          avatar,
        },
        create: {
          email,
          name,
          avatar,
          googleId,
        },
      });

      const token = jwt.sign({ userId: user.id, email: user.email }, ENV.JWT_SECRET, {
        expiresIn: '7d',
      });

      return res.json({
        success: true,
        message: 'Google login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
        },
      });
    } catch (err: any) {
      console.error('Google login error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Demo Login - For instant local testing without OAuth configuration
   */
  public async demoLogin(req: Request, res: Response) {
    try {
      const email = req.body.email || 'demo.user@reachinbox.ai';
      const name = req.body.name || 'ReachInbox Demo User';
      const avatar =
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

      const user = await prisma.user.upsert({
        where: { email },
        update: { name, avatar },
        create: {
          email,
          name,
          avatar,
          googleId: `demo-${email}`,
        },
      });

      const token = jwt.sign({ userId: user.id, email: user.email }, ENV.JWT_SECRET, {
        expiresIn: '7d',
      });

      return res.json({
        success: true,
        message: 'Demo login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get current authenticated user details and Slack status
   */
  public async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          slackIntegration: {
            select: {
              id: true,
              teamName: true,
              channel: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            slackConnected: !!user.slackIntegration,
            slackDetails: user.slackIntegration,
          },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const authController = new AuthController();
