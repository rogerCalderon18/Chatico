import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 2,
    },
    secret: process.env.NEXTAUTH_SECRET,
    jwt: {
        maxAge: 60 * 60 * 2, 
    },
    pages: {
        signIn: "/auth",
    },    
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    provider: account?.provider
                };
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                ...token,
            };
            return session;
        },
    },
};
