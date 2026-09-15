import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.password === (process.env.ADMIN_PASSWORD || 'innoveg123')) {
          return { id: '1', name: 'InnoVeg Admin' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/api/auth/signin',
  },
});

export { handler as GET, handler as POST };
