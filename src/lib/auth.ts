import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) return null;

        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
          throw new Error("계정이 잠겨있습니다. 30분 후 다시 시도해주세요.");
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
          const failCount = admin.loginFailCount + 1;
          const updateData: Record<string, unknown> = { loginFailCount: failCount };
          if (failCount >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
          }
          await prisma.admin.update({ where: { id: admin.id }, data: updateData });
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        if (!admin.isApproved) {
          throw new Error("승인 대기 중인 계정입니다.");
        }

        await prisma.admin.update({
          where: { id: admin.id },
          data: { loginFailCount: 0, lockedUntil: null, lastLoginAt: new Date() },
        });

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          userType: "admin",
        };
      },
    }),
    Credentials({
      id: "parent-login",
      name: "Parent Login",
      credentials: {
        phone: { label: "전화번호", type: "tel" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string;
        const password = credentials?.password as string;
        if (!phone || !password) return null;

        const parent = await prisma.parent.findUnique({ where: { phone } });
        if (!parent || !parent.password) return null;

        if (parent.lockedUntil && parent.lockedUntil > new Date()) {
          throw new Error("계정이 잠겨있습니다. 30분 후 다시 시도해주세요.");
        }

        const isValid = await bcrypt.compare(password, parent.password);
        if (!isValid) {
          const failCount = parent.loginFailCount + 1;
          const updateData: Record<string, unknown> = { loginFailCount: failCount };
          if (failCount >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
          }
          await prisma.parent.update({ where: { id: parent.id }, data: updateData });
          throw new Error("전화번호 또는 비밀번호가 올바르지 않습니다.");
        }

        await prisma.parent.update({
          where: { id: parent.id },
          data: { loginFailCount: 0, lockedUntil: null, lastLoginAt: new Date() },
        });

        return {
          id: parent.id,
          name: parent.name,
          email: parent.phone,
          userType: "parent",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = (user as Record<string, unknown>).userType;
        token.role = (user as Record<string, unknown>).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.id = token.id;
        user.userType = token.userType;
        user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
