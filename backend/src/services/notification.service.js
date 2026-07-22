import prisma from "../config/database.js";

export const getAllNotifications = async ({ page = 1, limit = 10, status = "", type = "", userId }) => {
  const skip = (page - 1) * limit;

  const where = { userId };
  if (status) where.status = status;
  if (type) where.type = type;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getNotificationById = async (id, userId) => {
  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== userId) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  return notification;
};

export const markAsRead = async (id, userId) => {
  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== userId) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  return prisma.notification.update({
    where: { id },
    data: { status: "READ", readAt: new Date() },
  });
};

export const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, status: "UNREAD" },
    data: { status: "READ", readAt: new Date() },
  });
};

export const deleteNotification = async (id, userId) => {
  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== userId) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  await prisma.notification.delete({ where: { id } });
};

export const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: { userId, status: "UNREAD" },
  });
  return count;
};

export const createNotification = async ({ userId, type, title, message }) => {
  return prisma.notification.create({
    data: {
      userId,
      type: type || "SYSTEM",
      title,
      message,
    },
  });
};
