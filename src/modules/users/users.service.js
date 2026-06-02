const bcryptjs = require('bcryptjs');
const prisma = require('../../config/database');

const userSelect = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true };

const createUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw Object.assign(new Error('Email already exists'), { statusCode: 409 });
  const passwordHash = await bcryptjs.hash(data.password, 12);
  return prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role || 'VIEWER', isActive: true },
    select: userSelect,
  });
};

const getAllUsers = async (query) => {
  const where = {};
  if (query.role) where.role = query.role;
  if (query.is_active !== undefined) where.isActive = query.is_active === 'true';
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' }, take: query.limit, skip: query.skip }),
    prisma.user.count({ where }),
  ]);
  return { users, total };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

const updateUser = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name     !== undefined && { name: data.name }),
      ...(data.role     !== undefined && { role: data.role }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: userSelect,
  });
};

const softDeleteUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return prisma.user.update({ where: { id: userId }, data: { isActive: false }, select: userSelect });
};

const activateUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return prisma.user.update({ where: { id: userId }, data: { isActive: true }, select: userSelect });
};

const resetPassword = async (userId, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const passwordHash = await bcryptjs.hash(newPassword, 12);
  return prisma.user.update({ where: { id: userId }, data: { passwordHash }, select: userSelect });
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, softDeleteUser, activateUser, resetPassword };
