import bcrypt from "bcryptjs";
import prisma from "../config/database.js";

const SALT_ROUNDS = 10;

export const getAllUsers = async ({ page = 1, limit = 10, search = "" }) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(({ passwordHash, ...u }) => u),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const { passwordHash, ...safe } = user;
  return safe;
};

export const createUser = async ({ fullName, email, phone, password, roleId, status }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone: phone || null,
      passwordHash,
      roleId,
      status: status || "ACTIVE",
    },
    include: { role: true },
  });

  const { passwordHash: _, ...safe } = user;
  return safe;
};

export const updateUser = async (id, { fullName, email, phone, roleId, status, password }) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (email && email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }
  }

  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      const error = new Error("Role not found");
      error.statusCode = 400;
      throw error;
    }
  }

  const data = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (roleId !== undefined) data.roleId = roleId;
  if (status !== undefined) data.status = status;
  if (password) data.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });

  const { passwordHash, ...safe } = user;
  return safe;
};

export const deleteUser = async (id) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.user.delete({ where: { id } });
};

export const getAllRoles = async () => {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
};
