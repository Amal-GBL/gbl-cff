import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { ALLOWED_DOMAIN, getRole, getBrand } from './brands';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      const email = profile?.email || '';
      // Only allow @goatbrandlabs.com accounts
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) return false;
      const role = getRole(email);
      return role !== 'unauthorized';
    },

    async jwt({ token, profile }) {
      if (profile?.email) {
        token.role = getRole(profile.email);
        token.brand = getBrand(profile.email);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).brand = token.brand;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};
